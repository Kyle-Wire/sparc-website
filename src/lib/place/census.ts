// US Census Bureau geocoder: an address to a point, and a point to the census
// areas around it. Public, no key. https://geocoding.geo.census.gov/geocoder/
//
// Privacy. geocodeAddress is the one call on this site that sends something a
// visitor typed to an outside service. It is made from the server, so the
// Census Bureau sees the address but not the visitor's browser; the answer is
// never cached and the address is never logged or stored by this code.
// areasAt only ever receives a rounded place (see coords.ts).

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import type { LatLon } from "./coords";

const BASE = "https://geocoding.geo.census.gov/geocoder";
const VINTAGE = "benchmark=Public_AR_Current&vintage=Current_Current&format=json";
const WHO = "The Census Bureau's geocoder";

interface CensusMatch {
  matchedAddress: string;
  coordinates: { x: number; y: number };
}

export interface GeocodeHit {
  point: LatLon;
  /** The address as the Census Bureau standardised it. Shown to the visitor
   *  only; never stored. */
  matched: string;
}

export async function geocodeAddress(address: string): Promise<Lookup<GeocodeHit | null>> {
  const url = `${BASE}/locations/onelineaddress?address=${encodeURIComponent(address)}&${VINTAGE}`;
  const res = await askJson<{ result?: { addressMatches?: CensusMatch[] } }>(url, WHO, { timeoutMs: 20_000 });
  if (!res.ok) return res;
  const hit = res.data.result?.addressMatches?.[0];
  if (!hit) return { ok: true, data: null };
  return {
    ok: true,
    data: { point: { lat: hit.coordinates.y, lon: hit.coordinates.x }, matched: hit.matchedAddress },
  };
}

interface CensusArea {
  GEOID?: string;
  NAME?: string;
  BASENAME?: string;
  STATE?: string;
  COUNTY?: string;
  STUSAB?: string;
}

export interface PlaceAreas {
  /** Eleven digits: state, county, tract. */
  tractGeoid: string;
  tractName: string;
  countyName: string;
  countyFips: string;
  stateFips: string;
  stateAbbr: string;
  stateName: string;
  /** City, town or township, when the Census Bureau lists one here. */
  localName: string | null;
}

export async function areasAt(place: LatLon): Promise<Lookup<PlaceAreas>> {
  const url = `${BASE}/geographies/coordinates?x=${place.lon}&y=${place.lat}&${VINTAGE}`;
  const res = await askJson<{ result?: { geographies?: Record<string, CensusArea[]> } }>(url, WHO, {
    revalidate: 30 * DAY_SECONDS,
  });
  if (!res.ok) return res;
  const g = res.data.result?.geographies ?? {};
  const tract = g["Census Tracts"]?.[0];
  const county = g["Counties"]?.[0];
  const state = g["States"]?.[0];
  if (!tract?.GEOID || !county?.COUNTY || !state?.STATE) {
    return { ok: false, reason: "The Census Bureau lists no census tract here. Is this point on land in the US?" };
  }
  const local = g["Incorporated Places"]?.[0] ?? g["County Subdivisions"]?.[0];
  return {
    ok: true,
    data: {
      tractGeoid: tract.GEOID,
      tractName: tract.NAME ?? `Census Tract ${tract.BASENAME ?? ""}`.trim(),
      countyName: county.NAME ?? "",
      countyFips: county.COUNTY,
      stateFips: state.STATE,
      stateAbbr: state.STUSAB ?? "",
      stateName: state.NAME ?? "",
      localName: local?.BASENAME ?? null,
    },
  };
}

/** The ZIP code area (the Census Bureau's ZCTA, which follows ZIP codes) a
 *  rounded place falls in. Used to ask the listings feed by area, never by
 *  address (Climate Inspection D42 item 3). Null when the point is in none. */
export async function zipAreaAt(place: LatLon): Promise<Lookup<string | null>> {
  const url = `${BASE}/geographies/coordinates?x=${place.lon}&y=${place.lat}&${VINTAGE}&layers=all`;
  const res = await askJson<{ result?: { geographies?: Record<string, CensusArea[]> } }>(url, WHO, {
    revalidate: 30 * DAY_SECONDS,
  });
  if (!res.ok) return res;
  const g = res.data.result?.geographies ?? {};
  const key = Object.keys(g).find((k) => k.includes("ZIP Code Tabulation Areas"));
  const zcta = key ? (g[key]?.[0] as (CensusArea & { ZCTA5?: string }) | undefined) : undefined;
  return { ok: true, data: zcta?.ZCTA5 ?? zcta?.GEOID ?? null };
}
