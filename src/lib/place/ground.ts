// What public ground records say near one spot: mapped faults, mapped
// landslides and the soil survey. Read when a visitor clicks the map.
//
//   Faults      USGS Quaternary Fault and Fold Database, 2020 release,
//               national layer (21) of
//               https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer
//   Landslides  USGS U.S. Landslide Inventory, version 3 (points and polygons)
//               https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_point_v2/FeatureServer/11
//               https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_poly_v2/FeatureServer/12
//   Soil        USDA NRCS Soil Survey Geographic Database (SSURGO), through
//               Soil Data Access: https://sdmdataaccess.sc.egov.usda.gov
//
// Landslide susceptibility (USGS, Mirus et al. 2024) is shown as a map layer
// only: its service serves picture tiles and cannot be asked about a point.
//
// Each reading describes the ground around the spot, from a national map. It
// is not a survey of the lot, and the card says so. The point is rounded
// before it is sent anywhere and is not stored.
//
// Soil Data Access timed out on most requests while this was written (20 Nov
// 2026), so it is asked with a short wait and a miss is shown as a miss.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import type { LatLon } from "./coords";
import { FAULT_SEARCH_KM, SLIDE_RADIUS_KM } from "./readings";

const QFAULTS = "https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/21/query";
const SLIDE_POINTS = "https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_point_v2/FeatureServer/11/query";
const SLIDE_POLYS = "https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_poly_v2/FeatureServer/12/query";
const SDA = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";


const KM_PER_DEG = 111.32;

/** Distance in km from a point to a polyline, flat-earth over a few tens of km. */
export function kmToPath(p: LatLon, path: [number, number][]): number {
  const kx = KM_PER_DEG * Math.cos((p.lat * Math.PI) / 180);
  const ky = KM_PER_DEG;
  const xy = path.map(([lon, lat]) => [(lon - p.lon) * kx, (lat - p.lat) * ky] as const);
  let best = Infinity;
  for (let i = 0; i < xy.length; i++) {
    const [ax, ay] = xy[i];
    if (xy.length === 1) best = Math.min(best, Math.hypot(ax, ay));
    if (i === xy.length - 1) break;
    const [bx, by] = xy[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

function nearQuery(p: LatLon, km: number, extra: Record<string, string>): string {
  return new URLSearchParams({
    geometry: `${p.lon},${p.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(km * 1000),
    units: "esriSRUnit_Meter",
    f: "json",
    ...extra,
  }).toString();
}

export interface NearestFault {
  name: string;
  /** USGS's age class, e.g. "latest Quaternary (<15,000 years)". */
  age: string;
  km: number;
  /** USGS's report on the fault. */
  url: string | null;
}

interface FaultAnswer {
  error?: unknown;
  features?: { attributes?: { fault_name?: string; section_name?: string; age?: string; fault_url?: string }; geometry?: { paths?: [number, number][][] } }[];
}

/** The nearest mapped Quaternary fault within FAULT_SEARCH_KM, or null for none. */
export async function nearestFault(p: LatLon): Promise<Lookup<NearestFault | null>> {
  const url = `${QFAULTS}?${nearQuery(p, FAULT_SEARCH_KM, {
    outFields: "fault_name,section_name,age,fault_url",
    returnGeometry: "true",
    outSR: "4326",
    maxAllowableOffset: "0.0005",
  })}`;
  const res = await askJson<FaultAnswer>(url, "The USGS fault database", { revalidate: 30 * DAY_SECONDS, timeoutMs: 12_000 });
  if (!res.ok) return res;
  if (res.data.error) return { ok: false, reason: "The USGS fault database answered with an error." };
  let best: NearestFault | null = null;
  for (const f of res.data.features ?? []) {
    for (const path of f.geometry?.paths ?? []) {
      const km = kmToPath(p, path);
      if (!best || km < best.km) {
        const a = f.attributes ?? {};
        const name = [a.fault_name, a.section_name].filter((s) => s && s.trim()).join(", ") || "An unnamed fault";
        best = { name, age: a.age ?? "", km, url: a.fault_url || null };
      }
    }
  }
  return { ok: true, data: best };
}

interface CountAnswer {
  count?: number;
  error?: unknown;
}

/** How many landslides the USGS inventory maps within SLIDE_RADIUS_KM. */
export async function landslidesNear(p: LatLon): Promise<Lookup<number>> {
  const q = nearQuery(p, SLIDE_RADIUS_KM, { returnCountOnly: "true" });
  const who = "The USGS landslide inventory";
  const opts = { revalidate: 30 * DAY_SECONDS, timeoutMs: 12_000 };
  const [pts, polys] = await Promise.all([
    askJson<CountAnswer>(`${SLIDE_POINTS}?${q}`, who, opts),
    askJson<CountAnswer>(`${SLIDE_POLYS}?${q}`, who, opts),
  ]);
  if (!pts.ok) return pts;
  if (!polys.ok) return polys;
  if (pts.data.error || polys.data.error || typeof pts.data.count !== "number" || typeof polys.data.count !== "number") {
    return { ok: false, reason: `${who} answered with an error.` };
  }
  return { ok: true, data: pts.data.count + polys.data.count };
}

export interface SoilReading {
  /** The soil survey's name for the map unit. */
  name: string;
  /** e.g. "Well drained", "Poorly drained". */
  drainage: string | null;
  /** Hydrologic soil group, A (soaks in fast) to D (slow). */
  hydroGroup: string | null;
  /** e.g. "None", "Rare", "Occasional", "Frequent". */
  flooding: string | null;
  /** Share of the map unit that is hydric (wetland) soil, percent. */
  hydricPct: number | null;
}

interface SdaAnswer {
  Table?: (string | null)[][];
}

function sdaQuery(p: LatLon): string {
  // The point is built from two numbers, never from text a visitor typed.
  const wkt = `point(${p.lon.toFixed(5)} ${p.lat.toFixed(5)})`;
  return (
    "SELECT TOP 1 mu.muname, ma.drclassdcd, ma.hydgrpdcd, ma.flodfreqdcd, ma.hydclprs " +
    "FROM mapunit mu JOIN muaggatt ma ON ma.mukey = mu.mukey " +
    `WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${wkt}'))`
  );
}

export async function soilAt(p: LatLon): Promise<Lookup<SoilReading | null>> {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return { ok: false, reason: "No point to look up." };
  const who = "The soil survey (USDA NRCS)";
  try {
    const res = await fetch(SDA, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "sparclabs-site/1 (public record lookup)" },
      body: JSON.stringify({ format: "JSON", query: sdaQuery(p) }),
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 30 * DAY_SECONDS },
    });
    if (!res.ok) return { ok: false, reason: `${who} answered with an error (${res.status}).` };
    const text = await res.text();
    if (!text.trim()) return { ok: true, data: null };
    const row = (JSON.parse(text) as SdaAnswer).Table?.[0];
    if (!row) return { ok: true, data: null };
    const [name, drainage, hydroGroup, flooding, hydric] = row;
    const pct = hydric === null || hydric === undefined || hydric === "" ? null : Number(hydric);
    return {
      ok: true,
      data: { name: name ?? "Unnamed map unit", drainage: drainage || null, hydroGroup: hydroGroup || null, flooding: flooding || null, hydricPct: Number.isFinite(pct) ? pct : null },
    };
  } catch {
    return { ok: false, reason: `${who} did not answer in time. It is often slow; try the spot again later.` };
  }
}
