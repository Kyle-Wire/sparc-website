// Everything the site reads about one place, gathered once.
//
// The place page, the comparison page and the saved-place snapshot all read
// from here, so the three cannot disagree about what a record says.

import { areasAt, type PlaceAreas } from "./census";
import type { LatLon } from "./coords";
import { floodZonesAt, type FloodZones } from "./fema";
import { stormsNear, type NearbyStorms } from "./hurricanes";
import type { Lookup } from "./lookup";
import { riskInTract, type TractRisk } from "./nri";
import { claimsInTract, declarationsInCounty, type CountyDeclarations, type TractClaims } from "./openfema";
import { groundAround, landCoverAround, type Ground, type LandCover } from "./surroundings";

/** The headline records in a form small enough to keep and compare. A null
 *  means the source did not answer, never "zero". */
export interface Glance {
  /** e.g. "Charleston, SC" */
  where: string;
  /** e.g. "AE", or "AE + 1 more", or "Not mapped" */
  zone: string | null;
  /** True when FEMA flags any zone on the block as a Special Flood Hazard Area. */
  sfha: boolean | null;
  claims: number | null;
  declarations: number | null;
  storms: number;
  /** FEMA's overall National Risk Index rating for the tract, verbatim. */
  risk: string | null;
}

export interface PlaceRecord {
  place: LatLon;
  areas: Lookup<PlaceAreas>;
  zones: Lookup<FloodZones>;
  claims: Lookup<TractClaims>;
  declarations: Lookup<CountyDeclarations>;
  risk: Lookup<TractRisk>;
  /** Tree canopy and paving: the block against the square kilometre around it. */
  cover: Lookup<LandCover>;
  /** Ground height: the block against the square kilometre around it. */
  ground: Lookup<Ground>;
  storms: NearbyStorms;
  glance: Glance;
}

export async function loadPlace(place: LatLon): Promise<PlaceRecord> {
  const areas = await areasAt(place);
  const noArea = { ok: false as const, reason: areas.ok ? "" : areas.reason };

  const [zones, claims, declarations, risk, cover, ground] = await Promise.all([
    floodZonesAt(place),
    areas.ok ? claimsInTract(areas.data.tractGeoid) : noArea,
    areas.ok ? declarationsInCounty(areas.data.stateFips, areas.data.countyFips) : noArea,
    areas.ok ? riskInTract(areas.data.tractGeoid) : noArea,
    landCoverAround(place),
    groundAround(place),
  ]);
  const storms = stormsNear(place);

  let zone: string | null = null;
  let sfha: boolean | null = null;
  if (zones.ok) {
    const z = zones.data.zones;
    zone = z.length === 0 ? "Not mapped" : z.length === 1 ? z[0].code : `${z[0].code} + ${z.length - 1} more`;
    sfha = z.some((x) => x.inSfha);
  }

  return {
    place,
    areas,
    zones,
    claims,
    declarations,
    risk,
    cover,
    ground,
    storms,
    glance: {
      where: areas.ok
        ? `${areas.data.localName ?? areas.data.countyName}, ${areas.data.stateAbbr}`
        : "the United States",
      zone,
      sfha,
      claims: claims.ok ? claims.data.total : null,
      declarations: declarations.ok ? declarations.data.total : null,
      storms: storms.total,
      risk: risk.ok ? risk.data.overall.rating : null,
    },
  };
}
