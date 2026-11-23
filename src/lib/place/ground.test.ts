import { test } from "node:test";
import assert from "node:assert/strict";
import { kmToPath } from "./ground";
import { perYear } from "./readings";

test("distance to a path is to its nearest segment, not its nearest vertex", () => {
  const p = { lat: 40, lon: -100 };
  // A north-south line 0.1 degree of longitude east of the point.
  const km = kmToPath(p, [[-99.9, 39.5], [-99.9, 40.5]]);
  assert.ok(Math.abs(km - 0.1 * 111.32 * Math.cos((40 * Math.PI) / 180)) < 0.05, String(km));
});

test("a single-point path is measured to that point", () => {
  assert.ok(Math.abs(kmToPath({ lat: 0, lon: 0 }, [[0, 0.01]]) - 1.1132) < 0.001);
});

test("frequencies read as plain words", () => {
  assert.equal(perYear(1.297), "about 1.3 a year");
  assert.equal(perYear(0.276), "about once in 4 years");
  assert.equal(perYear(0.00225), "about once in 450 years");
  assert.equal(perYear(0.00001), "less than once in 1,000 years");
  assert.equal(perYear(0), "none on record");
  assert.equal(perYear(null), null);
});
