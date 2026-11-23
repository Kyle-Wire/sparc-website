import { test } from "node:test";
import assert from "node:assert/strict";
import { mayCancel, orderDates } from "./self-serve";

test("cancel only while nothing is charged and the report is not finished", () => {
  assert.equal(mayCancel("card_saved"), true);
  assert.equal(mayCancel("in_progress"), true);
  for (const s of ["awaiting_card", "abandoned", "charging", "payment_failed", "delivered", "refunded", "cancelled", "cannot_model"]) {
    assert.equal(mayCancel(s), false, s);
  }
});

test("promise is 10 working days from the order day in US Eastern", () => {
  // Monday 23 Nov 2026, 9 pm Eastern = Tuesday 02:00 UTC: the order day is the Monday.
  // Thanksgiving (Thu 26 Nov) is skipped: 24,25,27,30 Nov, 1,2,3,4,7,8 Dec.
  const d = orderDates("2026-11-24T02:00:00Z", null, 10);
  assert.equal(d.promised, "2026-12-08");
  assert.equal(d.deadline, null);
  assert.equal(d.tight, false);
});

test("a deadline before the promise is tight; on or after is not", () => {
  assert.equal(orderDates("2026-11-24T02:00:00Z", "2026-12-04", 10).tight, true);
  assert.equal(orderDates("2026-11-24T02:00:00Z", "2026-12-08", 10).tight, false);
  assert.equal(orderDates("2026-11-24T02:00:00Z", "not a date", 10).deadline, null);
});
