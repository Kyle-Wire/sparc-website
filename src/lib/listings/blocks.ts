// Model readings per block, and the subscriber's sort.
//
// A block is the site's rounded place: a 0.001-degree cell named "lat,lon" by
// its centre (src/lib/place/coords.ts). Climate Inspection writes the same
// cells (tools/listings/blocks.py) into screen_<place>.json, and lists which
// places have runs in index.json (D42 item 8). A block outside every place
// box reads "not modelled here yet": a label, not a switch.
//
// What the readings are (screen_<place>.json, 18 November 2026):
//   flood  per design storm, the 95th percentile of peak depth over the
//          block's open ground, in cm, with the spread across the study's
//          settings runs. A range from the model's settings, not a stated error.
//   heat   per modelled hour, the share of open ground in sun and its median
//          PET. PET is a comfort index, never called a temperature.
// Every reading is exploratory model output and paid tier.

import { placeSlug, type LatLon } from "@/lib/place/coords";

export type HazardState = "modelled" | "not_modelled" | "not_per_block" | "not_built";

export interface ModelPlace {
  place: string;
  name: string;
  /** [west, south, east, north] */
  box: [number, number, number, number];
  hazards: Record<string, HazardState>;
}

export interface FloodStorm {
  value_cm: number | null;
  open_ground_m2?: number;
  settings_spread_cm: [number, number] | null;
  statement: string;
}

export interface BlockReadings {
  flood?: Record<string, FloodStorm>;
  heat?: {
    hours: Record<string, { sun_share_pct: number | null; tree_shade_share_pct?: number | null; pet_median_c: number | null }>;
    statement: string;
  };
  [hazard: string]: unknown;
}

export const NOT_MODELLED = "Not modelled here yet";

/** The storm the subscriber's default sort uses. */
export const DEFAULT_STORM = "100-yr 24 h";

export function blockOf(p: LatLon): string {
  return placeSlug(p);
}

function centreOf(slug: string): LatLon {
  const [lat, lon] = slug.split(",").map(Number);
  return { lat, lon };
}

/** The modelled place whose box holds the block's centre, if any. */
export function placeForBlock(slug: string, places: ModelPlace[]): ModelPlace | null {
  const c = centreOf(slug);
  return places.find(({ box: [w, s, e, n] }) => c.lon >= w && c.lon <= e && c.lat >= s && c.lat <= n) ?? null;
}

/** The sort's name says what it sorts (D42 item 4). Never "safe" or "safest". */
export function floodSortName(storm: string): string {
  return `Lowest modelled flood depth at the block, ${storm} storm`;
}

/**
 * Orders listings by the block's modelled flood depth in one storm, lowest
 * first, and says how many it left out. A listing is left out when its block
 * has no reading for that storm: outside every modelled place, or too little
 * open ground. Ties keep the listings' own order.
 */
export function sortByFloodDepth<T extends { slug: string }>(
  listings: T[],
  readings: Map<string, BlockReadings>,
  storm: string,
): { name: string; sorted: (T & { depth_cm: number; spread_cm: [number, number] | null })[]; leftOut: number } {
  const kept: { row: T & { depth_cm: number; spread_cm: [number, number] | null }; i: number }[] = [];
  listings.forEach((l, i) => {
    const s = readings.get(l.slug)?.flood?.[storm];
    if (s && typeof s.value_cm === "number") kept.push({ row: { ...l, depth_cm: s.value_cm, spread_cm: s.settings_spread_cm }, i });
  });
  kept.sort((a, b) => a.row.depth_cm - b.row.depth_cm || a.i - b.i);
  return { name: floodSortName(storm), sorted: kept.map((k) => k.row), leftOut: listings.length - kept.length };
}

/** Which hazards a block has readings for, without any value: what a visitor
 *  without a subscription is told. */
export function hazardStates(place: ModelPlace | null): Record<string, HazardState> {
  if (!place) return { flood: "not_modelled", heat: "not_modelled", ground: "not_modelled", wind: "not_modelled" };
  return { flood: "not_modelled", heat: "not_modelled", ground: "not_modelled", wind: "not_modelled", ...place.hazards };
}

export const HAZARD_STATE_WORDS: Record<HazardState, string> = {
  modelled: "Modelled at this block",
  not_modelled: NOT_MODELLED,
  not_per_block: "Not read per block",
  not_built: "Not built yet",
};
