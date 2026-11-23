import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTEMPT_LIMIT, tooManyAttempts } from "./attempts";

// A stand-in for the Supabase query chain that records the filters and returns a count.
function fakeAdmin(result: { count: number | null; error: unknown }) {
  const calls: unknown[][] = [];
  const chain = {
    from: (...a: unknown[]) => (calls.push(["from", ...a]), chain),
    select: (...a: unknown[]) => (calls.push(["select", ...a]), chain),
    eq: (...a: unknown[]) => (calls.push(["eq", ...a]), chain),
    in: (...a: unknown[]) => (calls.push(["in", ...a]), chain),
    gte: (...a: unknown[]) => (calls.push(["gte", ...a]), Promise.resolve(result)),
  };
  return { admin: chain as unknown as SupabaseClient, calls };
}

test("unfinished checkouts: limited per account over the last day, failing open", async () => {
  const now = new Date("2026-11-24T12:00:00Z");
  const under = fakeAdmin({ count: ATTEMPT_LIMIT - 1, error: null });
  assert.equal(await tooManyAttempts(under.admin, "u1", now), false);
  assert.deepEqual(under.calls.find((c) => c[0] === "eq"), ["eq", "user_id", "u1"]);
  assert.deepEqual(under.calls.find((c) => c[0] === "in"), ["in", "status", ["awaiting_card", "abandoned"]]);
  assert.deepEqual(under.calls.find((c) => c[0] === "gte"), ["gte", "created_at", "2026-11-23T12:00:00.000Z"]);

  assert.equal(await tooManyAttempts(fakeAdmin({ count: ATTEMPT_LIMIT, error: null }).admin, "u1", now), true);
  const origError = console.error;
  console.error = () => {};
  try {
    assert.equal(await tooManyAttempts(fakeAdmin({ count: null, error: new Error("down") }).admin, "u1", now), false);
  } finally {
    console.error = origError;
  }
});
