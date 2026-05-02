-- Security hardening for SECURITY DEFINER functions.
-- Supabase Security Advisor flagged these as executable by PUBLIC / authenticated.
-- They are only ever invoked by:
--   * encrypt_api_key  -> the service-role admin client (see src/app/api/account/api-keys/route.ts)
--   * handle_new_user  -> the on_auth_user_created trigger (runs as function owner)
-- so we can revoke EXECUTE from anon / authenticated / PUBLIC without breaking callers.

revoke all on function public.encrypt_api_key(uuid, text, text, text) from public;
revoke all on function public.encrypt_api_key(uuid, text, text, text) from anon;
revoke all on function public.encrypt_api_key(uuid, text, text, text) from authenticated;
grant execute on function public.encrypt_api_key(uuid, text, text, text) to service_role;
comment on function public.encrypt_api_key(uuid, text, text, text) is
  'BYOK secret writer. SECURITY DEFINER. Service-role only — do NOT grant to anon/authenticated.';

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
comment on function public.handle_new_user() is
  'Trigger function for on_auth_user_created. SECURITY DEFINER. No direct callers — runs as owner via trigger.';
