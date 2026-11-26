-- The paid account (thread "Design the paid buyer experience", 25 Nov 2026;
-- Kyle chose "Yes, prototype on a branch"). Two additions:
--
-- 1. public.profiles: what a buyer tells us about themselves so the account,
--    alerts and wording fit them. Every field is optional. The buyer reads
--    and writes only their own row.
--
-- 2. report_orders.progress: which model steps of an order are done, written
--    by scripts/report-order.ts progress (service role only), read by the
--    buyer's tracker. Shape: {"<step>": {"state": "running"|"done"|"skipped", "at": iso}}
--    with step one of place, flood, heat, ground, wind, fire, review.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  phone text check (phone is null or phone ~ '^[0-9+() .-]{7,24}$'),
  units text not null default 'us' check (units in ('us', 'metric')),
  stage text check (stage is null or stage in ('thinking', 'under_contract', 'own', 'rent')),
  worries text check (worries is null or char_length(worries) <= 500),
  alert_watching text not null default 'email' check (alert_watching in ('email', 'email_text', 'off')),
  alert_preparing text not null default 'email' check (alert_preparing in ('email', 'email_text', 'off')),
  also_tell text check (also_tell is null or char_length(also_tell) <= 200),
  medical_power boolean not null default false,
  share_marks_house boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.report_orders
  add column if not exists progress jsonb;

alter table public.report_orders
  drop constraint if exists report_orders_progress_shape;
alter table public.report_orders
  add constraint report_orders_progress_shape check (progress is null or jsonb_typeof(progress) = 'object');
