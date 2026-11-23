-- House reports are charged when the report is ready, not when it is ordered.
--
-- Kyle, 22 November 2026 (payments thread): "When the report is ready". The
-- buyer saves a card at order (a Stripe Checkout Session in setup mode, no
-- money moves). A person makes the report. scripts/report-order.ts deliver
-- uploads it and charges the saved card; the download unlocks only once that
-- charge succeeds. If the card fails, the buyer pays from a link in their
-- account, and the report stays locked until they do. docs/payments.md has
-- the whole flow.
--
-- The states, in order:
--   awaiting_card   the buyer was sent to Stripe to save a card
--   card_saved      card saved, nothing charged: the order is in
--   in_progress     a person is running the models
--   charging        the report is uploaded and the card is being charged
--   payment_failed  the charge did not go through; the buyer can pay from their account
--   delivered       paid, and the report is unlocked
--   cannot_model    we could not make it; nothing was charged
--   cancelled       the buyer cancelled before paying; nothing was charged
--   refunded        paid, then refunded in full
--   abandoned       the checkout did not open, or was never finished
--
-- 0007's 'awaiting_payment' and 'paid' are mapped below. No real order was
-- ever taken under them (checkout was never switched on in Production).

alter table public.report_orders drop constraint if exists report_orders_status_check;
update public.report_orders set status = 'awaiting_card' where status = 'awaiting_payment';
update public.report_orders set status = 'card_saved' where status = 'paid';
alter table public.report_orders alter column status set default 'awaiting_card';
alter table public.report_orders add constraint report_orders_status_check
  check (status in ('awaiting_card', 'card_saved', 'in_progress', 'charging', 'payment_failed', 'delivered', 'cannot_model', 'cancelled', 'refunded', 'abandoned'));

alter table public.report_orders
  add column if not exists provider_customer_id text,      -- Stripe: cus_…
  add column if not exists provider_setup_id text,         -- Stripe: the SetupIntent (seti_…) that saved the card
  add column if not exists card_saved_at timestamptz,
  add column if not exists charge_attempts int not null default 0,
  add column if not exists charge_error text,              -- the card's own reason, shown to the buyer
  add column if not exists charge_attempted_at timestamptz;

create index if not exists report_orders_customer_idx on public.report_orders (user_id, provider_customer_id);

drop function if exists public.apply_payment_event(text, text, text, text, uuid, uuid, text, text, int, text, boolean, text);

