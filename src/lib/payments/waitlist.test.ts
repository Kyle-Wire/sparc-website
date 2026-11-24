import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlaceInLine, waitlistReason } from "./waitlist";

test("the wait-list note carries the block, the deadline and the buyer's words on their own lines", () => {
  const r = waitlistReason({ place: "39.942,-75.155", deadline: "2026-12-10", note: "We close\nin three weeks" });
  assert.equal(r, "House report wait list\nBlock: 39.942,-75.155\nInspection deadline: 2026-12-10\nNote: We close in three weeks");
});

test("bad place or deadline values are dropped, not stored", () => {
  const r = waitlistReason({ place: "<script>", deadline: "next week", note: "" });
  assert.match(r, /Block: not given/);
  assert.match(r, /Inspection deadline: not given/);
  assert.doesNotMatch(r, /Note:/);
});

test("a place in line is a positive whole number or nothing", () => {
  assert.equal(parsePlaceInLine("3"), 3);
  assert.equal(parsePlaceInLine("0"), null);
  assert.equal(parsePlaceInLine("-1"), null);
  assert.equal(parsePlaceInLine("2.5"), null);
  assert.equal(parsePlaceInLine(undefined), null);
});
