import { test } from "node:test";
import assert from "node:assert/strict";
import { pickHouse, pickStreet, type PhotonFeature } from "./photon";
import { parseTyped, streetCore } from "./address-match";

const f = (props: PhotonFeature["properties"], lon = -77.05, lat = 38.89): PhotonFeature => ({
  geometry: { coordinates: [lon, lat] },
  properties: { countrycode: "US", ...props },
});

test("the typed address is read into number, street and state", () => {
  assert.deepEqual(parseTyped("4059 Mt Lee Dr, Los Angeles, CA 90068"), { number: "4059", street: "Mt Lee Dr", state: "ca" });
  assert.deepEqual(parseTyped("1 Apple Park Way Apt 4, Cupertino, California"), { number: "1", street: "Apple Park Way", state: "ca" });
  assert.equal(parseTyped("600 Montgomery St, San Francisco, CA, USA").state, "ca");
  assert.equal(parseTyped("12 Main St").state, null);
});

test("street names compare without spelling, direction or type", () => {
  assert.equal(streetCore("Mount Lee Drive"), streetCore("Mt Lee Dr"));
  assert.equal(streetCore("Lincoln Memorial Cir NW"), streetCore("Lincoln Memorial Circle Northwest"));
  assert.equal(streetCore("Fifth Avenue"), streetCore("5th Ave"));
  assert.notEqual(streetCore("Main St"), streetCore("South 6th Street"));
});

test("a house is taken only with its number, street and state", () => {
  const hit = pickHouse("1600 Amphitheatre Pkwy, Mountain View, CA", [
    f({ housenumber: "1600", street: "Amphitheatre Parkway", city: "Mountain View", state: "California" }, -122.084, 37.422),
  ]);
  assert.equal(hit?.precision, "house");
  assert.deepEqual(hit?.point, { lat: 37.422, lon: -122.084 });
  assert.equal(pickHouse("1602 Amphitheatre Pkwy, Mountain View, CA", [f({ housenumber: "1600", street: "Amphitheatre Parkway", state: "California" })]), null);
  assert.equal(pickHouse("1600 Amphitheatre Pkwy, Mountain View, CA", [f({ housenumber: "1600", street: "Amphitheatre Parkway", state: "Oregon" })]), null);
});

test("the wrong place Photon offers for a missing street is refused", () => {
  // "1 Main St, Springfield, IL" came back as a clinic on South 6th Street (20 Nov 2026).
  const answer = [f({ type: "house", name: "Clinic", housenumber: "1", street: "South 6th Street", city: "Springfield", state: "Illinois" })];
  assert.equal(pickHouse("1 Main St, Springfield, IL", answer), null);
  assert.equal(pickStreet("1 Main St, Springfield, IL", answer), null);
});

test("a street, or a crossing on it, gives a street-level answer", () => {
  const street = pickStreet("4059 Mt Lee Dr, Los Angeles, CA", [f({ type: "street", name: "Mount Lee Drive", city: "Los Angeles", state: "California" })]);
  assert.equal(street?.precision, "street");
  const crossing = pickStreet("2 Lincoln Memorial Cir NW, Washington, DC", [
    f({ type: "other", name: "Henry Bacon Dr & Lincoln Memorial Circle NW", state: "District of Columbia" }),
  ]);
  assert.equal(crossing?.precision, "street");
});

test("answers outside the US are refused", () => {
  assert.equal(pickHouse("10 Downing St", [f({ countrycode: "GB", housenumber: "10", street: "Downing Street" })]), null);
});
