import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBase, formEncode, isTestKey, parseEvent, payLinkBody, setupSessionBody, signPayload, signatureValid, stripe, STRIPE_VERSION } from "./stripe";

const SECRET = "whsec_test_not_real";
const NOW = 1_800_000_000;
const env = { STRIPE_SECRET_KEY: "sk_test_abc", STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_REPORT: "price_123" };
const ORDER = "3f6c1b8e-1d2a-4c9b-9e1f-0a1b2c3d4e5f";

/** A checkout.session.completed event for the setup session that saves the card at order. */
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
        mode: "setup",
        status: "complete",
        currency: "usd",
        customer: "cus_1",
        setup_intent: "seti_1",
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

test("a finished setup session is card_saved, with the customer and the setup", () => {
  const e = parseEvent(completed())!;
  assert.equal(e.kind, "card_saved");
  assert.equal(e.orderId, ORDER);
  assert.equal(e.userId, "u-1");
  assert.equal(e.eventKey, "evt_1");
  assert.equal(e.customerId, "cus_1");
  assert.equal(e.setupId, "seti_1");
  assert.equal(e.providerOrderNumber, "cs_test_1");
  assert.equal(e.amountCents, null, "nothing is charged at order");
  assert.equal(e.testMode, true);
  assert.equal(e.productId, "home-report");
  assert.equal(parseEvent(completed({}, { livemode: true }))!.testMode, false);
  assert.equal(parseEvent(completed({ setup_intent: { id: "seti_x" } }))!.setupId, "seti_x", "expanded ids are read too");
});

test("an unfinished setup session, or a paid pay-link session, is not acted on here", () => {
  assert.equal(parseEvent(completed({ status: "open" }))!.kind, "other");
  assert.equal(parseEvent(completed({ mode: "payment", payment_status: "paid" }))!.kind, "other");
});

function intent(type: string, over: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "evt_pi",
    type,
    livemode: false,
    data: { object: { id: "pi_1", object: "payment_intent", amount: 15790, amount_received: type.endsWith("succeeded") ? 15790 : 0, currency: "usd", latest_charge: "ch_1", metadata: { order_id: ORDER, user_id: "u-1", product: "home-report" }, ...over } },
  });
}

test("a succeeded PaymentIntent is order_paid; a failed one is charge_failed with the bank's reason", () => {
  const ok = parseEvent(intent("payment_intent.succeeded"))!;
  assert.equal(ok.kind, "order_paid");
  assert.equal(ok.orderId, ORDER);
  assert.equal(ok.providerOrderId, "pi_1");
  assert.equal(ok.providerOrderNumber, "ch_1");
  assert.equal(ok.amountCents, 15790);
  assert.equal(ok.currency, "USD");
  const bad = parseEvent(intent("payment_intent.payment_failed", { last_payment_error: { message: "Your card has insufficient funds." } }))!;
  assert.equal(bad.kind, "charge_failed");
  assert.equal(bad.error, "Your card has insufficient funds.");
  assert.equal(bad.amountCents, 15790);
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
  assert.equal(s.verifyAndParse(b, new Headers({ "stripe-signature": header(b) }), NOW)?.kind, "card_saved");
  assert.equal(s.verifyAndParse(b, new Headers({ "stripe-signature": `t=${NOW},v1=${"0".repeat(64)}` }), NOW), null);
  assert.equal(s.acceptsTestEvents(), true);
  assert.equal(stripe({ ...env, STRIPE_SECRET_KEY: "sk_live_abc" }).acceptsTestEvents(), false);
  assert.equal(isTestKey("rk_test_1"), true);
});

