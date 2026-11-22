-- Report orders: one row per Climate Home Inspection report bought on the site.
--
-- The flow (docs/payments.md):
--   1. A signed-in buyer fills in /report/buy. The server writes a row here
--      with status 'awaiting_payment', the price shown to them, and the
--      property address, then sends them to the payment provider's checkout
--      with only this row's id in the checkout's custom data.
--   2. The provider's signed webhook calls apply_payment_event(), which moves
--      the row to 'paid' (or 'refunded') exactly once, however many times the
--      provider resends the same event.
--   3. A person runs the models. scripts/report-order.mjs moves the row to
--      'in_progress', then 'delivered' with the report's file in the private
--      'reports' storage bucket, or to 'cannot_model' (and the payment is
--      refunded through the provider).
--
-- The address is the one thing here the rest of the site never keeps: a report
-- is about one property and cannot be made without it. It is readable only by
-- the buyer and the service role, and the privacy page says so.
--
-- The browser may read its own rows and nothing else. Every write is the
-- server's, with the service role.

create table if not exists public.report_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null default 'home-report',
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'in_progress', 'delivered', 'cannot_model', 'refunded', 'abandoned')),
  -- What the buyer was shown when they ordered.
  price_cents int not null check (price_cents > 0),
  currency text not null default 'USD',
  place_slug text,                               -- the rounded block, when they came from a place page
  address text not null check (length(address) between 5 and 300),
  note text check (note is null or length(note) <= 2000),
  -- What the provider told us.
  provider text,                                 -- 'lemonsqueezy' | 'stripe'
  provider_order_id text,
  provider_order_number text,
  amount_paid_cents int,
  receipt_url text,
  test_mode boolean,
  needs_review text,                             -- set when an event did not fit; a person looks
  -- Fulfilment.
  report_path text,                              -- object path in the 'reports' bucket
  status_note text,                              -- shown to the buyer, e.g. why a place cannot be modelled
  paid_at timestamptz,
  started_at timestamptz,
  delivered_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);
create index if not exists report_orders_user_idx on public.report_orders (user_id, created_at desc);
create index if not exists report_orders_status_idx on public.report_orders (status, paid_at);

alter table public.report_orders enable row level security;
drop policy if exists "report_orders_self_read" on public.report_orders;
create policy "report_orders_self_read" on public.report_orders
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.report_orders from anon, authenticated;

-- Every webhook delivery that passed its signature check, once. The key is the
-- provider's event name and object id (Lemon Squeezy sends no event id), so a
-- resend is recognised and answered without touching the order twice.
create table if not exists public.payment_events (
  provider text not null,
  event_key text not null,
  event_name text not null,
  order_id uuid references public.report_orders(id) on delete set null,
  outcome text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_key)
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

