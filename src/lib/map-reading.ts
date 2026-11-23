// Reading a class off a publisher's map tile, for the hover readout.
//
// The place map draws public layers as their publishers render them. When a
// visitor hovers, the browser looks at the same tile and the colour under the
// cursor, and names the legend class that colour belongs to. It is a reading
// of the drawn map, not of the underlying record, so the readout says so and
// a click still asks the publishers for the record itself (/api/inspect).
//
// Everything in this file is pure, so it can be tested without a browser.

import {
  CANOPY_STOPS,
  FEMA_COLOURS,
  LANDSLIDE_CLASSES,
  PAVING_STOPS,
  SLR_LOW_LYING,
  type LayerKey,
} from "./map-legends";

const R = 6378137;
const HALF = Math.PI * R;

export interface TilePixel {
  z: number;
  x: number;
  y: number;
  /** Pixel inside the tile, 0 at the top left. */
  px: number;
  py: number;
}

/** The web-mercator tile and pixel under a point. */
export function tilePixel(lon: number, lat: number, z: number, size: number): TilePixel {
  const n = 2 ** z;
  const fx = ((lon + 180) / 360) * n;
  const s = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  const fy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  const x = Math.floor(fx);
  const y = Math.floor(fy);
  return {
    z,
    x,
    y,
    px: Math.min(size - 1, Math.floor((fx - x) * size)),
    py: Math.min(size - 1, Math.floor((fy - y) * size)),
  };
}

/** A tile's bounds in EPSG:3857, as MapLibre fills {bbox-epsg-3857}. */
export function tileBbox3857(z: number, x: number, y: number): string {
  const span = (2 * HALF) / 2 ** z;
  const minX = -HALF + x * span;
  const maxY = HALF - y * span;
  return `${minX},${maxY - span},${minX + span},${maxY}`;
}

/** The URL MapLibre would ask for, from a source template. */
export function tileUrl(template: string, t: { z: number; x: number; y: number }): string {
  return template
    .replace("{bbox-epsg-3857}", tileBbox3857(t.z, t.x, t.y))
    .replace("{z}", String(t.z))
    .replace("{x}", String(t.x))
    .replace("{y}", String(t.y));
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function dist(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function nearest<T extends { color: string }>(rgb: readonly number[], items: T[]): { item: T; d: number } {
  let best = items[0];
  let d = Infinity;
  for (const it of items) {
    const e = dist(rgb, hexRgb(it.color));
    if (e < d) {
      d = e;
      best = it;
    }
  }
  return { item: best, d };
}

export interface Reading {
  /** The legend class, in words: "About 40% tree canopy". */
  text: string;
  /** Index into the layer's legend classes or stops, to highlight it. */
  index?: number;
}

/** Colours further than this from every legend colour are not named. */
const TOO_FAR = 60;

/**
 * Names the legend class of one tile pixel. `rgba` is the raw tile pixel,
 * before it is drawn over the aerial. Returns null when the colour matches
 * no class closely enough to name, which happens on edges and labels.
 */
export function readPixel(layer: LayerKey, rgba: readonly [number, number, number, number], extra?: { slrFeet?: number }): Reading | null {
  const [r, g, b, a] = rgba;
  const rgb = [r, g, b];
  switch (layer) {
    case "canopy":
    case "paving": {
      const stops = layer === "canopy" ? CANOPY_STOPS : PAVING_STOPS;
      const what = layer === "canopy" ? "tree canopy" : "paved or built";
      if (a < 20) return { text: `No ${layer === "canopy" ? "tree canopy" : "paving"} mapped in this 30 m square`, index: -1 };
      const { item, d } = nearest(rgb, stops);
      if (d > TOO_FAR) return null;
      return { text: `About ${item.at}% ${what}`, index: stops.indexOf(item) };
    }
    case "landslide": {
      if (a < 20) return { text: "Not rated here" };
      const { item, d } = nearest(rgb, LANDSLIDE_CLASSES);
      if (d > TOO_FAR) return null;
      const i = LANDSLIDE_CLASSES.indexOf(item);
      return { text: `Class ${i + 1} of 5${i === 0 ? ", the lowest" : i === 4 ? ", the highest" : ""}`, index: i };
    }
    case "slr": {
      const ft = extra?.slrFeet;
      if (a < 20) return { text: ft ? `Above the sea at ${ft} ft of rise` : "Not mapped as under water" };
      if (dist(rgb, hexRgb(SLR_LOW_LYING)) < TOO_FAR) return { text: "Low-lying ground, not connected to the sea", index: 2 };
      // NOAA's depth ramp is blues from violet to pale cyan: blue leads.
      if (b > r && b >= g - 10) return { text: ft ? `Under water at ${ft} ft of rise` : "Under water at this rise", index: b - r > 120 ? 0 : 1 };
      return null;
    }
    case "fema": {
      if (a < 10) return { text: "No shaded zone here. Click to read the zone" };
      const { item, d } = nearest(rgb, FEMA_COLOURS);
      if (d > TOO_FAR) return null;
      return { text: item.zone, index: FEMA_COLOURS.indexOf(item) };
    }
    default:
      return null;
  }
}
