// A place on this site is a block, not a house.
//
// The page address carries a latitude and longitude rounded to three decimal
// places: a cell of roughly 110 m by 85 m at mid-latitudes. That is enough to
// centre a neighbourhood map and to ask the public registers about the area,
// and it is not enough to pick out one home. The exact point a visitor typed
// never goes into a URL; it stays in their own browser for the visit (see
// src/components/place/place-point.ts).
//
// See docs/design/site-redesign-brief.md, section 3 and section 8.

export interface LatLon {
  lat: number;
  lon: number;
}

export const PLACE_DECIMALS = 3;

/** The fifty states, DC and Puerto Rico, with room to spare. */
const US_BOUNDS = { south: 17, north: 72, west: -180, east: -64 };

export function inUsBounds(p: LatLon): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    p.lat >= US_BOUNDS.south &&
    p.lat <= US_BOUNDS.north &&
    p.lon >= US_BOUNDS.west &&
    p.lon <= US_BOUNDS.east
  );
}

export function roundPlace(p: LatLon): LatLon {
  const f = 10 ** PLACE_DECIMALS;
  return { lat: Math.round(p.lat * f) / f, lon: Math.round(p.lon * f) / f };
}

/** "39.953,-75.164" */
export function placeSlug(p: LatLon): string {
  const r = roundPlace(p);
  return `${r.lat.toFixed(PLACE_DECIMALS)},${r.lon.toFixed(PLACE_DECIMALS)}`;
}

const SLUG = /^(-?\d{1,2}\.\d{3}),(-?\d{1,3}\.\d{3})$/;

/** Returns null for anything that is not a rounded US place. A slug with more
 *  decimals is refused on purpose: a finer address in the URL would undo the
 *  rounding. */
export function parsePlaceSlug(raw: string): LatLon | null {
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const m = SLUG.exec(text);
  if (!m) return null;
  const p = { lat: Number(m[1]), lon: Number(m[2]) };
  return inUsBounds(p) ? p : null;
}

const EARTH_KM = 6371;
const RAD = Math.PI / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Shortest distance in kilometres from a point to the segment a-b, on a flat
 *  projection centred on the point. Good to well under a kilometre at the
 *  distances this site asks about (a hundred kilometres or so). */
export function distanceToSegmentKm(p: LatLon, a: LatLon, b: LatLon): number {
  const kx = EARTH_KM * RAD * Math.cos(p.lat * RAD);
  const ky = EARTH_KM * RAD;
  const ax = (a.lon - p.lon) * kx;
  const ay = (a.lat - p.lat) * ky;
  const bx = (b.lon - p.lon) * kx;
  const by = (b.lat - p.lat) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export const KM_PER_MILE = 1.609344;
