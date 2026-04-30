-- Add profession to profiles and propagate from user metadata on signup.

alter table public.profiles
  add column if not exists profession text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, organization, profession)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'profession'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        organization = coalesce(excluded.organization, public.profiles.organization),
        profession = coalesce(excluded.profession, public.profiles.profession),
        updated_at = now();
  return new;
end $$;
