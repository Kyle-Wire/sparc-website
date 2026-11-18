// POST /api/listings  { lat, lon }  ->  homes for sale in the ZIP code area there
//
// The point is the middle of the map, rounded to the block before anything is
// asked. The Census Bureau names its ZIP code area; the listings feed is asked
// for that area, never for an address (Climate Inspection D42 item 3). A
// request to the feed is spent only for an area with nothing kept from the
// last 30 days, and never past the site's monthly cap (src/lib/listings).
//
// Every listing is sent with its block slug. A subscriber also gets the
// modelled sort; nobody else gets a model value.

import { NextResponse, type NextRequest } from "next/server";
import { inUsBounds, roundPlace } from "@/lib/place/coords";
import { zipAreaAt } from "@/lib/place/census";
import { blockOf, DEFAULT_STORM, sortByFloodDepth } from "@/lib/listings/blocks";
import { WINDOW_CAP, WINDOW_DAYS } from "@/lib/listings/feed";
import { areaListings, isSubscriber, readingsFor, requestsUsed } from "@/lib/listings/store";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/require-same-origin";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail(403, "This request did not come from the site.");
  const limit = await checkRateLimit("apiWrite", `listings:${clientIp(req)}`);
  if (!limit.ok) return fail(429, "Too many requests at once. Wait a minute and try again.");

  let lat = NaN;
  let lon = NaN;
  try {
    const body = (await req.json()) as { lat?: unknown; lon?: unknown };
    lat = Number(body.lat);
    lon = Number(body.lon);
  } catch {
    return fail(400, "Send a point.");
  }
  const centre = roundPlace({ lat, lon });
  if (!inUsBounds(centre)) return fail(400, "That point is outside the area this site covers.");

  const zip = await zipAreaAt(centre);
  if (!zip.ok) return fail(502, zip.reason);
  if (!zip.data) return fail(404, "The Census Bureau lists no ZIP code area here.");

  const area = await areaListings(zip.data);
  const listings = area.listings
    .filter((l) => l.Latitude !== null && l.Longitude !== null)
    .map((l) => ({ ...l, slug: blockOf({ lat: l.Latitude as number, lon: l.Longitude as number }) }));

  let sort = null;
  if (listings.length && (await isSubscriber())) {
    const readings = await readingsFor(listings.map((l) => l.slug));
    const s = sortByFloodDepth(listings, readings, DEFAULT_STORM);
    sort = {
      name: s.name,
      order: s.sorted.map((l) => ({ key: l.listing_key, depth_cm: l.depth_cm, spread_cm: l.spread_cm })),
      leftOut: s.leftOut,
    };
  }

  const used = await requestsUsed();
  return NextResponse.json(
    {
      zip: area.zip,
      status: area.status,
      fetchedAt: area.fetchedAt,
      source: "RentCast",
      listings,
      sort,
      budget: { cap: WINDOW_CAP, days: WINDOW_DAYS, used },
    },
    { headers: NO_STORE },
  );
}
