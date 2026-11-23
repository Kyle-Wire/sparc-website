// Photon (photon.komoot.io): the second address locator, asked only when the
// Census Bureau's geocoder finds nothing or does not answer. Keyless.
//
// Why a second one. The Census geocoder matches against its own street-range
// files, so it misses streets newer than those files and addresses outside the
// ranges it holds, however the address is typed (tested 20 Nov 2026). See
// docs/design/address-locators.md for what was tried and why this one.
//
// Terms (https://photon.komoot.io/, read 20 Nov 2026): free to use for a
// project if use is fair; heavy use is throttled; no promise of availability.
// The data is OpenStreetMap's, so a place found this way is credited to
// OpenStreetMap's contributors (ODbL) where it is shown.
//
// Photon answers with the nearest thing it knows, so its answer is checked
// against what was typed (address-match.ts):
//   house   the house number and street match: the point is the house.
//   street  only the typed street matches: the point is somewhere on that
//           street, and the visitor is told so. It never stands in for the house.
//
// Privacy, as for Census: the address goes from our server, not the visitor's
// browser; nothing else is sent; nothing is cached, logged or stored.

import { askJson, type Lookup } from "./lookup";
import type { LatLon } from "./coords";
import { parseTyped, sameNumber, sameState, sameStreet } from "./address-match";

const BASE = "https://photon.komoot.io/api/";
const WHO = "Photon (OpenStreetMap)";

export interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
}

export interface PhotonHit {
  point: LatLon;
  matched: string;
  precision: "house" | "street";
}

function pointOf(f: PhotonFeature): LatLon | null {
  const c = f.geometry?.coordinates;
  if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
  return { lat: c[1], lon: c[0] };
}

function label(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(", ");
}

/** A house whose number and street are the ones typed, in the state typed. */
export function pickHouse(address: string, features: PhotonFeature[]): PhotonHit | null {
  const t = parseTyped(address);
  if (!t.number) return null;
  for (const f of features) {
    const p = f.properties ?? {};
    if (p.countrycode && p.countrycode.toUpperCase() !== "US") continue;
    if (!sameNumber(t.number, p.housenumber) || !sameStreet(t.street, p.street) || !sameState(t.state, p.state)) continue;
    const point = pointOf(f);
    if (point) return { point, matched: label([`${p.housenumber} ${p.street}`, p.city, p.state, p.postcode]), precision: "house" };
  }
  return null;
}

/** The typed street itself. A crossing named "A St & B Ave" counts for
 *  either street. */
export function pickStreet(address: string, features: PhotonFeature[]): PhotonHit | null {
  const t = parseTyped(address);
  for (const f of features) {
    const p = f.properties ?? {};
    if (p.countrycode && p.countrycode.toUpperCase() !== "US") continue;
    if (!sameState(t.state, p.state)) continue;
    const isStreet = p.type === "street" && sameStreet(t.street, p.name);
    const crossing = (p.name ?? "").split(/\s*&\s*/);
    const isCrossing = crossing.length > 1 && crossing.some((n) => sameStreet(t.street, n));
    if (!isStreet && !isCrossing) continue;
    const point = pointOf(f);
    if (point) return { point, matched: label([isStreet ? p.name : t.street, p.city, p.state]), precision: "street" };
  }
  return null;
}

async function ask(q: string): Promise<Lookup<PhotonFeature[]>> {
  const params = new URLSearchParams({ q, limit: "5", lang: "en" });
  const res = await askJson<{ features?: PhotonFeature[] }>(`${BASE}?${params}`, WHO, { timeoutMs: 10_000 });
  return res.ok ? { ok: true, data: res.data.features ?? [] } : res;
}

/** The house if Photon has it; otherwise the typed street; otherwise nothing. */
export async function geocodeAddressPhoton(address: string): Promise<Lookup<PhotonHit | null>> {
  const full = await ask(address);
  if (!full.ok) return full;
  const house = pickHouse(address, full.data);
  if (house) return { ok: true, data: house };
  const street = pickStreet(address, full.data);
  if (street) return { ok: true, data: street };

  // Asked with the house number, Photon can rank a nearby shop above the
  // street. Ask once more for the street and town alone.
  const t = parseTyped(address);
  if (!t.number) return { ok: true, data: null };
  const rest = address.split(",").slice(1).join(",");
  const streetOnly = await ask(rest ? `${t.street},${rest}` : t.street);
  if (!streetOnly.ok) return { ok: true, data: null };
  return { ok: true, data: pickStreet(address, streetOnly.data) };
}
