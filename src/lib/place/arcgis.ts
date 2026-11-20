// Esri's World Geocoding Service: the second address locator, asked only when
// the Census Bureau's geocoder finds nothing or does not answer.
//
// Why a second one. The Census geocoder matches against its own street-range
// files, so it misses streets newer than those files and addresses outside
// the ranges it holds, however the address is typed (tested 20 Nov 2026: unit
// numbers, "#2", no commas, a ZIP alone and a full state name all matched;
// new streets did not). Esri matched every test address. See
// docs/design/address-locators.md.
//
// It needs a key: ARCGIS_API_KEY, server side only, never NEXT_PUBLIC_.
// Esri's documentation says a token is required
// (https://developers.arcgis.com/rest/geocode/find-address-candidates/).
// With no key set, this locator is off and the site asks Census alone.
//
// Privacy, as for Census (census.ts): the address goes from our server, not
// the visitor's browser; nothing else about the visitor is sent; the answer is
// not cached, logged or stored. forStorage=false is Esri's "not stored" use:
// the result may be shown on a map and is not kept.

import { askJson, type Lookup } from "./lookup";
import type { GeocodeHit } from "./census";

const URL_BASE = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const WHO = "Esri's geocoder";

/** Match types that put the point on a house or building, not on a street, a
 *  ZIP code or a town. A block-level page needs the house: a point dropped on
 *  the middle of a long street or a town would show the wrong block. */
const HOUSE_LEVEL = new Set(["PointAddress", "Subaddress", "StreetAddress", "StreetAddressExt", "BuildingName"]);
const MIN_SCORE = 90;

interface Candidate {
  address?: string;
  score?: number;
  location?: { x: number; y: number };
  attributes?: { Addr_type?: string; Match_addr?: string };
}

export function arcgisConfigured(): boolean {
  return Boolean(process.env.ARCGIS_API_KEY);
}

/** The first candidate if it is a house-level match Esri is sure of. */
export function pickCandidate(candidates: Candidate[] | undefined): GeocodeHit | null {
  const c = candidates?.[0];
  if (!c?.location || typeof c.score !== "number") return null;
  if (c.score < MIN_SCORE) return null;
  if (!HOUSE_LEVEL.has(c.attributes?.Addr_type ?? "")) return null;
  const { x, y } = c.location;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { point: { lat: y, lon: x }, matched: c.attributes?.Match_addr ?? c.address ?? "" };
}

export async function geocodeAddressArcgis(address: string): Promise<Lookup<GeocodeHit | null>> {
  const key = process.env.ARCGIS_API_KEY;
  if (!key) return { ok: false, reason: `${WHO} is not set up on this site.`, final: true };
  const params = new URLSearchParams({
    f: "json",
    SingleLine: address,
    countryCode: "USA",
    maxLocations: "1",
    outFields: "Addr_type,Match_addr",
    forStorage: "false",
    token: key,
  });
  const res = await askJson<{ candidates?: Candidate[] }>(`${URL_BASE}?${params}`, WHO, { timeoutMs: 15_000 });
  if (!res.ok) return res;
  return { ok: true, data: pickCandidate(res.data.candidates) };
}