test("the order's Checkout saves a card and charges nothing; the pay link charges with Stripe Tax", () => {
  const req = { orderId: ORDER, userId: "u-1", email: "b@example.com", successUrl: "https://s/ok", cancelUrl: "https://s/back" };
  const setup = setupSessionBody(req, "cus_1");
  assert.equal(setup.mode, "setup");
  assert.equal(setup.currency, "usd", "setup mode needs a currency");
  assert.equal(setup.customer, "cus_1");
  assert.equal(setup.client_reference_id, ORDER);
  assert.equal(setup.billing_address_collection, "required");
  assert.deepEqual(setup.payment_method_types, ["card"], "only a card can be charged off-session at once");
  assert.equal((setup.setup_intent_data as { metadata: Record<string, string> }).metadata.order_id, ORDER);
  const msg = (setup.custom_text as { submit: { message: string } }).submit.message;
  assert.match(msg, /Nothing is charged today/);
  assert.match(msg, /\$149 plus any sales tax/);
  assert.ok(msg.length <= 1200, "Stripe caps custom text at 1,200 characters");
  assert.equal(setup.line_items, undefined);
  assert.equal(setup.managed_payments, undefined);
  const pay = payLinkBody({ orderId: ORDER, userId: "u-1", customerId: "cus_1", attempt: 1, successUrl: "https://s/ok", cancelUrl: "https://s/back" }, env);
  assert.equal(pay.mode, "payment");
  assert.deepEqual(pay.automatic_tax, { enabled: true });
  assert.deepEqual(pay.line_items, [{ price: "price_123", quantity: 1 }]);
  assert.equal((pay.payment_intent_data as { metadata: Record<string, string> }).metadata.order_id, ORDER, "the payment names the order");
});

test("form encoding nests the way Stripe reads it", () => {
  const s = formEncode({ line_items: [{ price: "price_1", quantity: 1 }], hooks: { inputs: { tax: { calculation: "taxcalc_1" } } }, metadata: { order_id: "a b" } }).join("&");
  assert.equal(s, "line_items%5B0%5D%5Bprice%5D=price_1&line_items%5B0%5D%5Bquantity%5D=1&hooks%5Binputs%5D%5Btax%5D%5Bcalculation%5D=taxcalc_1&metadata%5Border_id%5D=a%20b");
});

test("the API base can point at a local stand-in only", () => {
  assert.equal(apiBase({}), "https://api.stripe.com");
  assert.equal(apiBase({ STRIPE_API_BASE: "http://127.0.0.1:4010" }), "http://127.0.0.1:4010");
  assert.equal(apiBase({ STRIPE_API_BASE: "https://evil.example" }), "https://api.stripe.com");
});

/** A fake Stripe API: answers by path and records every call. */
function fakeStripe(answers: Record<string, (body: URLSearchParams) => [number, unknown]>) {
  const calls: { method: string; path: string; body: URLSearchParams; h: Headers }[] = [];
  const orig = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const u = new URL(url);
    const body = new URLSearchParams(init.method === "GET" ? u.search : String(init.body ?? ""));
    calls.push({ method: String(init.method), path: u.pathname, body, h: new Headers(init.headers) });
    const key = Object.keys(answers).find((k) => u.pathname.startsWith(k));
    const [status, json] = key ? answers[key](body) : [404, { error: { message: "no route" } }];
    return new Response(JSON.stringify(json), { status });
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = orig) };
}

