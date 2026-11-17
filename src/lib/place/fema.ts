// FEMA's National Flood Hazard Layer: the flood zones on the block, and the
// date of the map panel they come from.
// https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer
//   layer 28  Flood Hazard Zones
//   layer 3   FIRM Panels
//
// What this file states and what it does not. Every word shown about a zone is
// FEMA's own: the zone code (FLD_ZONE), FEMA's subtype text (ZONE_SUBTY) and
// FEMA's flag for the Special Flood Hazard Area (SFHA_TF). Nothing here
// interprets a zone as "safe" or "at risk". FEMA's zones are context, not
// ground truth: most of what a flood model shows on a city street sits in
// Zone X.
//
// The question is asked of a small box around the rounded place, not of one
// point, because a zone boundary can cut a block and the page does not know
// which side the visitor's home is on. If the block touches more than one
// zone the card says so and sends the reader to the map.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import type { LatLon } from "./coords";

const NFHL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const WHO = "FEMA's flood map service";

/** Half-widths of the box, in degrees: about 90 m north-south and 85 m
 *  east-west at mid-latitudes, a little larger than the rounding cell. */
const HALF_LAT = 0.0008;
const HALF_LON = 0.001;

interface ArcFeatures<T> {
  features?: { attributes: T }[];
}

interface ZoneRow {
  FLD_ZONE: string | null;
  ZONE_SUBTY: string | null;
  SFHA_TF: string | null;
  DFIRM_ID: string | null;
}

interface PanelRow {
  FIRM_PAN: string | null;
  EFF_DATE: number | null;
}

export interface FloodZone {
  /** FEMA's zone code, e.g. "X", "AE", "VE". */
  code: string;
  /** FEMA's subtype text, sentence-cased, or null when FEMA gives none. */
  subtype: string | null;
  /** FEMA's own flag: inside the Special Flood Hazard Area. */
  inSfha: boolean;
}

export interface FloodZones {
  zones: FloodZone[];
  /** ISO date of the newest map panel over the block, when FEMA gives one. */
  panelDate: string | null;
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase().replace(/\bpct\b/g, "percent");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function boxQuery(place: LatLon, layer: number, fields: string): string {
  const box = [
    place.lon - HALF_LON,
    place.lat - HALF_LAT,
    place.lon + HALF_LON,
    place.lat + HALF_LAT,
  ]
    .map((v) => v.toFixed(5))
    .join(",");
  const q = new URLSearchParams({
    geometry: box,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields,
    returnGeometry: "false",
    f: "json",
  });
  return `${NFHL}/${layer}/query?${q.toString()}`;
}

export async function floodZonesAt(place: LatLon): Promise<Lookup<FloodZones>> {
  // One after the other, not together: this server drops bursts.
  const zonesRes = await askJson<ArcFeatures<ZoneRow>>(
    boxQuery(place, 28, "FLD_ZONE,ZONE_SUBTY,SFHA_TF,DFIRM_ID"),
    WHO,
    { revalidate: DAY_SECONDS, retries: 2 },
  );
  if (!zonesRes.ok) return zonesRes;

  const seen = new Map<string, FloodZone>();
  const firms = new Set<string>();
  for (const f of zonesRes.data.features ?? []) {
    const a = f.attributes;
    if (!a.FLD_ZONE) continue;
    if (a.DFIRM_ID) firms.add(a.DFIRM_ID);
    const subtype = a.ZONE_SUBTY && a.ZONE_SUBTY.trim() ? sentenceCase(a.ZONE_SUBTY.trim()) : null;
    const key = `${a.FLD_ZONE}|${subtype ?? ""}`;
    if (!seen.has(key)) seen.set(key, { code: a.FLD_ZONE, subtype, inSfha: a.SFHA_TF === "T" });
  }
  // Special Flood Hazard Area first, then by code.
  const zones = [...seen.values()].sort(
    (a, b) => Number(b.inSfha) - Number(a.inSfha) || a.code.localeCompare(b.code),
  );

  let panelDate: string | null = null;
  const panelsRes = await askJson<ArcFeatures<PanelRow>>(boxQuery(place, 3, "FIRM_PAN,EFF_DATE"), WHO, {
    revalidate: DAY_SECONDS,
    retries: 1,
  });
  if (panelsRes.ok) {
    const rows = (panelsRes.data.features ?? []).map((f) => f.attributes);
    // Prefer a panel from the same study as the zones; a neighbouring county's
    // panel can overlap the box.
    const own = rows.filter((r) => r.FIRM_PAN && [...firms].some((id) => r.FIRM_PAN!.startsWith(id)));
    const dates = (own.length ? own : rows)
      .map((r) => r.EFF_DATE)
      .filter((d): d is number => typeof d === "number" && d > 0);
    if (dates.length) panelDate = new Date(Math.max(...dates)).toISOString().slice(0, 10);
  }

  return { ok: true, data: { zones, panelDate } };
}
