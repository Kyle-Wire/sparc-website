import { test } from "node:test";
import assert from "node:assert/strict";
import { glanceItems } from "../../components/place/glance";
import type { FloodZones } from "./fema";
import type { Lookup } from "./lookup";
import { glanceOf, whereOf } from "./summary";

// The place page shows the headline row before FEMA's flood map has answered,
// then again once it has. These check that the early row never states a zone,
// and that a pending zone reads differently from one FEMA did not give.

const none = { ok: false as const, reason: "no answer" };
const fast = {
  place: { lat: 32.777, lon: -79.931 },
  areas: none,
  claims: { ok: true as const, data: { total: 3 } },
  declarations: none,
  risk: none,
  storms: { total: 7 },
} as unknown as Parameters<typeof glanceOf>[0];

const zonesOf = (z: { code: string; inSfha: boolean }[]) =>
  ({ ok: true, data: { zones: z.map((x) => ({ ...x, subtype: null })), panelDate: null } }) as unknown as Lookup<FloodZones>;

test("while FEMA is being asked, the row holds no zone", () => {
  const g = glanceOf(fast, null);
  assert.equal(g.zone, null);
  assert.equal(g.sfha, null);
  assert.equal(g.claims, 3);
  assert.equal(g.declarations, null);
  assert.equal(g.storms, 7);
});

test("a pending zone says FEMA is being asked; a missing one is a dash", () => {
  const g = glanceOf(fast, null);
  assert.equal(glanceItems(g, true)[0].value, "Asking FEMA");
  assert.equal(glanceItems(g)[0].value, "—");
});

test("zones are named as FEMA gives them", () => {
  assert.equal(glanceOf(fast, zonesOf([])).zone, "Not mapped");
  assert.equal(glanceOf(fast, zonesOf([{ code: "AE", inSfha: true }])).zone, "AE");
  const two = glanceOf(fast, zonesOf([{ code: "AE", inSfha: false }, { code: "X", inSfha: true }]));
  assert.equal(two.zone, "AE + 1 more");
  assert.equal(two.sfha, true);
  assert.equal(glanceOf(fast, none as Lookup<FloodZones>).zone, null);
});

test("with no census answer the place is the United States", () => {
  assert.equal(whereOf(none), "the United States");
});
