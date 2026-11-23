import { test } from "node:test";
import assert from "node:assert/strict";
import { areaFresh, fromRentCast, isZip, WINDOW_CAP } from "./feed";
import { blockOf, floodSortName, hazardStates, placeForBlock, sortByFloodDepth, type BlockReadings, type ModelPlace } from "./blocks";

// The RentCast record below is the example in its Property Listings Schema
// (developers.rentcast.io/reference/property-listings-schema, opened 18
// November 2026), cut to the fields the site keeps.
const EXAMPLE = {
  id: "3821-Hargis-St,-Austin,-TX-78723",
  formattedAddress: "3821 Hargis St, Austin, TX 78723",
  city: "Austin",
  state: "TX",
  zipCode: "78723",
  latitude: 30.290643,
  longitude: -97.701547,
  propertyType: "Single Family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFootage: 2345,
  lotSize: 3284,
  yearBuilt: 2008,
  status: "Active",
  price: 899000,
  listedDate: "2024-06-24T00:00:00.000Z",
  daysOnMarket: 99,
  mlsName: "UnlockMLS",
  mlsNumber: "5519228",
  listingAgent: { name: "Jennifer Welch" },
  listingOffice: { name: "Gottesman Residential RE", phone: "5124512422" },
};

test("a RentCast record keeps its values under RESO names", () => {
  const r = fromRentCast(EXAMPLE, "78723", "2026-11-18T00:00:00.000Z");
  assert.ok(r);
  assert.equal(r.listing_key, "RentCast:3821-Hargis-St,-Austin,-TX-78723");
  assert.equal(r.ListPrice, 899000);
  assert.equal(r.BathroomsTotalDecimal, 2.5);
  assert.equal(r.ListingContractDate, "2024-06-24");
  assert.equal(r.OriginatingSystemName, "UnlockMLS");
  assert.equal(r.ListOfficeName, "Gottesman Residential RE");
  assert.equal(r.screening_hidden, false);
  assert.deepEqual(r.raw, EXAMPLE);
});

test("a record with no id is dropped; missing values stay missing, never zero", () => {
  assert.equal(fromRentCast({ ...EXAMPLE, id: "" }, "78723", "x"), null);
  const r = fromRentCast({ id: "a" }, "78723", "x");
  assert.equal(r?.ListPrice, null);
  assert.equal(r?.PostalCode, "78723");
});

test("the site's ceiling sits below RentCast's fifty", () => {
  assert.ok(WINDOW_CAP < 50);
});

test("an area is kept thirty days", () => {
  const now = new Date("2026-11-18T00:00:00Z");
  assert.equal(areaFresh("2026-10-20T00:00:00Z", now), true);
  assert.equal(areaFresh("2026-10-18T00:00:00Z", now), false);
  assert.equal(areaFresh(null, now), false);
  assert.equal(isZip("19147"), true);
  assert.equal(isZip("1914"), false);
});

const PLACE: ModelPlace = {
  place: "p",
  name: "A place",
  box: [-75.159, 39.9405, -75.1525, 39.944],
  hazards: { flood: "modelled", heat: "modelled", ground: "not_per_block", wind: "not_built" },
};

test("a listing's block is the site's rounded slug, matched to a place by its centre", () => {
  assert.equal(blockOf({ lat: 39.94361, lon: -75.15648 }), "39.944,-75.156");
  assert.equal(placeForBlock("39.944,-75.156", [PLACE])?.place, "p");
  assert.equal(placeForBlock("39.950,-75.156", [PLACE]), null);
  assert.equal(hazardStates(null).flood, "not_modelled");
  assert.equal(hazardStates(PLACE).ground, "not_per_block");
});

test("the sort is named for what it sorts and counts what it leaves out", () => {
  const storm = "100-yr 24 h";
  const r = (v: number | null): BlockReadings => ({
    flood: { [storm]: { value_cm: v, settings_spread_cm: v === null ? null : [v, v + 1], statement: "" } },
  });
  const readings = new Map([
    ["a", r(8)],
    ["b", r(3)],
    ["c", r(null)],
  ]);
  const out = sortByFloodDepth([{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }, { slug: "b" }], readings, storm);
  assert.deepEqual(out.sorted.map((l) => l.slug), ["b", "b", "a"]);
  assert.equal(out.leftOut, 2);
  assert.equal(out.name, floodSortName(storm));
  assert.doesNotMatch(out.name, /safe/i);
});
