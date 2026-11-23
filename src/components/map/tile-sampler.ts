"use client";

import { tilePixel, tileUrl } from "@/lib/map-reading";

/**
 * Reads one pixel of a publisher's tile in the browser, for the hover readout
 * (src/lib/map-reading.ts says what is done with it). Tiles are fetched from
 * the same agency URLs the map draws, so the browser's cache usually answers
 * at once. A tile that cannot be read (the agency is busy, or it refuses to
 * share pixels) gives null, and the readout says "click to read" instead.
 */

const cache = new Map<string, Promise<ImageData | null>>();
const MAX = 48;

async function load(url: string, size: number): Promise<ImageData | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const bmp = await createImageBitmap(await res.blob());
    const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(size, size) : Object.assign(document.createElement("canvas"), { width: size, height: size });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
  } catch {
    return null;
  }
}

export interface SampleSource {
  tiles: string;
  tileSize: number;
  minzoom?: number;
  maxzoom?: number;
}

export async function samplePixel(src: SampleSource, lon: number, lat: number, mapZoom: number): Promise<[number, number, number, number] | null> {
  // MapLibre asks a 256 px source one level deeper than a 512 px one.
  let z = Math.round(mapZoom) + (src.tileSize === 256 ? 1 : 0);
  z = Math.max(src.minzoom ?? 0, Math.min(src.maxzoom ?? 18, z));
  const t = tilePixel(lon, lat, z, src.tileSize);
  const url = tileUrl(src.tiles, t);
  let p = cache.get(url);
  if (!p) {
    p = load(url, src.tileSize);
    cache.set(url, p);
    if (cache.size > MAX) cache.delete(cache.keys().next().value as string);
  }
  const img = await p;
  if (!img) return null;
  const i = (t.py * img.width + t.px) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
