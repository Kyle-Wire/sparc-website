-- Performance pass driven by Supabase Performance Advisor.
--
-- 1. Wrap auth.uid() in (select auth.uid()) inside RLS policies so the planner
--    evaluates it once per query instead of once per row (advisor: auth_rls_initplan).
-- 2. Consolidate the three overlapping seats SELECT policies into a single
--    self_read policy (advisor: multiple_permissive_policies).
-- 3. Add covering indexes on foreign keys flagged by advisor: unindexed_foreign_keys
--    (orders.user_id, seats.member_id).

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;

create policy "profiles_self_read"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles_self_update"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- 2. subscriptions
-- ---------------------------------------------------------------------------
drop policy if exists "subscriptions_self_read" on public.subscriptions;

create policy "subscriptions_self_read"
  on public.subscriptions for select
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. orders
-- ---------------------------------------------------------------------------
drop policy if exists "orders_self_read" on public.orders;

create policy "orders_self_read"
  on public.orders for select
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. seats — consolidate three overlapping SELECT policies into one
-- ---------------------------------------------------------------------------
drop policy if exists "seats_owner_read"  on public.seats;
drop policy if exists "seats_member_read" on public.seats;
drop policy if exists "seats_owner_write" on public.seats;

create policy "seats_self_read"
  on public.seats for select
  using (
    owner_id  = (select auth.uid())
    or member_id = (select auth.uid())
  );

create policy "seats_owner_insert"
  on public.seats for insert
  with check (owner_id = (select auth.uid()));

create policy "seats_owner_update"
  on public.seats for update
  using      (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "seats_owner_delete"
  on public.seats for delete
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. license_keys
-- ---------------------------------------------------------------------------
drop policy if exists "license_keys_self_read" on public.license_keys;

create policy "license_keys_self_read"
  on public.license_keys for select
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 6. api_keys
-- ---------------------------------------------------------------------------
drop policy if exists "api_keys_self_read"   on public.api_keys;
drop policy if exists "api_keys_self_delete" on public.api_keys;

create policy "api_keys_self_read"
  on public.api_keys for select
  using ((select auth.uid()) = user_id);

create policy "api_keys_self_delete"
  on public.api_keys for delete
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 7. desktop_sessions
-- ---------------------------------------------------------------------------
drop policy if exists "desktop_sessions_self" on public.desktop_sessions;

create policy "desktop_sessions_self"
  on public.desktop_sessions for all
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 8. usage_events
-- ---------------------------------------------------------------------------
drop policy if exists "usage_events_self_read" on public.usage_events;

create policy "usage_events_self_read"
  on public.usage_events for select
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 9. Covering indexes for unindexed foreign keys
-- ---------------------------------------------------------------------------
create index if not exists orders_user_id_idx  on public.orders (user_id);
create index if not exists seats_member_id_idx on public.seats  (member_id);
