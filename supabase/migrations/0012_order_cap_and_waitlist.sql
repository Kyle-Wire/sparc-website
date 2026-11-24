-- A weekly order cap Kyle can change without a deploy, and a waitlist for the
-- house report.
--
-- Kyle, 24 November 2026: "if I can only do 5 to 10 a week, then we cap it at
-- 10 and they'll be put on a wait list." One person reads every report before
-- it leaves, so past the cap a buyer joins a list instead of saving a card,
-- and is told plainly how long the wait is likely to be. Kyle invites people
-- from the list in the order they joined (scripts/waitlist.ts invite --next).
--
-- order_settings   one row. weekly_cap is the most orders taken in any seven
--                  days; null means no cap. Default 10. Change it with
--                  `npx tsx scripts/waitlist.ts cap <n|none>`; the site reads
--                  it on every page view, so no redeploy is needed.
-- report_waitlist  one row per person waiting. An invite holds a place for
--                  INVITE_DAYS (src/lib/payments/waitlist.ts, 7 days): while it
--                  is open the invited email may order even when the week is
--                  full or sales are by invitation, and the held place counts
--                  against the cap so nobody else takes it.
-- report_capacity_used()  the orders and held places in a window, counted in
--                  one place so the page, the order route and the script agree.
--
-- The address and email are kept only to run the report the person is waiting
-- for. Nothing here is readable from the browser: row level security is on
-- with no policies, so only the service role (the server and the script) can
-- read or write. The privacy page says so. A person leaves the list with the
-- link in their email (leave_token), and the row is kept as 'left' with the
-- address cleared.

create table if not exists public.order_settings (
  id boolean primary key default true check (id),
  weekly_cap int default 10 check (weekly_cap is null or weekly_cap > 0),
  updated_at timestamptz not null default now()
);
insert into public.order_settings (id, weekly_cap) values (true, 10) on conflict (id) do nothing;
alter table public.order_settings enable row level security;

create table if not exists public.report_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  email text not null check (email = lower(email) and length(email) between 3 and 320 and position('@' in email) > 1),
  -- Cleared (null) when the person leaves the list.
  address text check (address is null or length(address) between 5 and 300),
  place_slug text,
  note text check (note is null or length(note) <= 2000),
  -- The day the buyer's inspection period ends, if they gave one, so Kyle can
  -- see who the wait would fail before inviting in order.
  inspection_deadline date,
  status text not null default 'waiting'
    check (status in ('waiting', 'invited', 'ordered', 'expired', 'left')),
  leave_token uuid not null default gen_random_uuid() unique,
  invited_at timestamptz,
  invite_expires_at timestamptz,
  -- The order placed on this invite, once there is one.
  order_id uuid references public.report_orders(id) on delete set null,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'invited' or (invited_at is not null and invite_expires_at is not null))
);
-- One live place per email: joining again updates the row and keeps the place.
create unique index if not exists report_waitlist_live_email
  on public.report_waitlist (email) where status in ('waiting', 'invited');
create index if not exists report_waitlist_queue on public.report_waitlist (status, created_at);
alter table public.report_waitlist enable row level security;

-- How much of the window is taken: orders in the given states created since
-- p_since, and invites still open whose order (if any) is not yet one of them,
-- so an invited buyer's place is never counted twice.
create or replace function public.report_capacity_used(p_since timestamptz, p_statuses text[])
returns table (orders int, held int)
language sql stable
set search_path = public
as $$
  select
    (select count(*) from public.report_orders o
       where o.status = any (p_statuses) and o.created_at >= p_since)::int,
    (select count(*) from public.report_waitlist w
       where w.status = 'invited' and w.invite_expires_at > now()
         and not exists (select 1 from public.report_orders o
                          where o.id = w.order_id and o.status = any (p_statuses)))::int
$$;
revoke all on function public.report_capacity_used(timestamptz, text[]) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.report_capacity_used(timestamptz, text[]) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.report_capacity_used(timestamptz, text[]) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.report_capacity_used(timestamptz, text[]) to service_role;
  end if;
end $$;
