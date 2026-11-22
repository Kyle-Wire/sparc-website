import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, type ApplyFn } from "./webhook";
import { lemonSqueezy } from "./lemonsqueezy";
import type { PaymentEvent } from "./provider";

const provider = lemonSqueezy({ LEMONSQUEEZY_VARIANT_REPORT: "777" });
const ORDER = "3f6c1b8e-1d2a-4c9b-9e1f-0a1b2c3d4e5f";
const base: PaymentEvent = {
  kind: "order_paid",
  eventKey: "order_created:1",
  eventName: "order_created",
  orderId: ORDER,
  userId: "u",
  providerOrderId: "1",
  providerOrderNumber: "1",
  amountCents: 14900,
  currency: "USD",
  testMode: true,
  receiptUrl: null,
  variantId: "777",
};
const TEST = { LEMONSQUEEZY_TEST_MODE: "true" };

function spy(result: string | Error) {
  const calls: unknown[] = [];
  const fn: ApplyFn = async (a) => {
    calls.push(a);
    if (result instanceof Error) throw result;
    return result;
  };
  return { fn, calls };
}

test("a paid report order is applied and the buyer is told", async () => {
  const s = spy("paid");
  assert.deepEqual(await decide(base, provider, s.fn, TEST), { status: 200, outcome: "paid", notify: "paid" });
  assert.equal(s.calls.length, 1);
});

test("a resend is answered 200 and nobody is told twice", async () => {
  const s = spy("duplicate");
  assert.deepEqual(await decide(base, provider, s.fn, TEST), { status: 200, outcome: "duplicate" });
});

test("a database failure is a 500, so the provider retries", async () => {
  const s = spy(new Error("down"));
  const orig = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await decide(base, provider, s.fn, TEST), { status: 500, outcome: "apply_failed" });
  } finally {
    console.error = orig;
  }
});

test("a test purchase is refused once the store is live", async () => {
  const s = spy("paid");
  assert.equal((await decide(base, provider, s.fn, {})).outcome, "test_event_in_live_mode");
  assert.equal(s.calls.length, 0);
  assert.equal((await decide({ ...base, testMode: false }, provider, s.fn, {})).outcome, "paid");
});

test("another product, a missing or malformed order id, and other events are not applied", async () => {
  const s = spy("paid");
  assert.equal((await decide({ ...base, variantId: "1" }, provider, s.fn, TEST)).outcome, "other_product");
  assert.equal((await decide({ ...base, orderId: null }, provider, s.fn, TEST)).outcome, "no_order_id");
  assert.equal((await decide({ ...base, orderId: "x'; drop" }, provider, s.fn, TEST)).outcome, "bad_order_id");
  assert.equal((await decide({ ...base, kind: "other" }, provider, s.fn, TEST)).outcome, "ignored");
  assert.equal(s.calls.length, 0);
});

test("a refund is applied whatever variant it names", async () => {
  const s = spy("refunded");
  const d = await decide({ ...base, kind: "order_refunded", eventKey: "order_refunded:1", variantId: null }, provider, s.fn, TEST);
  assert.deepEqual(d, { status: 200, outcome: "refunded", notify: "refunded" });
});
