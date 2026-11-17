/**
 * Builds src/data/hurricane-tracks.json from NOAA's HURDAT2 best-track files.
 *
 * Run: node scripts/build-hurricane-tracks.mjs
 *
 * Why a committed file rather than a live lookup: HURDAT2 is two text files of
 * 7 MB and 4 MB that change once a year. Asking NOAA for them on every page
 * view would be slow and rude, and a place page should not fail because a
 * file server is down. The manifest beside the output records the URL, the
 * time and the SHA-256 of each source file, so what the site shows can be
 * traced to exactly what NOAA published.
 *
 * What is kept: every track point inside a box that covers the fifty states
 * and Puerto Rico with room to spare (KEEP below). A storm with no point in
 * the box is dropped. Nothing is smoothed, renamed or re-classified: status
 * and wind are NOAA's own values at each point.
 *
 * Source and format: https://www.nhc.noaa.gov/data/#hurdat
 * Status codes (HU, TS, TD, EX, SD, SS, LO, WV, DB) are defined in
 * hurdat2-format-atl-1851-2021.pdf on that page.
 *
 * When NOAA publishes a new year the file names change. Update SOURCES.
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SOURCES = [
  {
    basin: "Atlantic",
    record: "1851 to 2025",
    url: "https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2025-092326.txt",
  },
  {
    basin: "Northeast and Central Pacific",
    record: "1949 to 2025",
    url: "https://www.nhc.noaa.gov/data/hurdat/hurdat2-nepac-1949-2025-092926.txt",
  },
];

/** Degrees. Hawaii to Puerto Rico, the Keys to the Canadian border. */
const KEEP = { south: 16, north: 52, west: -165, east: -60 };

const OUT = join(process.cwd(), "src", "data", "hurricane-tracks.json");
const MANIFEST = join(process.cwd(), "src", "data", "hurricane-tracks.manifest.json");

function parseCoord(text) {
  const m = /^\s*([0-9.]+)([NSEW])\s*$/.exec(text);
  if (!m) return NaN;
  const v = Number(m[1]);
  return m[2] === "S" || m[2] === "W" ? -v : v;
}

function parse(text) {
  const storms = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = line.split(",").map((c) => c.trim());
    // A header row: basin + number + year, name, row count.
    if (/^[A-Z]{2}\d{6}$/.test(cells[0])) {
      current = { id: cells[0], n: cells[1], y: Number(cells[0].slice(4)), p: [] };
      storms.push(current);
      continue;
    }
    if (!current) continue;
    const lat = parseCoord(cells[4]);
    const lon = parseCoord(cells[5]);
    const wind = Number(cells[6]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < KEEP.south || lat > KEEP.north || lon < KEEP.west || lon > KEEP.east) continue;
    // [lat, lon, wind in knots (-1 when NOAA gives none), status, yyyymmdd]
    current.p.push([lat, lon, wind > 0 ? wind : -1, cells[3], Number(cells[0])]);
  }
  return storms.filter((s) => s.p.length > 0);
}

const manifest = { built: new Date().toISOString(), keep: KEEP, sources: [] };
const all = [];

for (const src of SOURCES) {
  const res = await fetch(src.url, { headers: { "User-Agent": "hurricane-track-build" } });
  if (!res.ok) {
    console.error(`build-hurricane-tracks  FAILED  ·  ${src.url} answered ${res.status}`);
    process.exit(1);
  }
  const text = await res.text();
  const storms = parse(text);
  all.push(...storms);
  manifest.sources.push({
    ...src,
    bytes: Buffer.byteLength(text),
    sha256: createHash("sha256").update(text).digest("hex"),
    stormsKept: storms.length,
  });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ storms: all }));
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

const points = all.reduce((n, s) => n + s.p.length, 0);
console.log(`build-hurricane-tracks  ok  ·  ${all.length} storms, ${points} track points`);
