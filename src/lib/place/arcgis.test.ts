import { test } from "node:test";
import assert from "node:assert/strict";
import { pickCandidate } from "./arcgis";

const at = { x: -122.0842, y: 37.4224 };

test("a sure, house-level match is taken", () => {
  const hit = pickCandidate([{ score: 100, location: at, attributes: { Addr_type: "PointAddress", Match_addr: "1600 Amphitheatre Pkwy" } }]);
  assert.deepEqual(hit, { point: { lat: 37.4224, lon: -122.0842 }, matched: "1600 Amphitheatre Pkwy" });
});

test("a match on a street, a ZIP or a town is not taken", () => {
  for (const Addr_type of ["StreetName", "Postal", "Locality", "PostalExt", "StreetInt"]) {
    assert.equal(pickCandidate([{ score: 100, location: at, attributes: { Addr_type } }]), null, Addr_type);
  }
});

test("an unsure match is not taken", () => {
  assert.equal(pickCandidate([{ score: 80, location: at, attributes: { Addr_type: "PointAddress" } }]), null);
});

test("no candidates is no match", () => {
  assert.equal(pickCandidate([]), null);
  assert.equal(pickCandidate(undefined), null);
});
