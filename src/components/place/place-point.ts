// The exact point a visitor searched for, kept in their own browser.
//
// The page address holds only the block (src/lib/place/coords.ts). To put the
// property at the centre of the map for the person who typed the address, and
// for nobody they share the link with, the exact point lives in
// sessionStorage: this tab, this visit, gone when the tab closes. It is never
// sent back to the server.

import type { LatLon } from "@/lib/place/coords";

const KEY = "sparc.place.point";

export interface PlacePoint extends LatLon {
  slug: string;
  matched: string;
}

export function rememberPoint(p: PlacePoint): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private windows can refuse storage. The page still works, centred on the block.
  }
}

export function recallPoint(slug: string): PlacePoint | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PlacePoint>;
    if (p.slug !== slug || typeof p.lat !== "number" || typeof p.lon !== "number") return null;
    return { slug, lat: p.lat, lon: p.lon, matched: typeof p.matched === "string" ? p.matched : "" };
  } catch {
    return null;
  }
}
