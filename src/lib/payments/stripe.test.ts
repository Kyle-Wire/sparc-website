import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBase, checkoutBody, formEncode, isTestKey, parseEvent, signPayload, signatureValid, stripe, STRIPE_VERSION } from "./stripe";

const SECRET = "whsec_test_not_real";
const NOW = 1_800_000_000;
const env = { STRIPE_SECRET_KEY: "sk_test_abc", STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_REPORT: "price_123" };
const ORDER = "3f6c1b8e-1d2a-4c9b-9e1f-0a1b2c3d4e5f";

/** A checkout.session.completed event, with the fields docs.stripe.com/api/checkout/sessions/object names. */
function completed(over: Record<string, unknown> = {}, ev: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "evt_1",
    type: "checkout.session.completed",
    livemode: false,
    ...ev,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: 14900,
        currency: "usd",
        payment_intent: "pi_1",
        client_reference_id: ORDER,
        metadata: { order_id: ORDER, user_id: "u-1", product: "home-report" },
        ...over,
      },
    },
  });
}
const header = (body: string, t = NOW, secret = SECRET) => `t=${t},v1=${signPayload(body, secret, t)}`;

test("a correctly signed body verifies; anything else does not", () => {
  const b = completed();
  assert.equal(signatureValid(b, header(b), SECRET, NOW), true);
  assert.equal(signatureValid(b + " ", header(b), SECRET, NOW), false, "body changed");
  assert.equal(signatureValid(b, header(b, NOW, "whsec_other"), SECRET, NOW), false, "wrong secret");
  assert.equal(signatureValid(b, null, SECRET, NOW), false, "no header");
  assert.equal(signatureValid(b, header(b), undefined, NOW), false, "no secret configured");
  assert.equal(signatureValid(b, `t=${NOW},v0=${signPayload(b, SECRET, NOW)}`, SECRET, NOW), false, "v0 is ignored");
});

test("any one of several v1 signatures may match (secret rotation)", () => {
  const b = completed();
  const h = `t=${NOW},v1=${"0".repeat(64)},v1=${signPayload(b, SECRET, NOW)}`;
  assert.equal(signatureValid(b, h, SECRET, NOW), true);
});

test("a signature older or newer than five minutes is refused (replay)", () => {
  const b = completed();
  assert.equal(signatureValid(b, header(b, NOW - 301), SECRET, NOW), false);
  assert.equal(signatureValid(b, header(b, NOW + 301), SECRET, NOW), false);
  assert.equal(signatureValid(b, header(b, NOW - 299), SECRET, NOW), true);
});

test("a paid session becomes order_paid with our order id and the PaymentIntent", () => {
  const e = parseEvent(completed())!;
  assert.equal(e.kind, "order_paid");
  assert.equal(e.orderId, ORDER);
  assert.equal(e.userId, "u-1");
  assert.equal(e.eventKey, "evt_1");
  assert.equal(e.providerOrderId, "pi_1");
  assert.equal(e.providerOrderNumber, "cs_test_1");
  assert.equal(e.amountCents, 14900);
  assert.equal(e.currency, "USD");
  assert.equal(e.testMode, true);
  assert.equal(e.productId, "home-report");
  assert.equal(parseEvent(completed({}, { livemode: true }))!.testMode, false);
});

test("an unpaid session (a delayed bank payment) is not paid until async_payment_succeeded", () => {
  assert.equal(parseEvent(completed({ payment_status: "unpaid" }))!.kind, "other");
  const later = completed({}, { id: "evt_2", type: "checkout.session.async_payment_succeeded" });
  assert.equal(parseEvent(later)!.kind, "order_paid");
});

test("a full refund is a refund; a partial one is left for a person", () => {
  const charge = (refunded: boolean) =>
    JSON.stringify({ id: "evt_r", type: "charge.refunded", livemode: false, data: { object: { id: "ch_1", object: "charge", payment_intent: "pi_1", amount_refunded: refunded ? 14900 : 5000, refunded, currency: "usd", metadata: {} } } });
  const full = parseEvent(charge(true))!;
  assert.equal(full.kind, "order_refunded");
  assert.equal(full.providerOrderId, "pi_1");
  assert.equal(full.orderId, null);
  assert.equal(parseEvent(charge(false))!.kind, "other");
});

