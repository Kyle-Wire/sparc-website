-- Database hygiene pass.
--   * Move pgcrypto out of the public schema (Supabase Advisor: extension_in_public).
--     Postgres 13+ ships gen_random_uuid() in core, so existing column defaults
--     keep working without a fully-qualified call.
--   * Add length / value check constraints to user-supplied text columns to bound
--     row size and reject obvious abuse.
--   * Add explicit deny-default INSERT policies on tables that should only be
--     written by the service role (subscriptions, orders, usage_events, license_keys).
--     Service-role connections bypass RLS, so this only locks out anon / authenticated.
--   * Create lemonsqueezy_events for webhook idempotency.

-- ---------------------------------------------------------------------------
-- 1. pgcrypto → extensions schema
-- ---------------------------------------------------------------------------
create schema if not exists extensions;
do $$
begin
  if exists (
    select 1 from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pgcrypto' and n.nspname = 'public'
  ) then
    execute 'alter extension pgcrypto set schema extensions';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Length / value constraints
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_email_len_chk check (char_length(email) <= 320) not valid;
alter table public.profiles validate constraint profiles_email_len_chk;

alter table public.seats
  add constraint seats_email_len_chk check (char_length(email) <= 320) not valid,
  add constraint seats_status_chk check (status in ('invited','active','revoked')) not valid;
alter table public.seats validate constraint seats_email_len_chk;
alter table public.seats validate constraint seats_status_chk;

alter table public.waitlist
  add constraint waitlist_email_len_chk check (char_length(email) <= 320) not valid,
  add constraint waitlist_reason_len_chk check (char_length(coalesce(reason,'')) <= 4000) not valid,
  add constraint waitlist_name_len_chk check (char_length(coalesce(name,'')) <= 200) not valid;
alter table public.waitlist validate constraint waitlist_email_len_chk;
alter table public.waitlist validate constraint waitlist_reason_len_chk;
alter table public.waitlist validate constraint waitlist_name_len_chk;

alter table public.api_keys
  add constraint api_keys_provider_len_chk check (char_length(provider) <= 64) not valid,
  add constraint api_keys_label_len_chk check (char_length(label) <= 64) not valid;
alter table public.api_keys validate constraint api_keys_provider_len_chk;
alter table public.api_keys validate constraint api_keys_label_len_chk;

-- ---------------------------------------------------------------------------
-- 3. Explicit deny-default INSERT/UPDATE policies (service role still bypasses RLS)
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='subscriptions_deny_writes') then
    create policy "subscriptions_deny_writes" on public.subscriptions for insert to anon, authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='subscriptions_deny_updates') then
    create policy "subscriptions_deny_updates" on public.subscriptions for update to anon, authenticated using (false) with check (false);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_deny_writes') then
    create policy "orders_deny_writes" on public.orders for insert to anon, authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_deny_updates') then
    create policy "orders_deny_updates" on public.orders for update to anon, authenticated using (false) with check (false);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='usage_events' and policyname='usage_events_deny_writes') then
    create policy "usage_events_deny_writes" on public.usage_events for insert to anon, authenticated with check (false);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='license_keys' and policyname='license_keys_deny_writes') then
    create policy "license_keys_deny_writes" on public.license_keys for insert to anon, authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='license_keys' and policyname='license_keys_deny_updates') then
    create policy "license_keys_deny_updates" on public.license_keys for update to anon, authenticated using (false) with check (false);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='waitlist' and policyname='waitlist_deny_reads') then
    create policy "waitlist_deny_reads" on public.waitlist for select to anon, authenticated using (false);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Webhook idempotency table
-- ---------------------------------------------------------------------------
create table if not exists public.lemonsqueezy_events (
  event_id text primary key,
  event_name text not null,
  received_at timestamptz not null default now()
);
alter table public.lemonsqueezy_events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lemonsqueezy_events' and policyname='ls_events_deny_all') then
    create policy "ls_events_deny_all" on public.lemonsqueezy_events for all to anon, authenticated using (false) with check (false);
  end if;
end $$;
