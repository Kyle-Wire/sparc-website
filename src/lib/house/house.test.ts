import { test } from "node:test";
import assert from "node:assert/strict";
import { stepsFor, share, STEP_KEYS } from "./progress";
import { parseProfile, greetingName, partOfDay } from "./profile";
import { latticeSource, nearest, formatDepth, type Lattice } from "./flood-lab";
import { isHouseBundle } from "./types";
import { SAMPLE_HOUSE } from "./sample";
import { hello, yearAfter, updateLines } from "./view";
import lattice from "./sample-flood-lattice.json";

const form = (o: Record<string, string>) => ({ get: (k: string) => (k in o ? o[k] : null) });

test("tracker: a fresh order in progress shows its first step running", () => {
  const s = stepsFor("in_progress", null);
  assert.equal(s[0].state, "running");
  assert.ok(s.slice(1).every((x) => x.state === "waiting"));
});

test("tracker: written steps show, and a delivered order is all done", () => {
  const s = stepsFor("in_progress", { place: { state: "done", at: "2026-11-25T00:00:00Z" }, flood: { state: "running" }, wind: { state: "skipped" } });
  assert.deepEqual(s.map((x) => x.state), ["done", "running", "waiting", "waiting", "skipped", "waiting"]);
  assert.equal(share(s), (2 + 0.5) / 6);
  assert.ok(stepsFor("delivered", null).every((x) => x.state === "done"));
  assert.equal(STEP_KEYS.length, 6);
});

test("tracker: unknown states are ignored", () => {
  assert.equal(stepsFor("card_saved", { flood: { state: "exploded" } })[1].state, "waiting");
});

test("profile: parses, trims and defaults", () => {
  const r = parseProfile(form({ display_name: "  Jordan   Rivera ", stage: "own", units: "metric", medical_power: "on" }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.profile.display_name, "Jordan Rivera");
  assert.equal(r.profile.stage, "own");
  assert.equal(r.profile.units, "metric");
  assert.equal(r.profile.medical_power, true);
  assert.equal(r.profile.alert_watching, "email");
});

test("profile: texts need a phone, and a bad phone is refused", () => {
  const a = parseProfile(form({ alert_preparing: "email_text" }));
  assert.equal(a.ok, false);
  const b = parseProfile(form({ phone: "call me maybe" }));
  assert.equal(b.ok, false);
  const c = parseProfile(form({ phone: "+1 (215) 555-0100", alert_preparing: "email_text", stage: "nonsense" }));
  assert.ok(c.ok && c.profile.stage === null);
});

test("greeting: first name, never an email", () => {
  assert.equal(greetingName({ display_name: "Jordan Rivera" }), "Jordan");
  assert.equal(greetingName({ display_name: null }, "Sam Lee"), "Sam");
  assert.equal(greetingName(null), null);
  assert.equal(partOfDay(new Date("2026-11-25T14:00:00Z")), "morning"); // 9 AM in Philadelphia
  assert.equal(partOfDay(new Date("2026-11-25T23:00:00Z")), "evening");
  assert.match(hello("Jordan", new Date("2026-11-25T19:00:00Z")), /^Good afternoon, Jordan\./);
});

test("updates: the free year runs a year from delivery", () => {
  assert.equal(yearAfter("2026-12-04T15:00:00Z"), "December 4, 2027");
  assert.match(updateLines("2026-12-04T15:00:00Z")[1], /December 4, 2027/);
});

test("demo lab: the table covers every combination and answers the stops", () => {
  const L = lattice as unknown as Lattice;
  assert.equal(L.rows.length, L.stops.reduce((a, s) => a * s.length, 1));
  const src = latticeSource(L);
  const a = src.ask(src.params.map((p) => p.start));
  assert.ok(a.wall.lo <= a.wall.mid && a.wall.mid <= a.wall.hi);
  // the last row is every slider at its top stop
  const top = src.ask(src.params.map((p) => p.max));
  const last = L.rows[L.rows.length - 1];
  assert.equal(top.rear.mid, last[3] / 1000);
  assert.equal(nearest([2, 5, 10], 7), 5);
});

test("demo lab: nothing-built range is the full model's own runs, in metres", () => {
  const s = latticeSource(lattice as unknown as Lattice).study;
  assert.ok(s.without && s.without[0] > 0.05 && s.without[1] < 0.1);
});

test("depths read in inches first", () => {
  assert.equal(formatDepth(0).big, "Dry");
  assert.equal(formatDepth(0.0254).big, "1.0 in");
  assert.equal(formatDepth(0.0254).small, "2.5 cm");
});

test("the sample house is a valid bundle with all five hazards", () => {
  assert.ok(isHouseBundle(SAMPLE_HOUSE));
  assert.equal(SAMPLE_HOUSE.hazards.length, 5);
  assert.equal(isHouseBundle({ ...SAMPLE_HOUSE, hazards: [{ key: "lava", headline: "", line: "", lab: "ready" }] }), false);
});
