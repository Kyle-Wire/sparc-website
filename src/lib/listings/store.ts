// Listings and block readings, read and written on the server only.
//
// Every table is behind row level security with no policy, so only the
// service role reaches it (supabase/migrations/0006_listings.sql). The
// RentCast key lives in RENTCAST_API_KEY on the server and never reaches the
// browser or either repository (SPEC-LISTINGS.md §3).
//
// One request to RentCast is spent only when a visitor asks for an area that
// has no listings kept from the last 30 days, and only if this month's
// budget has one left. Otherwise the area says what happened, in words.

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AREA_KEEP_DAYS,
  FEED_SOURCE,
  PAGE_LIMIT,
  areaFresh,
  fromRentCast,
  mayCallFeed,
  type TakeAnswer,
  type ListingRow,
  type PublicListing,
} from "./feed";
import type { BlockReadings, ModelPlace } from "./blocks";

export type AreaStatus =
  | "kept" //            listings from the last 30 days, no request spent
  | "fetched" //         one request spent just now
  | "budget_spent" //    45 used in the last 31 days; loads next month
  | "day_spent" //       10 used in the last day; loads tomorrow
  | "zip_recent" //      this ZIP was tried in the last day and failed
  | "feed_not_connected" // no RentCast key, or not the production site
  | "store_not_connected" // no database on this server
  | "failed"; //         the feed or the database did not answer

export interface Area {
  zip: string;
  status: AreaStatus;
  /** When the listings shown were fetched, if any are shown. */
  fetchedAt: string | null;
  listings: PublicListing[];
}

const RENTCAST_SALE = "https://api.rentcast.io/v1/listings/sale";

function admin() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

const PUBLIC_COLUMNS =
  'listing_key,source,fetched_at,"ListingId","OriginatingSystemName","StandardStatus","ListPrice","UnparsedAddress","City","StateOrProvince","PostalCode","Latitude","Longitude","PropertyType","BedroomsTotal","BathroomsTotalDecimal","LivingArea","LotSizeSquareFeet","YearBuilt","ListingContractDate","DaysOnMarket","ListAgentFullName","ListOfficeName","ListOfficePhone",screening_hidden';

export async function areaListings(zip: string, now = new Date()): Promise<Area> {
  const db = admin();
  if (!db) return { zip, status: "store_not_connected", fetchedAt: null, listings: [] };

  const kept = async (): Promise<PublicListing[]> => {
    const { data } = await db.from("listings").select(PUBLIC_COLUMNS).eq("PostalCode", zip).limit(PAGE_LIMIT);
    return (data ?? []) as unknown as PublicListing[];
  };

  const { data: area, error } = await db.from("listing_areas").select("fetched_at").eq("zip", zip).maybeSingle();
  if (error) return { zip, status: "failed", fetchedAt: null, listings: [] };
  const fetched = (area?.fetched_at as string | null | undefined) ?? null;
  if (areaFresh(fetched, now)) {
    return { zip, status: "kept", fetchedAt: fetched, listings: await kept() };
  }

  // Past here a request would be spent. Older listings, if any, are still
  // shown with their date while the area cannot be refreshed.
  const stale = fetched ? { fetchedAt: fetched, listings: await kept() } : { fetchedAt: null, listings: [] };

  const key = process.env.RENTCAST_API_KEY;
  if (!key || !mayCallFeed(process.env)) return { zip, status: "feed_not_connected", ...stale };

  // The database decides; its ceilings cannot be changed from here.
  const { data: took, error: takeError } = await db.rpc("take_feed_request", { p_source: FEED_SOURCE, p_zip: zip });
  if (takeError) return { zip, status: "failed", ...stale };
  const answer = took as TakeAnswer;
  if (answer === "window_spent") return { zip, status: "budget_spent", ...stale };
  if (answer === "day_spent") return { zip, status: "day_spent", ...stale };
  if (answer !== "ok") return { zip, status: "zip_recent", ...stale };

  let records: unknown[];
  try {
    const url = `${RENTCAST_SALE}?${new URLSearchParams({ zipCode: zip, status: "Active", limit: String(PAGE_LIMIT) })}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-Api-Key": key },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) return { zip, status: "failed", ...stale };
    const body = (await res.json()) as unknown;
    records = Array.isArray(body) ? body : [];
  } catch {
    return { zip, status: "failed", ...stale };
  }

  const fetchedAt = now.toISOString();
  const rows = records
    .map((r) => fromRentCast(r as Parameters<typeof fromRentCast>[0], zip, fetchedAt))
    .filter((r): r is ListingRow => r !== null)
    // screening_hidden is left out of the write so a seller's opt-out survives a refresh.
    .map((r) => {
      const row: Partial<ListingRow> = { ...r };
      delete row.screening_hidden;
      return row;
    });

  if (rows.length) {
    const { error: upErr } = await db.from("listings").upsert(rows, { onConflict: "listing_key" });
    if (upErr) return { zip, status: "failed", ...stale };
  }
  // Listings no longer active in this area are dropped.
  await db.from("listings").delete().eq("PostalCode", zip).lt("fetched_at", fetchedAt);
  await db.from("listing_areas").upsert({ zip, source: FEED_SOURCE, fetched_at: fetchedAt, listing_count: rows.length });

  return { zip, status: "fetched", fetchedAt, listings: await kept() };
}

/** Requests used in the last 31 days, for the map's note. Null when unknown. */
export async function requestsUsed(): Promise<number | null> {
  const db = admin();
  if (!db) return null;
  const { data, error } = await db.rpc("feed_requests_used", { p_source: FEED_SOURCE });
  return error ? null : Number(data);
}

export async function modelPlaces(): Promise<ModelPlace[]> {
  const db = admin();
  if (!db) return [];
  const { data } = await db.from("model_places").select("place,name,box,hazards");
  return (data ?? []) as ModelPlace[];
}

export async function readingsFor(slugs: string[]): Promise<Map<string, BlockReadings>> {
  const db = admin();
  const out = new Map<string, BlockReadings>();
  if (!db || slugs.length === 0) return out;
  const { data } = await db.from("block_readings").select("slug,readings").in("slug", [...new Set(slugs)].slice(0, 1000));
  for (const row of data ?? []) out.set(row.slug as string, row.readings as BlockReadings);
  return out;
}

/** True for a signed-in visitor with an active subscription. Sign-in is not
 *  offered on the site yet, so today this is false for everyone. */
export async function isSubscriber(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.status === "active" || data?.status === "on_trial";
  } catch {
    return false;
  }
}

export { AREA_KEEP_DAYS };
