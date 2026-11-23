// POST /api/inspect  { lat, lon }  ->  what public sources say at that spot
//
// Called when a visitor clicks a map. Sources asked from the server: FEMA's
// flood zone at the point, USGS ground elevation, the tree canopy and paving
// of the land cover cell, the nearest mapped fault and the landslides mapped
// nearby (USGS), the soil survey (USDA NRCS), and how often FEMA counts wind
// events in the tract (src/lib/place/ground.ts, wind.ts).
//
// The point arrives in the request body, is rounded to five decimals (about a
// metre) and is not stored. Each answer stands alone: a source that is down
// comes back as { error } for that item and the others still arrive.

import { NextResponse, type NextRequest } from "next/server";
import { inUsBounds } from "@/lib/place/coords";
import { floodZoneAtPoint } from "@/lib/place/fema";
import type { Lookup } from "@/lib/place/lookup";
import { canopyAt, elevationAt, pavingAt } from "@/lib/place/point";
import { landslidesNear, nearestFault, soilAt } from "@/lib/place/ground";
import { windFrequencyAt } from "@/lib/place/wind";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/require-same-origin";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

function item<T>(res: Lookup<T>): { value: T } | { error: string } {
  return res.ok ? { value: res.data } : { error: res.reason };
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail(403, "This request did not come from the site.");
  const limit = await checkRateLimit("apiWrite", `inspect:${clientIp(req)}`);
  if (!limit.ok) return fail(429, "Too many clicks at once. Wait a minute and try again.");

  let lat = NaN;
  let lon = NaN;
  try {
    const body = (await req.json()) as { lat?: unknown; lon?: unknown };
    lat = Number(body.lat);
    lon = Number(body.lon);
  } catch {
    return fail(400, "Send a point.");
  }
  const point = { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 };
  if (!inUsBounds(point)) return fail(400, "That point is outside the area this site covers.");

  const [zone, elevation, canopy, paving, fault, slides, soil, wind] = await Promise.all([
    floodZoneAtPoint(point),
    elevationAt(point),
    canopyAt(point),
    pavingAt(point),
    nearestFault(point),
    landslidesNear(point),
    soilAt(point),
    windFrequencyAt(point),
  ]);

  return NextResponse.json(
    {
      point,
      zone: item(zone),
      elevation: item(elevation),
      canopy: item(canopy),
      paving: item(paving),
      fault: item(fault),
      slides: item(slides),
      soil: item(soil),
      wind: item(wind),
    },
    { headers: NO_STORE },
  );
}
