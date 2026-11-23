// What public sources say about one spot on the map: the ground's height, the
// tree canopy and paving in the land cover cell it falls in.
//
//   Elevation   USGS 3D Elevation Program, Elevation Point Query Service
//               https://epqs.nationalmap.gov/v1/json
//   Land cover  National Land Cover Database 2021, read through the MRLC map
//               server's GetFeatureInfo. The server returns the value of the
//               land cover cell under the point as PALETTE_INDEX: a percentage.
//
// These are read for a point a visitor clicked. The point is rounded to five
// decimals (about a metre) before it is sent anywhere, and is not stored.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import type { LatLon } from "./coords";

const FT_PER_M = 3.28084;

export interface Elevation {
  feet: number;
  metres: number;
  /** Cell size of the terrain data at this spot, in metres, when USGS gives it. */
  resolutionM: number | null;
  /** Year the terrain was surveyed, when USGS gives it. */
  surveyYear: number | null;
}

interface EpqsAnswer {
  value?: number | string | null;
  resolution?: number | null;
  attributes?: { AcquisitionDate?: string | null };
}

export async function elevationAt(p: LatLon): Promise<Lookup<Elevation>> {
  const url = `https://epqs.nationalmap.gov/v1/json?x=${p.lon}&y=${p.lat}&wkid=4326&units=Meters&includeDate=true`;
  const res = await askJson<EpqsAnswer>(url, "The USGS elevation service", {
    revalidate: 30 * DAY_SECONDS,
    retries: 1,
  });
  if (!res.ok) return res;
  const metres = Number(res.data.value);
  // The service answers -1000000 where it has no terrain.
  if (!Number.isFinite(metres) || metres < -500) {
    return { ok: false, reason: "USGS has no elevation for this spot." };
  }
  const year = /(\d{4})\s*$/.exec(res.data.attributes?.AcquisitionDate ?? "")?.[1];
  return {
    ok: true,
    data: {
      metres,
      feet: metres * FT_PER_M,
      resolutionM: typeof res.data.resolution === "number" ? res.data.resolution : null,
      surveyYear: year ? Number(year) : null,
    },
  };
}

const MRLC = "https://www.mrlc.gov/geoserver/mrlc_display/wms";

interface FeatureInfo {
  features?: { properties?: { PALETTE_INDEX?: number } }[];
}

/** One land cover cell's value, 0 to 100, or null where the survey has none. */
async function coverAt(p: LatLon, layer: string): Promise<Lookup<number | null>> {
  // A three-by-three pixel window a few metres across, asked about its middle pixel.
  const d = 0.00005;
  const q = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: layer,
    query_layers: layer,
    info_format: "application/json",
    srs: "EPSG:4326",
    bbox: [p.lon - d, p.lat - d, p.lon + d, p.lat + d].map((v) => v.toFixed(6)).join(","),
    width: "3",
    height: "3",
    x: "1",
    y: "1",
  });
  const res = await askJson<FeatureInfo>(`${MRLC}?${q.toString()}`, "The land cover map server", {
    revalidate: 30 * DAY_SECONDS,
    retries: 1,
  });
  if (!res.ok) return res;
  const v = res.data.features?.[0]?.properties?.PALETTE_INDEX;
  return { ok: true, data: typeof v === "number" && v >= 0 && v <= 100 ? v : null };
}

export const canopyAt = (p: LatLon) => coverAt(p, "nlcd_tcc_conus_2021_v2021-4");
export const pavingAt = (p: LatLon) => coverAt(p, "NLCD_2021_Impervious_L48");
