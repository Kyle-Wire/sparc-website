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

/** The fast part of a place, and the three live lookups still on their way.
 *  The census answer and the site's own FEMA tables arrive in well under a
 *  second; FEMA's flood map, USGS ground height and the land cover survey are
 *  asked live and can take several. The place page shows the first part at
 *  once and fills in the rest as each answers. */
export interface PlaceStart {
  place: LatLon;
  areas: Lookup<PlaceAreas>;
  claims: Lookup<TractClaims>;
  declarations: Lookup<CountyDeclarations>;
  risk: Lookup<TractRisk>;
  storms: NearbyStorms;
  zones: Promise<Lookup<FloodZones>>;
  cover: Promise<Lookup<LandCover>>;
  ground: Promise<Lookup<Ground>>;
}

/** Starts every lookup and waits only for the fast ones. Lookups never throw
 *  (src/lib/place/lookup.ts), so the promises left open never reject. */
export async function startPlace(place: LatLon): Promise<PlaceStart> {
  // The live ones start first so they are not held up by the census.
  const zones = floodZonesAt(place);
  const cover = landCoverAround(place);
  const ground = groundAround(place);
  const areas = await areasAt(place);
  const noArea = { ok: false as const, reason: areas.ok ? "" : areas.reason };
  const [claims, declarations, risk] = await Promise.all([
    areas.ok ? claimsInTract(areas.data.tractGeoid) : noArea,
    areas.ok ? declarationsInCounty(areas.data.stateFips, areas.data.countyFips) : noArea,
    areas.ok ? riskInTract(areas.data.tractGeoid) : noArea,
  ]);
  return { place, areas, claims, declarations, risk, storms: stormsNear(place), zones, cover, ground };
}

/** "Charleston, SC", or "the United States" when the census did not answer. */
export function whereOf(areas: Lookup<PlaceAreas>): string {
  return areas.ok ? `${areas.data.localName ?? areas.data.countyName}, ${areas.data.stateAbbr}` : "the United States";
}

/** The headline row. Pass `zones: null` while FEMA's flood map is still being
 *  asked; the zone is then null, as it is when FEMA did not answer. */
export function glanceOf(s: Omit<PlaceStart, "zones" | "cover" | "ground">, zones: Lookup<FloodZones> | null): Glance {
  let zone: string | null = null;
  let sfha: boolean | null = null;
  if (zones?.ok) {
    const z = zones.data.zones;
    zone = z.length === 0 ? "Not mapped" : z.length === 1 ? z[0].code : `${z[0].code} + ${z.length - 1} more`;
    sfha = z.some((x) => x.inSfha);
  }
  return {
    where: whereOf(s.areas),
    zone,
    sfha,
    claims: s.claims.ok ? s.claims.data.total : null,
    declarations: s.declarations.ok ? s.declarations.data.total : null,
    storms: s.storms.total,
    risk: s.risk.ok ? s.risk.data.overall.rating : null,
  };
}

/** Waits for the live lookups and gives the whole record. */
export async function finishPlace(s: PlaceStart): Promise<PlaceRecord> {
  const [zones, cover, ground] = await Promise.all([s.zones, s.cover, s.ground]);
  const { place, areas, claims, declarations, risk, storms } = s;
  return { place, areas, zones, claims, declarations, risk, cover, ground, storms, glance: glanceOf(s, zones) };
}

export async function loadPlace(place: LatLon): Promise<PlaceRecord> {
  return finishPlace(await startPlace(place));
}