-- Apply one verified payment event to one order, atomically.
--
-- Returns what happened, for the webhook to log and answer with:
--   'paid' | 'refunded'            the order moved
--   'duplicate'                    this delivery was seen before; nothing changed
--   'unknown_order'                no order with that id (recorded, not retried)
--   'wrong_user'                   the event's user is not the order's buyer
--   'review'                       recorded on the order for a person to look at
--   'ignored'                      an event kind this function does not act on
create or replace function public.apply_payment_event(
  p_provider text,
  p_event_key text,
  p_event_name text,
  p_kind text,                 -- 'order_paid' | 'order_refunded'
  p_order_id uuid,
  p_user_id uuid,
  p_provider_order_id text,
  p_provider_order_number text,
  p_amount_cents int,
  p_currency text,
  p_test_mode boolean,
  p_receipt_url text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.report_orders%rowtype;
  v_outcome text;
begin
  -- One delivery, once. A concurrent duplicate waits here on the primary key.
  begin
    insert into public.payment_events (provider, event_key, event_name, order_id, outcome)
    values (p_provider, p_event_key, p_event_name, null, 'pending');
  exception when unique_violation then
    return 'duplicate';
  end;

  select * into o from public.report_orders where id = p_order_id for update;
  if not found then
    v_outcome := 'unknown_order';
  elsif p_user_id is not null and o.user_id <> p_user_id then
    v_outcome := 'wrong_user';
  elsif p_kind = 'order_paid' and exists (
      select 1 from public.report_orders
       where provider = p_provider and provider_order_id = p_provider_order_id and id <> o.id) then
    -- One provider order cannot pay for two of ours.
    update public.report_orders set
      needs_review = format('payment %s (%s) is already on another order', p_provider_order_id, p_provider),
      updated_at = now()
    where id = o.id;
    v_outcome := 'review';
  elsif p_kind = 'order_paid' then
    if o.status = 'awaiting_payment' or o.status = 'abandoned' then
      update public.report_orders set
        status = 'paid',
        provider = p_provider,
        provider_order_id = p_provider_order_id,
        provider_order_number = p_provider_order_number,
        amount_paid_cents = p_amount_cents,
        currency = coalesce(upper(p_currency), currency),
        receipt_url = p_receipt_url,
        test_mode = p_test_mode,
        needs_review = case
          when upper(coalesce(p_currency, o.currency)) <> upper(o.currency) then 'paid in another currency'
          when p_amount_cents is not null and p_amount_cents > o.price_cents then 'paid more than the price shown'
          else null end,
        paid_at = now(),
        updated_at = now()
      where id = o.id;
      v_outcome := 'paid';
    elsif o.provider_order_id = p_provider_order_id then
      v_outcome := 'duplicate';
    else
      -- A second, different payment for an order that is already paid.
      update public.report_orders set
        needs_review = format('second payment %s (%s) for an order already %s', p_provider_order_id, p_provider, o.status),
        updated_at = now()
      where id = o.id;
      v_outcome := 'review';
    end if;
  elsif p_kind = 'order_refunded' then
    if o.status = 'refunded' then
      v_outcome := 'duplicate';
    elsif o.provider_order_id is distinct from p_provider_order_id then
      update public.report_orders set
        needs_review = format('refund for order %s, which is not the payment on record', p_provider_order_id),
        updated_at = now()
      where id = o.id;
      v_outcome := 'review';
    else
      update public.report_orders set status = 'refunded', refunded_at = now(), updated_at = now() where id = o.id;
      v_outcome := 'refunded';
    end if;
  else
    v_outcome := 'ignored';
  end if;

  update public.payment_events
     set outcome = v_outcome,
         order_id = case when v_outcome = 'unknown_order' then null else p_order_id end
   where provider = p_provider and event_key = p_event_key;
  return v_outcome;
end $$;
revoke all on function public.apply_payment_event(text, text, text, text, uuid, uuid, text, text, int, text, boolean, text)
  from public, anon, authenticated;

-- Fulfilment steps, run by a person through scripts/report-order.mjs.
-- Each moves only from the states it names, and says so when it cannot.
create or replace function public.advance_report_order(
  p_order_id uuid,
  p_to text,                   -- 'in_progress' | 'delivered' | 'cannot_model'
  p_report_path text default null,
  p_status_note text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.report_orders%rowtype;
begin
  select * into o from public.report_orders where id = p_order_id for update;
  if not found then return 'unknown_order'; end if;

  if p_to = 'in_progress' and o.status = 'paid' then
    update public.report_orders set status = 'in_progress', started_at = now(), status_note = coalesce(p_status_note, status_note), updated_at = now() where id = o.id;
  elsif p_to = 'delivered' and o.status in ('paid', 'in_progress', 'delivered') then
    if p_report_path is null then return 'needs_report_path'; end if;
    update public.report_orders set status = 'delivered', report_path = p_report_path, delivered_at = now(),
      started_at = coalesce(started_at, now()), status_note = p_status_note, updated_at = now() where id = o.id;
  elsif p_to = 'cannot_model' and o.status in ('paid', 'in_progress') then
    if p_status_note is null then return 'needs_status_note'; end if;
    update public.report_orders set status = 'cannot_model', status_note = p_status_note, updated_at = now() where id = o.id;
  else
    return format('refused: %s -> %s', o.status, p_to);
  end if;
  return p_to;
end $$;
revoke all on function public.advance_report_order(uuid, text, text, text) from public, anon, authenticated;

-- The private bucket that holds finished reports. Downloads go through the
-- server, which checks the buyer and hands out a link that lasts minutes.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('reports', 'reports', false)
    on conflict (id) do nothing;
  end if;
end $$;
