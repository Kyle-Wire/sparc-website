import { test } from "node:test";
import assert from "node:assert/strict";
import { addWorkingDays, checkDeadline, federalHolidays, formatDay, isDay, isWorkingDay, promisedBy, todayEastern } from "./turnaround";

test("federal holidays in 2026 fall where the 5 U.S.C. 6103 rules put them", () => {
  // Third Mondays, last Monday of May, first Monday of September, fourth Thursday of November; 4 July is a Saturday.
  const h = federalHolidays(2026);
  for (const d of ["2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07", "2026-10-12", "2026-11-11", "2026-11-26", "2026-12-25"]) {
    assert.ok(h.has(d), d);
  }
  assert.ok(!h.has("2026-07-04"), "4 July 2026 is a Saturday, observed on the Friday");
});

test("a New Year's Day on a Saturday is observed on 31 December of the year before", () => {
  // 1 January 2028 is a Saturday.
  assert.ok(federalHolidays(2027).has("2027-12-31"));
  assert.equal(isWorkingDay("2027-12-31"), false);
});

test("weekends and holidays are not working days", () => {
  assert.equal(isWorkingDay("2026-11-23"), true); // Monday
  assert.equal(isWorkingDay("2026-11-28"), false); // Saturday
  assert.equal(isWorkingDay("2026-11-26"), false); // Thanksgiving
});

test("ten working days from the Monday before Thanksgiving skip the holiday and two weekends", () => {
  // Mon 23 Nov 2026 + 10 working days: 24, 25, (26 Thanksgiving), 27, 30, 1, 2, 3, 4, 7, 8 -> Tue 8 Dec.
  assert.equal(promisedBy("2026-11-23", 10), "2026-12-08");
  assert.equal(addWorkingDays("2026-11-27", 1), "2026-11-30");
  assert.equal(addWorkingDays("2026-11-23", 0), "2026-11-23");
});

test("a deadline before the promise is tight, on or after it is fine", () => {
  const today = "2026-11-23";
  assert.deepEqual(checkDeadline("", today, 10), { kind: "none" });
  assert.deepEqual(checkDeadline("2026-12-03", today, 10), { kind: "tight", promisedBy: "2026-12-08", deadline: "2026-12-03" });
  assert.deepEqual(checkDeadline("2026-12-08", today, 10), { kind: "ok", promisedBy: "2026-12-08" });
  assert.deepEqual(checkDeadline("2026-11-20", today, 10), { kind: "past" });
  assert.deepEqual(checkDeadline("2026-11-23", today, 10).kind, "tight");
});

test("nonsense dates are refused, not guessed", () => {
  assert.equal(checkDeadline("2026-02-30", "2026-01-10", 10).kind, "invalid");
  assert.equal(checkDeadline("next week", "2026-01-10", 10).kind, "invalid");
  assert.equal(checkDeadline("2031-01-01", "2026-01-10", 10).kind, "invalid");
  assert.equal(isDay("2026-12-31"), true);
});

test("today is read in US Eastern time", () => {
  // 03:00 UTC on 24 Nov is still 23 Nov in Philadelphia.
  assert.equal(todayEastern(new Date("2026-11-24T03:00:00Z")), "2026-11-23");
  assert.equal(formatDay("2026-12-08"), "Tuesday, December 8");
});