-- Apply one verified payment event to one order, atomically.
--
-- p_kind:
--   'card_saved'      Checkout (setup mode) finished: the order is in.
--   'order_paid'      the PaymentIntent succeeded: the report unlocks.
--   'charge_failed'   the PaymentIntent failed: the buyer is asked to pay.
--   'order_refunded'  a full refund of the payment on record.
--
-- Returns: 'card_saved' | 'delivered' | 'charge_failed' | 'refunded' when the
-- order moved; 'duplicate' when this delivery (or this payment) was seen
-- before; 'noted' when a failure was recorded on an order already waiting for
-- payment; 'unknown_order'; 'wrong_user'; 'review' when a person must look
-- (needs_review says why); 'ignored'.
create or replace function public.apply_payment_event(
  p_provider text,
  p_event_key text,
  p_event_name text,
  p_kind text,
  p_order_id uuid,
  p_user_id uuid,
  p_provider_order_id text,        -- the PaymentIntent (payments, failures, refunds)
  p_provider_order_number text,    -- the Checkout Session or charge, for a person
  p_amount_cents int,
  p_currency text,
  p_test_mode boolean,
  p_receipt_url text,
  p_customer_id text default null,
  p_setup_id text default null,
  p_error text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.report_orders%rowtype;
  v_outcome text;
begin
  begin
    insert into public.payment_events (provider, event_key, event_name, order_id, outcome)
    values (p_provider, p_event_key, p_event_name, null, 'pending');
  exception when unique_violation then
    return 'duplicate';
  end;

  if p_order_id is not null then
    select * into o from public.report_orders where id = p_order_id for update;
  elsif p_kind = 'order_refunded' then
    select * into o from public.report_orders
     where provider = p_provider and provider_order_id = p_provider_order_id for update;
  end if;

  if o.id is null then
    v_outcome := 'unknown_order';
  elsif p_user_id is not null and o.user_id <> p_user_id then
    v_outcome := 'wrong_user';

  elsif p_kind = 'card_saved' then
    if o.status in ('awaiting_card', 'abandoned') then
      update public.report_orders set
        status = 'card_saved',
        provider = p_provider,
        provider_customer_id = p_customer_id,
        provider_setup_id = p_setup_id,
        provider_order_number = p_provider_order_number,
        test_mode = p_test_mode,
        card_saved_at = now(),
        updated_at = now()
      where id = o.id;
      v_outcome := 'card_saved';
    elsif o.provider_setup_id is not distinct from p_setup_id then
      v_outcome := 'duplicate';
    else
      update public.report_orders set
        needs_review = format('a second card (%s) was saved for an order already %s', p_setup_id, o.status),
        updated_at = now()
      where id = o.id;
      v_outcome := 'review';
    end if;

  elsif p_kind = 'order_paid' then
    if exists (select 1 from public.report_orders
                where provider = p_provider and provider_order_id = p_provider_order_id and id <> o.id) then
      update public.report_orders set
        needs_review = format('payment %s is already on another order', p_provider_order_id),
        updated_at = now()
      where id = o.id;
      v_outcome := 'review';
    elsif o.provider_order_id = p_provider_order_id and o.status in ('delivered', 'refunded') then
      -- The same payment again (the deliver script records it, then the webhook does).
      -- Fill in a receipt the first record did not have.
      update public.report_orders set receipt_url = coalesce(receipt_url, p_receipt_url) where id = o.id and receipt_url is null;
      v_outcome := 'duplicate';
    elsif o.status in ('charging', 'payment_failed') and o.report_path is not null then
      update public.report_orders set
        status = 'delivered',
        provider_order_id = p_provider_order_id,
        amount_paid_cents = p_amount_cents,
        currency = coalesce(upper(p_currency), currency),
        receipt_url = coalesce(p_receipt_url, receipt_url),
        test_mode = coalesce(test_mode, p_test_mode),
        charge_error = null,
        needs_review = case
          when upper(coalesce(p_currency, o.currency)) <> upper(o.currency) then 'paid in another currency'
          when p_amount_cents is not null and p_amount_cents < o.price_cents then 'paid less than the price shown'
          else null end,
        paid_at = now(),
        delivered_at = now(),
        updated_at = now()
      where id = o.id;
      v_outcome := 'delivered';
    else
      -- Money arrived for an order that was not waiting for it: a second payment,
      -- or a payment before the report was ready. A person looks; it may need refunding.
      update public.report_orders set
        needs_review = format('payment %s arrived while the order was %s', p_provider_order_id, o.status),
        updated_at = now()
      where id = o.id;
      v_outcome := 'review';
    end if;

  elsif p_kind = 'charge_failed' then
    if o.status = 'charging' then
      update public.report_orders set
        status = 'payment_failed',
        charge_error = left(coalesce(p_error, 'The card was declined.'), 500),
        charge_attempts = charge_attempts + 1,
        updated_at = now()
      where id = o.id;
      v_outcome := 'charge_failed';
    elsif o.status = 'payment_failed' then
      -- Another failed try (a retry, or the buyer's own attempt on the pay page).
      update public.report_orders set
        charge_error = left(coalesce(p_error, charge_error), 500),
        updated_at = now()
      where id = o.id;
      v_outcome := 'noted';
    else
      v_outcome := 'ignored';
    end if;

  elsif p_kind = 'order_refunded' then
    if o.status = 'refunded' then
      v_outcome := 'duplicate';
    elsif o.provider_order_id is null then
      v_outcome := 'review';
    elsif o.provider_order_id is distinct from p_provider_order_id then
      update public.report_orders set
        needs_review = format('refund for payment %s, which is not the payment on record', p_provider_order_id),
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
         order_id = o.id
   where provider = p_provider and event_key = p_event_key;
  return v_outcome;
end $$;
revoke all on function public.apply_payment_event(text, text, text, text, uuid, uuid, text, text, int, text, boolean, text, text, text, text)
  from public, anon, authenticated;

-- Fulfilment steps, run by a person through scripts/report-order.ts.
--   in_progress    from card_saved
--   charging       from card_saved, in_progress, payment_failed or charging
--                  (a retry); needs the report's path. Only a payment moves an
--                  order on to delivered (apply_payment_event).
--   cannot_model   from card_saved or in_progress; needs a note. Nothing was charged.
--   cancelled      the buyer asked to cancel: from any state before payment.
create or replace function public.advance_report_order(
  p_order_id uuid,
  p_to text,
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

  if p_to = 'in_progress' and o.status = 'card_saved' then
    update public.report_orders set status = 'in_progress', started_at = now(),
      status_note = coalesce(p_status_note, status_note), updated_at = now() where id = o.id;
  elsif p_to = 'charging' and o.status in ('card_saved', 'in_progress', 'payment_failed', 'charging') then
    if p_report_path is null then return 'needs_report_path'; end if;
    if o.provider_customer_id is null then return 'no_saved_card'; end if;
    update public.report_orders set status = 'charging', report_path = p_report_path,
      started_at = coalesce(started_at, now()), status_note = p_status_note,
      charge_attempted_at = now(), updated_at = now() where id = o.id;
  elsif p_to = 'cannot_model' and o.status in ('card_saved', 'in_progress') then
    if p_status_note is null then return 'needs_status_note'; end if;
    update public.report_orders set status = 'cannot_model', status_note = p_status_note, updated_at = now() where id = o.id;
  elsif p_to = 'cancelled' and o.status in ('awaiting_card', 'card_saved', 'in_progress', 'payment_failed') then
    update public.report_orders set status = 'cancelled', status_note = coalesce(p_status_note, status_note), updated_at = now() where id = o.id;
  else
    return format('refused: %s -> %s', o.status, p_to);
  end if;
  return p_to;
end $$;
revoke all on function public.advance_report_order(uuid, text, text, text) from public, anon, authenticated;
