// A listing as the site keeps it, and how RentCast's record becomes one.
//
// Field names follow the RESO Data Dictionary, so an MLS (IDX) feed can take
// RentCast's place without touching the map (Climate Inspection D42,
// SPEC-LISTINGS.md §3). RentCast's fields are from its Property Listings
// Schema (developers.rentcast.io/reference/property-listings-schema, opened 18
// November 2026). Nothing here changes a value: a listing is shown as its feed
// gave it, with the feed named.

export const FEED_SOURCE = "RentCast";

/** The site's own ceilings, for the map's words only. The ones that count are
 *  fixed inside the database function take_feed_request
 *  (supabase/migrations/0006_listings.sql), where no caller can raise them.
 *  RentCast's free plan is 50 requests a month, with no hard cap and a charge
 *  for each request over; five are kept spare. */
export const WINDOW_CAP = 45;
export const WINDOW_DAYS = 31;
export const DAY_CAP = 10;

/** What take_feed_request answers. */
export type TakeAnswer = "ok" | "window_spent" | "day_spent" | "zip_recent";

/**
 * Only one site may spend requests, so there is one log against one database:
 * the production deployment. A preview, or a computer running the site, is
 * refused unless RENTCAST_ALLOW_NONPROD=1 is set, and that must only be done
 * against the production database (docs/HANDOFF.md).
 */
export function mayCallFeed(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV === "production" || env.RENTCAST_ALLOW_NONPROD === "1";
}

/** How long a ZIP code's listings are kept before the feed is asked again. */
export const AREA_KEEP_DAYS = 30;

/** One request returns up to 500 listings (RentCast, GET Sale Listings). */
export const PAGE_LIMIT = 500;

export interface ListingRow {
  listing_key: string;
  source: string;
  fetched_at: string;
  ListingId: string | null;
  OriginatingSystemName: string | null;
  StandardStatus: string | null;
  ListPrice: number | null;
  UnparsedAddress: string | null;
  City: string | null;
  StateOrProvince: string | null;
  PostalCode: string;
  Latitude: number | null;
  Longitude: number | null;
  PropertyType: string | null;
  BedroomsTotal: number | null;
  BathroomsTotalDecimal: number | null;
  LivingArea: number | null;
  LotSizeSquareFeet: number | null;
  YearBuilt: number | null;
  ListingContractDate: string | null;
  DaysOnMarket: number | null;
  ListAgentFullName: string | null;
  ListOfficeName: string | null;
  ListOfficePhone: string | null;
  screening_hidden: boolean;
  raw: unknown;
}

/** The part of a listing sent to the browser. */
export type PublicListing = Omit<ListingRow, "raw" | "fetched_at"> & { fetched_at: string };

interface RentCastListing {
  id?: unknown;
  formattedAddress?: unknown;
  city?: unknown;
  state?: unknown;
  zipCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  propertyType?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  squareFootage?: unknown;
  lotSize?: unknown;
  yearBuilt?: unknown;
  status?: unknown;
  price?: unknown;
  listedDate?: unknown;
  daysOnMarket?: unknown;
  mlsName?: unknown;
  mlsNumber?: unknown;
  listingAgent?: { name?: unknown } | null;
  listingOffice?: { name?: unknown; phone?: unknown } | null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const int = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const day = (v: unknown): string | null => {
  const s = str(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};

/** RentCast's record to the site's row. Returns null for a record with no id. */
export function fromRentCast(r: RentCastListing, zip: string, fetchedAt: string): ListingRow | null {
  const id = str(r.id);
  if (!id) return null;
  return {
    listing_key: `${FEED_SOURCE}:${id}`,
    source: FEED_SOURCE,
    fetched_at: fetchedAt,
    ListingId: str(r.mlsNumber),
    OriginatingSystemName: str(r.mlsName),
    StandardStatus: str(r.status),
    ListPrice: num(r.price),
    UnparsedAddress: str(r.formattedAddress),
    City: str(r.city),
    StateOrProvince: str(r.state),
    PostalCode: str(r.zipCode) ?? zip,
    Latitude: num(r.latitude),
    Longitude: num(r.longitude),
    PropertyType: str(r.propertyType),
    BedroomsTotal: num(r.bedrooms),
    BathroomsTotalDecimal: num(r.bathrooms),
    LivingArea: num(r.squareFootage),
    LotSizeSquareFeet: num(r.lotSize),
    YearBuilt: int(r.yearBuilt),
    ListingContractDate: day(r.listedDate),
    DaysOnMarket: int(r.daysOnMarket),
    ListAgentFullName: str(r.listingAgent?.name),
    ListOfficeName: str(r.listingOffice?.name),
    ListOfficePhone: str(r.listingOffice?.phone),
    screening_hidden: false,
    raw: r,
  };
}

/** Whether an area fetched at `fetchedAt` is still fresh at `now`. Null means
 *  it was tried and never fetched. */
export function areaFresh(fetchedAt: string | null, now: Date): boolean {
  return fetchedAt !== null && now.getTime() - new Date(fetchedAt).getTime() < AREA_KEEP_DAYS * 86_400_000;
}

export function isZip(z: unknown): z is string {
  return typeof z === "string" && /^\d{5}$/.test(z);
}
