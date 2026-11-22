import { test } from "node:test";
import assert from "node:assert/strict";
import { RECEIPTS, visibleReceipts, receiptsFor } from "./copy/receipts";
import { ENGINES } from "./engines";

test("every engine has receipts, and every receipt names a source", () => {
  for (const e of ENGINES) assert.ok(receiptsFor(e.id).length > 0, e.id);
  for (const q of RECEIPTS) for (const r of q.receipts) assert.ok(r.source.length > 0, r.text);
});

test("every quantity shows at least one failed or not-run check: no scoreboard of wins only", () => {
  for (const q of RECEIPTS) assert.ok(q.receipts.some((r) => r.verdict !== "passed"), q.quantity);
});

test("nothing is field-checked here, and no banned word appears", () => {
  const banned = /\b(validated|accurate|predicts?|guarantee|risk score|safe|sinking|rising|proven)\b/i;
  for (const q of RECEIPTS) {
    assert.notEqual(q.rung, 3, q.quantity);
    for (const r of q.receipts) assert.doesNotMatch(r.text, banned, r.text);
  }
});

test("receipts waiting on unmerged work stay hidden until marked live", () => {
  const wind = RECEIPTS.find((q) => q.quantity.startsWith("Storm gusts"))!;
  assert.ok(visibleReceipts(wind).every((r) => !r.shipsWhen || r.live));
  assert.ok(visibleReceipts(wind).length < wind.receipts.length);
});
