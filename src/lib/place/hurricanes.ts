// Tropical cyclones that tracked near a place, from NOAA's HURDAT2 record.
//
// The data file is built by scripts/build-hurricane-tracks.mjs and committed;
// its manifest records the source URLs and hashes. Status and wind are NOAA's
// values at each six-hourly track point. Nothing here estimates the wind at
// the place itself: the figure shown is the storm's own maximum sustained wind
// at the track point nearest the place, which for a storm passing 80 km away
// is not what the block felt. The card says that in its own words.
//
// Categories follow the Saffir-Simpson Hurricane Wind Scale as NOAA publishes
// it (https://www.nhc.noaa.gov/aboutsshws.php): 64, 83, 96, 113 and 137 knots.

import tracks from "@/data/hurricane-tracks.json";
import manifest from "@/data/hurricane-tracks.manifest.json";
import { distanceKm, distanceToSegmentKm, type LatLon } from "./coords";

/** [lat, lon, wind in knots or -1, NOAA status code, yyyymmdd] */
type TrackPoint = [number, number, number, string, number];

interface Storm {
  id: string;
  n: string;
  y: number;
  p: TrackPoint[];
}

const STORMS = (tracks as unknown as { storms: Storm[] }).storms;

export const TRACK_RADIUS_KM = 100;

/** How much of each nearby track is sent to the map, in kilometres from the place. */
const DRAW_RADIUS_KM = 700;

const KT_TO_MPH = 1.150779;

/** NOAA's status codes, from the HURDAT2 format description. */
const STATUS: Record<string, string> = {
  HU: "hurricane",
  TS: "tropical storm",
  TD: "tropical depression",
  EX: "extratropical cyclone",
  SD: "subtropical depression",
  SS: "subtropical storm",
  LO: "low",
  WV: "tropical wave",
  DB: "disturbance",
};

function category(windKt: number): number {
  if (windKt >= 137) return 5;
  if (windKt >= 113) return 4;
  if (windKt >= 96) return 3;
  if (windKt >= 83) return 2;
  if (windKt >= 64) return 1;
  return 0;
}

export interface NearbyStorm {
  id: string;
  /** NOAA's name, title-cased, or null for an unnamed storm. */
  name: string | null;
  year: number;
  closestKm: number;
  /** What NOAA classed it as at the track point nearest the place. */
  statusNearby: string;
  /** Saffir-Simpson category at that point; 0 below hurricane strength. */
  categoryNearby: number;
  /** The storm's maximum sustained wind at that point, mph, or null when NOAA gives none. */
  windMphNearby: number | null;
  /** Lines of [lon, lat] pairs for the map. More than one when the storm left
   *  the kept area and came back. */
  lines: [number, number][][];
}

/** Days since the epoch for a yyyymmdd number. */
function dayNumber(yyyymmdd: number): number {
  const y = Math.floor(yyyymmdd / 10000);
  const m = Math.floor((yyyymmdd % 10000) / 100);
  const d = yyyymmdd % 100;
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Two track points are consecutive when they are at most a day apart. The
 *  data file keeps only points inside a box, so a storm that left and came
 *  back has a gap that must not be joined by a straight line. */
function joined(a: TrackPoint, b: TrackPoint): boolean {
  return dayNumber(b[4]) - dayNumber(a[4]) <= 1;
}

export interface NearbyStorms {
  radiusKm: number;
  total: number;
  hurricanesNearby: number;
  storms: NearbyStorm[];
  /** e.g. "Atlantic 1851 to 2025; Northeast and Central Pacific 1949 to 2025" */
  record: string;
}

function titleCase(name: string): string {
  return name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

export function stormsNear(place: LatLon, radiusKm = TRACK_RADIUS_KM): NearbyStorms {
  const found: NearbyStorm[] = [];
  // A storm cannot pass within the radius unless one of its points is within
  // the radius plus the longest six-hour step a storm takes (a few hundred km).
  const reach = radiusKm + 600;

  for (const s of STORMS) {
    let best = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < s.p.length; i++) {
      const a = { lat: s.p[i][0], lon: s.p[i][1] };
      if (Math.abs(a.lat - place.lat) > reach / 111) continue;
      const after = s.p[i + 1];
      const next = after && joined(s.p[i], after) ? after : undefined;
      const d = next
        ? distanceToSegmentKm(place, a, { lat: next[0], lon: next[1] })
        : distanceKm(place, a);
      if (d < best) {
        best = d;
        // Report the end of the segment that is nearer the place.
        bestIdx =
          next && distanceKm(place, { lat: next[0], lon: next[1] }) < distanceKm(place, a) ? i + 1 : i;
      }
    }
    if (best > radiusKm || bestIdx < 0) continue;

    const pt = s.p[bestIdx];
    const wind = pt[2] > 0 ? pt[2] : null;

    const lines: [number, number][][] = [];
    let run: [number, number][] = [];
    s.p.forEach((q, i) => {
      const near = distanceKm(place, { lat: q[0], lon: q[1] }) <= DRAW_RADIUS_KM;
      const broken = i > 0 && !joined(s.p[i - 1], q);
      if ((!near || broken) && run.length) {
        if (run.length > 1) lines.push(run);
        run = [];
      }
      if (near) run.push([q[1], q[0]]);
    });
    if (run.length > 1) lines.push(run);
    found.push({
      id: s.id,
      name: s.n === "UNNAMED" ? null : titleCase(s.n),
      year: s.y,
      closestKm: Math.round(best),
      statusNearby: STATUS[pt[3]] ?? "storm",
      categoryNearby: pt[3] === "HU" && wind ? category(wind) : 0,
      windMphNearby: wind ? Math.round((wind * KT_TO_MPH) / 5) * 5 : null,
      lines,
    });
  }

  found.sort((a, b) => b.year - a.year || a.closestKm - b.closestKm);
  return {
    radiusKm,
    total: found.length,
    hurricanesNearby: found.filter((s) => s.categoryNearby > 0).length,
    storms: found,
    record: manifest.sources.map((s) => `${s.basin} ${s.record}`).join("; "),
  };
}
