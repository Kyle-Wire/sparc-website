-- Homes for sale on the map, and model readings per block.
--
-- Climate Inspection D42 and SPEC-LISTINGS.md §3 (18 November 2026):
--   * Listings come from RentCast's free plan, loaded on demand by ZIP code and
--     kept for 30 days. Field names follow the RESO Data Dictionary so an MLS
--     (IDX) feed can replace RentCast without touching the map.
--   * RentCast has no hard cap and bills each request over 50 a month, so the
--     site counts its own requests and stops at 45 (take_feed_request below).
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

-- One row per ZIP code asked for, so a second visitor costs nothing.
create table if not exists public.listing_areas (
  zip text primary key,
  source text not null,
  fetched_at timestamptz not null,
  listing_count int not null
);
alter table public.listing_areas enable row level security;

-- Requests spent per calendar month (UTC), against the site's own cap.
create table if not exists public.feed_requests (
  source text not null,
  month text not null,                      -- "2026-11"
  used int not null default 0,
  primary key (source, month)
);
alter table public.feed_requests enable row level security;

-- Takes one request from this month's budget. Returns true if one was left.
-- Done in one statement so two visitors at once cannot both take the last one.
create or replace function public.take_feed_request(p_source text, p_month text, p_cap int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  taken int;
begin
  insert into public.feed_requests as f (source, month, used)
  values (p_source, p_month, 1)
  on conflict (source, month) do update set used = f.used + 1
    where f.used < p_cap
  returning used into taken;
  return taken is not null and taken <= p_cap;
end;
$$;
revoke all on function public.take_feed_request(text, text, int) from public, anon, authenticated;

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
