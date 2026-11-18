-- Homes for sale on the map, and model readings per block.
--
-- Climate Inspection D42 and SPEC-LISTINGS.md §3 (18 November 2026):
--   * Listings come from RentCast's free plan, loaded on demand by ZIP code and
--     kept for 30 days. Field names follow the RESO Data Dictionary so an MLS
--     (IDX) feed can replace RentCast without touching the map.
--   * RentCast has no hard cap and bills each request over 50 a month, so the
--     site logs its own requests and stops at 45 in any 31 days, 10 in any
--     day, and never asks one ZIP code twice in a day (take_feed_request).
--   * Only the production site may spend requests (src/lib/listings/store.ts),
--     so there is one log against one database.
--   * A seller can switch our screening off on their listing (screening_hidden).
--
-- Every table here is read and written by the server only, with the service
-- role. Row level security is on and no policy is granted, so the browser's
-- anonymous key can read none of it.

-- One row per listing, as the feed gave it.
create table if not exists public.listings (
  listing_key text primary key,             -- "<source>:<feed id>"
  source text not null,                     -- "RentCast"
  fetched_at timestamptz not null,
  "ListingId" text,                         -- the MLS number, when the feed has one
  "OriginatingSystemName" text,             -- the MLS name
  "StandardStatus" text,
  "ListPrice" numeric,
  "UnparsedAddress" text,
  "City" text,
  "StateOrProvince" text,
  "PostalCode" text not null,
  "Latitude" double precision,
  "Longitude" double precision,
  "PropertyType" text,
  "BedroomsTotal" numeric,
  "BathroomsTotalDecimal" numeric,          -- RentCast gives 2.5; kept as given
  "LivingArea" numeric,                     -- square feet
  "LotSizeSquareFeet" numeric,
  "YearBuilt" int,
  "ListingContractDate" date,
  "DaysOnMarket" int,
  "ListAgentFullName" text,
  "ListOfficeName" text,
  "ListOfficePhone" text,
  screening_hidden boolean not null default false,
  raw jsonb not null                        -- the feed's record, unchanged
);
create index if not exists listings_zip_idx on public.listings ("PostalCode");
alter table public.listings enable row level security;

-- One row per ZIP code asked for, so a second visitor costs nothing. A failed
-- attempt is recorded too (fetched_at stays null), so a ZIP that errors is not
-- asked again for a day.
create table if not exists public.listing_areas (
  zip text primary key,
  source text not null,
  fetched_at timestamptz,
  last_attempt_at timestamptz not null default now(),
  listing_count int not null default 0
);
alter table public.listing_areas enable row level security;

-- Every request ever made to the feed, one row each. Counted over a rolling
-- 31 days, not a calendar month: RentCast bills by its own billing period, and
-- no period is longer than 31 days, so any period sits inside one window.
create table if not exists public.feed_request_log (
  id bigint generated always as identity primary key,
  source text not null,
  zip text not null,
  at timestamptz not null default now()
);
create index if not exists feed_request_log_at_idx on public.feed_request_log (source, at desc);
alter table public.feed_request_log enable row level security;

-- Takes one request for one ZIP code, or says why not. The ceilings are fixed
-- here, in the database, so no caller can raise them:
--   45 in any 31 days  (RentCast's free plan is 50, with no hard cap and a
--                       charge for each request over; five are kept spare)
--   10 in any day      (so one visitor panning the map cannot spend the month)
--   a ZIP code asked in the last 24 hours is not asked again
--   only the source 'RentCast' is accepted
-- An advisory lock per source makes two visitors at once take turns, so they
-- cannot both take the last request.
create or replace function public.take_feed_request(p_source text, p_zip text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  window_cap constant int := 45;
  day_cap constant int := 10;
  used_window int;
  used_day int;
begin
  -- One feed, one spelling: a caller cannot open a second budget by naming
  -- the source differently.
  if p_source is distinct from 'RentCast' then
    return 'unknown_source';
  end if;
  perform pg_advisory_xact_lock(hashtext('feed:' || p_source));

  if exists (
    select 1 from public.listing_areas
    where zip = p_zip and last_attempt_at > now() - interval '24 hours'
      and (fetched_at is null or fetched_at <= now() - interval '30 days')
  ) then
    return 'zip_recent';
  end if;

  select count(*) into used_window from public.feed_request_log
    where source = p_source and at > now() - interval '31 days';
  if used_window >= window_cap then
    return 'window_spent';
  end if;

  select count(*) into used_day from public.feed_request_log
    where source = p_source and at > now() - interval '24 hours';
  if used_day >= day_cap then
    return 'day_spent';
  end if;

  insert into public.feed_request_log (source, zip) values (p_source, p_zip);
  insert into public.listing_areas as a (zip, source, last_attempt_at)
    values (p_zip, p_source, now())
    on conflict (zip) do update set last_attempt_at = now();
  return 'ok';
end;
$$;
revoke all on function public.take_feed_request(text, text) from public, anon, authenticated;

-- Requests used in the current 31-day window, for the map's note.
create or replace function public.feed_requests_used(p_source text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.feed_request_log
  where source = p_source and at > now() - interval '31 days';
$$;
revoke all on function public.feed_requests_used(text) from public, anon, authenticated;

-- Places with model runs, from Climate Inspection's data/derived/places/index.json.
create table if not exists public.model_places (
  place text primary key,
  name text not null,
  box double precision[] not null,          -- [west, south, east, north]
  hazards jsonb not null,                   -- {"flood": "modelled", ...}
  file_sha256 text not null,
  updated_at timestamptz not null default now()
);
alter table public.model_places enable row level security;

-- Model readings per block, from screen_<place>.json. Paid tier: the server
-- gives the values to subscribers only.
create table if not exists public.block_readings (
  slug text primary key,                    -- "39.944,-75.159"
  place text not null references public.model_places(place) on delete cascade,
  readings jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.block_readings enable row level security;