test("other events and junk are not orders", () => {
  assert.equal(parseEvent(JSON.stringify({ id: "evt_x", type: "customer.created", data: { object: { id: "cus_1" } } }))!.kind, "other");
  assert.equal(parseEvent("not json"), null);
  assert.equal(parseEvent(JSON.stringify({ type: "x" })), null);
});

test("the adapter checks the signature before it parses", () => {
  const s = stripe(env);
  const b = completed();
  assert.equal(s.verifyAndParse(b, new Headers({ "stripe-signature": header(b) }), NOW)?.kind, "order_paid");
  assert.equal(s.verifyAndParse(b, new Headers({ "stripe-signature": `t=${NOW},v1=${"0".repeat(64)}` }), NOW), null);
  assert.equal(s.acceptsTestEvents(), true);
  assert.equal(stripe({ ...env, STRIPE_SECRET_KEY: "sk_live_abc" }).acceptsTestEvents(), false);
  assert.equal(isTestKey("rk_test_1"), true);
});

test("the Checkout Session asks for Managed Payments, or Stripe Tax when it is switched off", () => {
  const req = { orderId: ORDER, userId: "u-1", email: "b@example.com", successUrl: "https://s/ok", cancelUrl: "https://s/back" };
  const mp = checkoutBody(req, env);
  assert.deepEqual(mp.managed_payments, { enabled: true });
  assert.equal(mp.automatic_tax, undefined, "automatic_tax is not allowed with Managed Payments");
  assert.equal(mp.mode, "payment");
  assert.equal(mp.client_reference_id, ORDER);
  const tax = checkoutBody(req, { ...env, STRIPE_MANAGED_PAYMENTS: "false" });
  assert.deepEqual(tax.automatic_tax, { enabled: true });
  assert.equal(tax.managed_payments, undefined);
});

test("form encoding nests the way Stripe reads it", () => {
  const s = formEncode({ line_items: [{ price: "price_1", quantity: 1 }], managed_payments: { enabled: true }, metadata: { order_id: "a b" } }).join("&");
  assert.equal(s, "line_items%5B0%5D%5Bprice%5D=price_1&line_items%5B0%5D%5Bquantity%5D=1&managed_payments%5Benabled%5D=true&metadata%5Border_id%5D=a%20b");
});

test("the API base can point at a local stand-in only", () => {
  assert.equal(apiBase({}), "https://api.stripe.com");
  assert.equal(apiBase({ STRIPE_API_BASE: "http://127.0.0.1:4010" }), "http://127.0.0.1:4010");
  assert.equal(apiBase({ STRIPE_API_BASE: "https://evil.example" }), "https://api.stripe.com");
});

test("createCheckout posts the session with the API version and an idempotency key", async () => {
  const seen: { url?: string; body?: string; h?: Headers } = {};
  const orig = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen.url = url;
    seen.body = String(init.body);
    seen.h = new Headers(init.headers);
    return new Response(JSON.stringify({ id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" }), { status: 200 });
  }) as typeof fetch;
  try {
    const url = await stripe(env).createCheckout({ orderId: ORDER, userId: "u-1", email: "b@example.com", successUrl: "https://s/ok", cancelUrl: "https://s/back" });
    assert.equal(url, "https://checkout.stripe.com/c/pay/cs_1");
    assert.equal(seen.url, "https://api.stripe.com/v1/checkout/sessions");
    assert.equal(seen.h?.get("stripe-version"), STRIPE_VERSION);
    assert.equal(seen.h?.get("idempotency-key"), `checkout-${ORDER}`);
    assert.equal(seen.h?.get("authorization"), "Bearer sk_test_abc");
    assert.match(seen.body!, /managed_payments%5Benabled%5D=true/);
    assert.match(seen.body!, /line_items%5B0%5D%5Bprice%5D=price_123/);
  } finally {
    globalThis.fetch = orig;
  }
});
