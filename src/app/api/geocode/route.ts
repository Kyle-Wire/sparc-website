// POST /api/geocode  { address }  ->  { slug, point, matched }
//
// Turns a typed address into a place. The address arrives in the request body,
// never in a URL, so it is not written to an access log. It is passed to the
// US Census Bureau's geocoder from here and, only if Census finds nothing or
// does not answer, to Esri's geocoder (src/lib/place/arcgis.ts; off unless
// ARCGIS_API_KEY is set). Then it is dropped: nothing in this route stores
// it, caches it or prints it.
//
// The answer carries two things. `slug` is the block (coordinates rounded to
// three decimals) and is what goes in the page address. `point` and `matched`
// are the exact location and the standardised address; they go back to the
// visitor's own browser, which keeps them for the visit so the map can mark
// their property. See docs/design/site-redesign-brief.md, section 8.

import { NextResponse, type NextRequest } from "next/server";
import { geocodeAddress } from "@/lib/place/census";
import { arcgisConfigured, geocodeAddressArcgis } from "@/lib/place/arcgis";
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

  // Census first; Esri when Census has no match or no answer.
  let res = await geocodeAddress(address);
  let by: "census" | "esri" = "census";
  if (arcgisConfigured() && (!res.ok || !res.data)) {
    const census = res;
    const esri = await geocodeAddressArcgis(address);
    if (esri.ok && esri.data) {
      res = esri;
      by = "esri";
    } else if (!census.ok && !esri.ok) {
      return fail(502, "Neither address locator answered. Try again in a minute.");
    } else if (!esri.ok) {
      return fail(502, "The Census Bureau's geocoder did not find that address, and Esri's did not answer. Try again in a minute.");
    } else {
      res = { ok: true, data: null };
    }
  }
  if (!res.ok) return fail(502, res.reason);
  if (!res.data) {
    return fail(
      404,
      arcgisConfigured()
        ? "Neither the Census Bureau's geocoder nor Esri's found that address. Check the street number, city and state."
        : "The Census Bureau's geocoder did not find that address. Check the street number, city and state.",
    );
  }
  if (!inUsBounds(res.data.point)) return fail(404, "That address is outside the area this site covers.");

  return NextResponse.json(
    { slug: placeSlug(res.data.point), point: res.data.point, matched: res.data.matched, by },
    { headers: NO_STORE },
  );
}
