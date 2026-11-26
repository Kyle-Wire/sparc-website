-- The paid account (thread "Design the paid buyer experience", 25 Nov 2026;
-- Kyle chose "Yes, prototype on a branch"). Two additions:
--
-- 1. public.profiles (existing table): what a buyer tells us about themselves so the account,
--    alerts and wording fit them. Every field is optional. The buyer reads
--    and writes only their own row.
--
-- 2. report_orders.progress: which model steps of an order are done, written
--    by scripts/report-order.ts progress (service role only), read by the
--    buyer's tracker. Shape: {"<step>": {"state": "running"|"done"|"skipped", "at": iso}}
--    with step one of place, flood, heat, ground, wind, fire, review.

-- public.profiles already exists (0001: id = auth.users.id, one row per user,
-- made on signup by handle_new_user). This adds the buyer fields to it; it
-- keeps the existing key, columns, trigger and self read/update policies.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists phone text,
  add column if not exists units text not null default 'us',
  add column if not exists stage text,
  add column if not exists worries text,
  add column if not exists alert_watching text not null default 'email',
  add column if not exists alert_preparing text not null default 'email',
  add column if not exists also_tell text,
  add column if not exists medical_power boolean not null default false,
  add column if not exists share_marks_house boolean not null default false;

alter table public.profiles drop constraint if exists profiles_display_name_chk;
alter table public.profiles add constraint profiles_display_name_chk check (display_name is null or char_length(display_name) <= 80);
alter table public.profiles drop constraint if exists profiles_phone_chk;
alter table public.profiles add constraint profiles_phone_chk check (phone is null or phone ~ '^[0-9+() .-]{7,24}$');
alter table public.profiles drop constraint if exists profiles_units_chk;
alter table public.profiles add constraint profiles_units_chk check (units in ('us', 'metric'));
alter table public.profiles drop constraint if exists profiles_stage_chk;
alter table public.profiles add constraint profiles_stage_chk check (stage is null or stage in ('thinking', 'under_contract', 'own', 'rent'));
alter table public.profiles drop constraint if exists profiles_worries_chk;
alter table public.profiles add constraint profiles_worries_chk check (worries is null or char_length(worries) <= 500);
alter table public.profiles drop constraint if exists profiles_alerts_chk;
alter table public.profiles add constraint profiles_alerts_chk check (alert_watching in ('email', 'email_text', 'off') and alert_preparing in ('email', 'email_text', 'off'));
alter table public.profiles drop constraint if exists profiles_also_tell_chk;
alter table public.profiles add constraint profiles_also_tell_chk check (also_tell is null or char_length(also_tell) <= 200);

-- An upsert needs an insert policy even when the row exists (a user from
-- before the signup trigger may have none). Own row only.
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

alter table public.report_orders
  add column if not exists progress jsonb;

alter table public.report_orders
  drop constraint if exists report_orders_progress_shape;
alter table public.report_orders
  add constraint report_orders_progress_shape check (progress is null or jsonb_typeof(progress) = 'object');
