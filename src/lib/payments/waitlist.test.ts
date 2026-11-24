import { test } from "node:test";
import assert from "node:assert/strict";
import { capInForce, capacityFrom, checkWaitlist, expectedWeeks, inviteExpiry, waitMissesDeadline, waitNote, INVITE_DAYS } from "./waitlist";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const base = { name: "Sam Buyer", email: "Sam@Example.com ", address: "800 South St, Philadelphia, PA" };

test("the waitlist form needs a name, an email and an address, and lower-cases the email", () => {
  const ok = checkWaitlist(form(base), "2026-11-24");
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.value.email, "sam@example.com");
  assert.deepEqual(checkWaitlist(form({ ...base, name: "" }), "2026-11-24"), { ok: false, error: "name" });
  assert.deepEqual(checkWaitlist(form({ ...base, email: "nope" }), "2026-11-24"), { ok: false, error: "email" });
  assert.deepEqual(checkWaitlist(form({ ...base, address: "x" }), "2026-11-24"), { ok: false, error: "address" });
  assert.deepEqual(checkWaitlist(form({ ...base, inspection_deadline: "2026-11-01" }), "2026-11-24"), { ok: false, error: "deadline_past" });
  assert.deepEqual(checkWaitlist(form({ ...base, inspection_deadline: "soon" }), "2026-11-24"), { ok: false, error: "deadline_invalid" });
  const dl = checkWaitlist(form({ ...base, inspection_deadline: "2026-12-20" }), "2026-11-24");
  assert.ok(dl.ok && dl.value.inspectionDeadline === "2026-12-20");
});

test("the cap: the database row wins, then the environment, then 10", () => {
  assert.equal(capInForce(8, {}), 8);
  assert.equal(capInForce(null, { ORDERS_WEEKLY_CAP: "3" }), null, "a null row means no cap, whatever the environment says");
  assert.equal(capInForce(undefined, { ORDERS_WEEKLY_CAP: "3" }), 3);
  assert.equal(capInForce(undefined, {}), 10);
  assert.equal(capInForce(undefined, { ORDERS_WEEKLY_CAP: "none" }), null);
});

test("held invites take places, and the week is full at the cap", () => {
  assert.deepEqual(capacityFrom(10, 7, 2), { cap: 10, orders: 7, held: 2, open: 1, full: false });
  assert.equal(capacityFrom(10, 8, 2).full, true);
  assert.equal(capacityFrom(10, 12, 0).open, 0);
  assert.equal(capacityFrom(null, 50, 0).full, false);
});

test("the quoted wait is whole weeks at the cap's pace, at least one", () => {
  assert.equal(expectedWeeks(1, 10), 1);
  assert.equal(expectedWeeks(10, 10), 1);
  assert.equal(expectedWeeks(11, 10), 2);
  assert.equal(expectedWeeks(31, 10), 4);
  assert.match(waitNote(11, 10), /number 11.*about 2 weeks.*up to 10 a week.*estimate, not a promise/s);
  assert.match(waitNote(1, 10), /about a week/);
});

test("an invite holds the place for a week", () => {
  const now = new Date("2026-11-24T15:00:00Z");
  assert.equal(inviteExpiry(now).getTime() - now.getTime(), INVITE_DAYS * 86_400_000);
});

test("a deadline the wait would likely miss is flagged before anyone waits on it", () => {
  // Number 1 at 10 a week: a week, then 10 working days (14 calendar) = 21 days.
  assert.equal(waitMissesDeadline("2026-12-05", 1, 10, "2026-11-24"), true);
  assert.equal(waitMissesDeadline("2026-12-20", 1, 10, "2026-11-24"), false);
  assert.equal(waitMissesDeadline("2026-12-20", 25, 10, "2026-11-24"), true);
  assert.equal(waitMissesDeadline(null, 25, 10, "2026-11-24"), false);
});
