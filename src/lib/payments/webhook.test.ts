import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, type ApplyFn } from "./webhook";
import { stripe } from "./stripe";
import type { PaymentEvent } from "./provider";

const testKeys = stripe({ STRIPE_SECRET_KEY: "sk_test_x" });
const liveKeys = stripe({ STRIPE_SECRET_KEY: "sk_live_x" });
const ORDER = "3f6c1b8e-1d2a-4c9b-9e1f-0a1b2c3d4e5f";
const base: PaymentEvent = {
  kind: "order_paid",
  eventKey: "evt_1",
  eventName: "payment_intent.succeeded",
  orderId: ORDER,
  userId: "u",
  providerOrderId: "pi_1",
  providerOrderNumber: "cs_1",
  amountCents: 15790,
  currency: "USD",
  testMode: true,
  receiptUrl: null,
  productId: "home-report",
};

function spy(result: string | Error) {
  const calls: unknown[] = [];
  const fn: ApplyFn = async (a) => {
    calls.push(a);
    if (result instanceof Error) throw result;
    return result;
  };
  return { fn, calls };
}

test("a paid report is applied and the buyer is told it is ready", async () => {
  const s = spy("delivered");
  assert.deepEqual(await decide(base, testKeys, s.fn), { status: 200, outcome: "delivered", notify: "delivered" });
  assert.equal(s.calls.length, 1);
});

const saved: PaymentEvent = { ...base, kind: "card_saved", eventName: "checkout.session.completed", providerOrderId: "", amountCents: null, customerId: "cus_1", setupId: "seti_1" };

test("a saved card puts the order in and tells the buyer nothing was charged", async () => {
  const s = spy("card_saved");
  assert.deepEqual(await decide(saved, testKeys, s.fn), { status: 200, outcome: "card_saved", notify: "card_saved" });
  assert.equal((await decide({ ...saved, setupId: null }, testKeys, spy("card_saved").fn)).outcome, "no_saved_card");
});

test("a failed charge asks the buyer to pay; a further failure tells nobody", async () => {
  const f: PaymentEvent = { ...base, kind: "charge_failed", eventName: "payment_intent.payment_failed", error: "Declined." };
  assert.deepEqual(await decide(f, testKeys, spy("charge_failed").fn), { status: 200, outcome: "charge_failed", notify: "payment_failed" });
  assert.deepEqual(await decide(f, testKeys, spy("noted").fn), { status: 200, outcome: "noted" });
});

test("a resend is answered 200 and nobody is told twice", async () => {
  assert.deepEqual(await decide(base, testKeys, spy("duplicate").fn), { status: 200, outcome: "duplicate" });
});

test("a database failure is a 500, so Stripe retries", async () => {
  const orig = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await decide(base, testKeys, spy(new Error("down")).fn), { status: 500, outcome: "apply_failed" });
  } finally {
    console.error = orig;
  }
});

test("a test purchase is refused once the keys are live; a live one is applied", async () => {
  const s = spy("delivered");
  assert.equal((await decide(base, liveKeys, s.fn)).outcome, "test_event_in_live_mode");
  assert.equal((await decide(saved, liveKeys, s.fn)).outcome, "test_event_in_live_mode");
  assert.equal(s.calls.length, 0);
  assert.equal((await decide({ ...base, testMode: false }, liveKeys, s.fn)).outcome, "delivered");
});

test("another product, a missing or malformed order id, no payment id, and other events are not applied", async () => {
  const s = spy("delivered");
  assert.equal((await decide({ ...base, productId: "other" }, testKeys, s.fn)).outcome, "other_product");
  assert.equal((await decide({ ...base, orderId: null }, testKeys, s.fn)).outcome, "no_order_id");
  assert.equal((await decide({ ...base, orderId: "x'; drop" }, testKeys, s.fn)).outcome, "bad_order_id");
  assert.equal((await decide({ ...base, providerOrderId: "" }, testKeys, s.fn)).outcome, "no_payment_id");
  assert.equal((await decide({ ...base, kind: "other" }, testKeys, s.fn)).outcome, "ignored");
  assert.equal(s.calls.length, 0);
});

test("a refund with no order id still goes to the database, which matches the payment", async () => {
  const s = spy("refunded");
  const d = await decide({ ...base, kind: "order_refunded", eventName: "charge.refunded", orderId: null, productId: null }, testKeys, s.fn);
  assert.deepEqual(d, { status: 200, outcome: "refunded", notify: "refunded" });
  assert.equal(s.calls.length, 1);
});
