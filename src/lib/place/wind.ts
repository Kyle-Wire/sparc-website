// How often FEMA counts wind events in the census tract around a spot.
//
//   FEMA, National Risk Index, census tracts (the same service nri.ts reads):
//   https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0
//   Fields TRND_AFREQ, SWND_AFREQ, HRCN_AFREQ: FEMA's annualized frequency,
//   events a year recorded for the tract.
//
// What is shown: FEMA's frequency, as FEMA gives it, for the tract. It counts
// events over the whole tract, so a big rural tract records more than a small
// city one for the same weather; the card says it is the tract's count. Not
// shown: the index's dollar figures (repo rule: no expected loss).

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import type { LatLon } from "./coords";

const SERVICE =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0/query";

export interface WindFrequency {
  tract: string;
  /** Events a year, as FEMA gives them; null where FEMA has none. */
  tornado: number | null;
  strongWind: number | null;
  hurricane: number | null;
  version: string | null;
}

interface Answer {
  error?: unknown;
  features?: { attributes?: Record<string, unknown> }[];
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function windFrequencyAt(p: LatLon): Promise<Lookup<WindFrequency | null>> {
  const q = new URLSearchParams({
    geometry: `${p.lon},${p.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "TRACTFIPS,TRND_AFREQ,SWND_AFREQ,HRCN_AFREQ,NRI_VER",
    returnGeometry: "false",
    f: "json",
  });
  const res = await askJson<Answer>(`${SERVICE}?${q}`, "FEMA's National Risk Index", { revalidate: 30 * DAY_SECONDS, timeoutMs: 12_000 });
  if (!res.ok) return res;
  if (res.data.error) return { ok: false, reason: "FEMA's National Risk Index answered with an error." };
  const a = res.data.features?.[0]?.attributes;
  if (!a) return { ok: true, data: null };
  return {
    ok: true,
    data: {
      tract: String(a.TRACTFIPS ?? ""),
      tornado: num(a.TRND_AFREQ),
      strongWind: num(a.SWND_AFREQ),
      hurricane: num(a.HRCN_AFREQ),
      version: typeof a.NRI_VER === "string" ? a.NRI_VER : null,
    },
  };
}
