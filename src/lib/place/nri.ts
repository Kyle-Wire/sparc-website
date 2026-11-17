// FEMA's National Risk Index: how FEMA rates a census tract for eighteen
// natural hazards.
//   https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0
//
// FEMA's own description of the dataset: it "was created to help illustrate
// the United States communities most at risk for 18 natural hazards"
// (fema.gov, Resilience Analysis and Planning Tool page, read 17 Nov 2026).
//
// What is shown and what is deliberately not. Shown: FEMA's rating word for
// each hazard and for the tract overall, exactly as FEMA gives it. Not shown:
// the index's dollar figures (expected annual loss) or its scores. The site
// makes no statement about loss, and a rating of a community is not a rating
// of a house; the card says both.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";

const SERVICE =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0";

/** Field prefix to FEMA's hazard name, from the service's own field aliases. */
const HAZARDS: [string, string][] = [
  ["AVLN", "Avalanche"],
  ["CFLD", "Coastal flooding"],
  ["CWAV", "Cold wave"],
  ["DRGT", "Drought"],
  ["ERQK", "Earthquake"],
  ["HAIL", "Hail"],
  ["HWAV", "Heat wave"],
  ["HRCN", "Hurricane"],
  ["ISTM", "Ice storm"],
  ["LNDS", "Landslide"],
  ["LTNG", "Lightning"],
  ["IFLD", "Inland flooding"],
  ["SWND", "Strong wind"],
  ["TRND", "Tornado"],
  ["TSUN", "Tsunami"],
  ["VLCN", "Volcanic activity"],
  ["WFIR", "Wildfire"],
  ["WNTW", "Winter weather"],
];

/** FEMA's five rating words, lowest first. Anything else ("No Rating", "Not
 *  Applicable", "Insufficient Data") has no rank. */
const RANKS = ["Very Low", "Relatively Low", "Relatively Moderate", "Relatively High", "Very High"];

export interface HazardRating {
  hazard: string;
  /** FEMA's rating, verbatim. */
  rating: string;
  /** 1 (very low) to 5 (very high); 0 when FEMA gives no rating. */
  rank: number;
}

export interface TractRisk {
  overall: HazardRating;
  hazards: HazardRating[];
  /** FEMA's version label for the index, e.g. "December 2025". */
  version: string | null;
}

function rated(hazard: string, rating: unknown): HazardRating {
  const text = typeof rating === "string" && rating.trim() ? rating.trim() : "No Rating";
  return { hazard, rating: text, rank: RANKS.indexOf(text) + 1 };
}

export async function riskInTract(tractGeoid: string): Promise<Lookup<TractRisk>> {
  if (!/^\d{11}$/.test(tractGeoid)) return { ok: false, reason: "No census tract to look up." };
  const fields = ["NRI_VER", "RISK_RATNG", ...HAZARDS.map(([k]) => `${k}_RISKR`)].join(",");
  const q = new URLSearchParams({
    where: `TRACTFIPS='${tractGeoid}'`,
    outFields: fields,
    returnGeometry: "false",
    f: "json",
  });
  const res = await askJson<{ features?: { attributes: Record<string, unknown> }[] }>(
    `${SERVICE}/query?${q.toString()}`,
    "FEMA's National Risk Index service",
    { revalidate: 7 * DAY_SECONDS, retries: 1 },
  );
  if (!res.ok) return res;
  const row = res.data.features?.[0]?.attributes;
  if (!row) return { ok: false, reason: "FEMA's National Risk Index has no entry for this census tract." };

  const hazards = HAZARDS.map(([k, name]) => rated(name, row[`${k}_RISKR`])).sort(
    (a, b) => b.rank - a.rank || a.hazard.localeCompare(b.hazard),
  );
  return {
    ok: true,
    data: {
      overall: rated("All hazards together", row.RISK_RATNG),
      hazards,
      version: typeof row.NRI_VER === "string" ? row.NRI_VER : null,
    },
  };
}
