import { test } from "node:test";
import assert from "node:assert/strict";
import { feedbackDue } from "./feedback";

const now = new Date("2026-12-10T15:00:00Z");

test("only delivered orders, and only after 7 days", () => {
  assert.equal(feedbackDue("in_progress", "2026-12-01T15:00:00Z", now).ok, false);
  assert.equal(feedbackDue("refunded", "2026-12-01T15:00:00Z", now).ok, false);
  assert.equal(feedbackDue("delivered", null, now).ok, false);
  assert.equal(feedbackDue("delivered", "2026-12-05T15:00:00Z", now).ok, false);
  const r = feedbackDue("delivered", "2026-12-02T15:00:00Z", now);
  assert.deepEqual(r, { ok: true, deliveredOn: "December 2" });
});
