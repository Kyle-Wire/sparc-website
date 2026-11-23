// POST /api/geocode  { address }  ->  { slug, point, matched, precision, by }
//
// Turns a typed address into a place. The address arrives in the request body,
// never in a URL, so it is not written to an access log. It is passed to the
// US Census Bureau's geocoder from here and, only if Census finds nothing or
// does not answer, to Photon, a keyless search over OpenStreetMap
// (src/lib/place/photon.ts). Then it is dropped: nothing in this route
// stores it, caches it or prints it.
//
// `precision` is "house" when the point is the address itself and "street"
// when Photon knew the street but not the house: the point is then somewhere
// on that street, and the search box says so instead of marking a house.
//
// The answer carries two things. `slug` is the block (coordinates rounded to
// three decimals) and is what goes in the page address. `point` and `matched`
// are the exact location and the standardised address; they go back to the
// visitor's own browser, which keeps them for the visit so the map can mark
// their property. See docs/design/site-redesign-brief.md, section 8.

import { NextResponse, type NextRequest } from "next/server";
import { geocodeAddress } from "@/lib/place/census";
import { geocodeAddressPhoton } from "@/lib/place/photon";
import { inUsBounds, placeSlug } from "@/lib/place/coords";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/require-same-origin";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, error: string, extra?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers: { ...NO_STORE, ...extra } });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail(403, "This request did not come from the site.");

  const limit = await checkRateLimit("apiWrite", `geocode:${clientIp(req)}`);
  if (!limit.ok) {
    return fail(429, "Too many searches. Wait a minute and try again.", {
      "Retry-After": String(limit.retryAfterSeconds ?? 60),
    });
  }

  let address = "";
  try {
    const body = (await req.json()) as { address?: unknown };
    if (typeof body.address === "string") address = body.address.trim();
  } catch {
    return fail(400, "Send an address.");
  }
  if (address.length < 5 || address.length > 200) {
    return fail(400, "Type a street address with its city and state.");
  }

  // Census first; Photon when Census has no match or no answer.
  const census = await geocodeAddress(address);
  let hit: { point: { lat: number; lon: number }; matched: string; precision: "house" | "street" } | null = null;
  let by: "census" | "photon" = "census";
  if (census.ok && census.data) {
    hit = { ...census.data, precision: "house" };
  } else {
    const photon = await geocodeAddressPhoton(address);
    if (photon.ok && photon.data) {
      hit = photon.data;
      by = "photon";
    } else if (!census.ok && !photon.ok) {
      return fail(502, "Neither address search answered. Try again in a minute.");
    } else if (!photon.ok) {
      return fail(502, "The Census Bureau's geocoder did not find that address, and the second search (OpenStreetMap) did not answer. Try again in a minute.");
    } else if (!census.ok) {
      return fail(404, "The Census Bureau's geocoder did not answer, and OpenStreetMap did not find that address. Try again in a minute, or find it on the map.");
    } else {
      return fail(404, "Neither the Census Bureau's geocoder nor OpenStreetMap found that address. Check the street number, city and state, or find it on the map.");
    }
  }
  if (!inUsBounds(hit.point)) return fail(404, "That address is outside the area this site covers.");

  return NextResponse.json(
    { slug: placeSlug(hit.point), point: hit.point, matched: hit.matched, precision: hit.precision, by },
    { headers: NO_STORE },
  );
}