test("createCheckout makes a customer, then a setup session, each with an idempotency key", async () => {
  const f = fakeStripe({
    "/v1/customers": () => [200, { id: "cus_9" }],
    "/v1/checkout/sessions": () => [200, { id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" }],
  });
  try {
    const url = await stripe(env).createCheckout({ orderId: ORDER, userId: "u-1", email: "b@example.com", successUrl: "https://s/ok", cancelUrl: "https://s/back" });
    assert.equal(url, "https://checkout.stripe.com/c/pay/cs_1");
    assert.deepEqual(f.calls.map((c) => c.path), ["/v1/customers", "/v1/checkout/sessions"]);
    assert.equal(f.calls[0].h.get("idempotency-key"), `customer-${ORDER}`);
    assert.equal(f.calls[1].h.get("idempotency-key"), `setup-${ORDER}`);
    assert.equal(f.calls[1].h.get("stripe-version"), STRIPE_VERSION);
    assert.equal(f.calls[1].h.get("authorization"), "Bearer sk_test_abc");
    assert.equal(f.calls[1].body.get("mode"), "setup");
    assert.equal(f.calls[1].body.get("customer"), "cus_9");
  } finally {
    f.restore();
  }
});

const chargeReq = { orderId: ORDER, userId: "u-1", customerId: "cus_1", setupId: "seti_1", attempt: 0 };
const happy = (pi: (b: URLSearchParams) => [number, unknown]) => ({
  "/v1/prices/": () => [200, { unit_amount: 14900, currency: "usd", product: { tax_code: "txcd_10000000" } }] as [number, unknown],
  "/v1/setup_intents/": () => [200, { status: "succeeded", payment_method: "pm_1" }] as [number, unknown],
  "/v1/payment_methods/": () => [200, { billing_details: { address: { line1: "1 Main", city: "Philadelphia", state: "PA", postal_code: "19147", country: "US" } } }] as [number, unknown],
  "/v1/tax/calculations": () => [200, { id: "taxcalc_1", amount_total: 15790, tax_amount_exclusive: 890 }] as [number, unknown],
  "/v1/payment_intents": pi,
});

test("chargeSavedCard adds tax from the billing address and charges the saved card off-session, once", async () => {
  const f = fakeStripe(happy(() => [200, { id: "pi_1", status: "succeeded", amount: 15790, currency: "usd", latest_charge: { receipt_url: "https://r/1" } }]));
  try {
    const r = await stripe(env).chargeSavedCard(chargeReq);
    assert.deepEqual(r, { ok: true, paymentId: "pi_1", amountCents: 15790, taxCents: 890, currency: "USD", receiptUrl: "https://r/1", testMode: true });
    const tax = f.calls.find((c) => c.path === "/v1/tax/calculations")!.body;
    assert.equal(tax.get("line_items[0][amount]"), "14900");
    assert.equal(tax.get("line_items[0][tax_code]"), "txcd_10000000");
    assert.equal(tax.get("line_items[0][tax_behavior]"), "exclusive");
    assert.equal(tax.get("customer_details[address][postal_code]"), "19147");
    assert.equal(tax.get("customer_details[address_source]"), "billing");
    const pi = f.calls.find((c) => c.path === "/v1/payment_intents")!;
    assert.equal(pi.body.get("amount"), "15790");
    assert.equal(pi.body.get("off_session"), "true");
    assert.equal(pi.body.get("confirm"), "true");
    assert.equal(pi.body.get("payment_method"), "pm_1");
    assert.equal(pi.body.get("customer"), "cus_1");
    assert.equal(pi.body.get("hooks[inputs][tax][calculation]"), "taxcalc_1");
    assert.equal(pi.body.get("metadata[order_id]"), ORDER);
    assert.equal(pi.h.get("idempotency-key"), `charge-${ORDER}-0`);
  } finally {
    f.restore();
  }
});

test("a decline is a result with the bank's words, not an exception", async () => {
  const f = fakeStripe(happy(() => [402, { error: { type: "card_error", code: "card_declined", decline_code: "insufficient_funds", message: "Your card has insufficient funds.", payment_intent: { id: "pi_2", status: "requires_payment_method" } } }]));
  try {
    const r = await stripe(env).chargeSavedCard(chargeReq);
    assert.deepEqual(r, { ok: false, paymentId: "pi_2", code: "insufficient_funds", error: "Your card has insufficient funds.", testMode: true });
  } finally {
    f.restore();
  }
});

test("a bank asking the buyer to confirm is a failure the buyer fixes from their account", async () => {
  const f = fakeStripe(happy(() => [402, { error: { code: "authentication_required", message: "This payment requires authentication.", payment_intent: { id: "pi_3" } } }]));
  try {
    const r = await stripe(env).chargeSavedCard(chargeReq);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.error, "Your bank asked you to confirm this payment yourself.");
  } finally {
    f.restore();
  }
});

test("nothing is charged when Stripe's price differs from the price shown, or the card has no billing address", async () => {
  const wrong = fakeStripe({ ...happy(() => [200, {}]), "/v1/prices/": () => [200, { unit_amount: 19900, currency: "usd" }] });
  try {
    await assert.rejects(stripe(env).chargeSavedCard(chargeReq), /catalogue says 14900/);
    assert.equal(wrong.calls.some((c) => c.path === "/v1/payment_intents"), false);
  } finally {
    wrong.restore();
  }
  const noAddr = fakeStripe({ ...happy(() => [200, {}]), "/v1/payment_methods/": () => [200, { billing_details: { address: { country: "US" } } }] });
  try {
    const r = await stripe(env).chargeSavedCard(chargeReq);
    assert.equal(!r.ok && r.code, "no_billing_address");
    assert.equal(noAddr.calls.some((c) => c.path === "/v1/payment_intents"), false);
  } finally {
    noAddr.restore();
  }
});

test("forgetCard detaches the card that the setup saved", async () => {
  const f = fakeStripe({ "/v1/setup_intents/": () => [200, { payment_method: "pm_7" }], "/v1/payment_methods/pm_7/detach": () => [200, { id: "pm_7" }] });
  try {
    await stripe(env).forgetCard("seti_1");
    assert.equal(f.calls[1].path, "/v1/payment_methods/pm_7/detach");
    assert.equal(f.calls[1].method, "POST");
  } finally {
    f.restore();
  }
});
