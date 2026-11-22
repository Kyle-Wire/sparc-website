import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBase, lemonSqueezy, parseEvent, signBody, signatureValid, toCents } from "./lemonsqueezy";

const SECRET = "test-secret-not-real";
const env = {
  LEMONSQUEEZY_API_KEY: "k",
  LEMONSQUEEZY_STORE_ID: "1",
  LEMONSQUEEZY_WEBHOOK_SECRET: SECRET,
  LEMONSQUEEZY_VARIANT_REPORT: "777",
};

/** The order_created shape from docs.lemonsqueezy.com/help/webhooks/example-payloads, trimmed. */
function orderCreated(over: Record<string, unknown> = {}, custom: Record<string, unknown> | null = { order_id: "o-1", user_id: "u-1" }) {
  return JSON.stringify({
    meta: { event_name: "order_created", custom_data: custom },
    data: {
      type: "orders",
      id: "1",
      attributes: {
        identifier: "104e18a2-d755-4d4b-80c4-a6c1dcbe1c10",
        order_number: 1,
        user_email: "buyer@example.com",
        currency: "USD",
        total: 14900,
        status: "paid",
        test_mode: true,
        first_order_item: { variant_id: 777, product_id: 5 },
        urls: { receipt: "https://app.lemonsqueezy.com/my-orders/x" },
        ...over,
      },
    },
  });
}

test("a body signed with the secret verifies; anything else does not", () => {
  const body = orderCreated();
  const sig = signBody(body, SECRET);
  assert.equal(signatureValid(body, sig, SECRET), true);
  assert.equal(signatureValid(body + " ", sig, SECRET), false, "re-serialised body");
  assert.equal(signatureValid(body, sig, "other"), false, "wrong secret");
  assert.equal(signatureValid(body, null, SECRET), false, "no header");
  assert.equal(signatureValid(body, "abc", SECRET), false, "short header");
  assert.equal(signatureValid(body, sig, undefined), false, "no secret configured");
});

test("a paid order_created becomes order_paid with our order id", () => {
  const e = parseEvent(orderCreated())!;
  assert.equal(e.kind, "order_paid");
  assert.equal(e.orderId, "o-1");
  assert.equal(e.userId, "u-1");
  assert.equal(e.eventKey, "order_created:1");
  assert.equal(e.amountCents, 14900);
  assert.equal(e.currency, "USD");
  assert.equal(e.testMode, true);
  assert.equal(e.variantId, "777");
  assert.equal(e.receiptUrl, "https://app.lemonsqueezy.com/my-orders/x");
});

test("an order that is not yet paid is not treated as paid", () => {
  assert.equal(parseEvent(orderCreated({ status: "pending" }))!.kind, "other");
});

test("order_refunded is a refund of the same provider order", () => {
  const body = orderCreated({ status: "refunded", refunded: true }).replace("order_created", "order_refunded");
  const e = parseEvent(body)!;
  assert.equal(e.kind, "order_refunded");
  assert.equal(e.providerOrderId, "1");
  assert.equal(e.eventKey, "order_refunded:1");
});

test("subscription events and junk are not orders", () => {
  assert.equal(parseEvent(JSON.stringify({ meta: { event_name: "subscription_created" }, data: { type: "subscriptions", id: "9", attributes: {} } }))!.kind, "other");
  assert.equal(parseEvent("not json"), null);
  assert.equal(parseEvent(JSON.stringify({ meta: {} })), null);
});

test("an order with no custom data parses with no order id (the webhook records it for review)", () => {
  assert.equal(parseEvent(orderCreated({}, null))!.orderId, null);
});

test("money: integers are cents, decimals are dollars", () => {
  assert.equal(toCents(1199), 1199);
  assert.equal(toCents(18.59), 1859);
  assert.equal(toCents("12"), null);
});

test("the adapter checks the signature before it parses", () => {
  const ls = lemonSqueezy(env);
  const body = orderCreated();
  const ok = new Headers({ "x-signature": signBody(body, SECRET) });
  assert.equal(ls.verifyAndParse(body, ok)?.kind, "order_paid");
  assert.equal(ls.verifyAndParse(body, new Headers({ "x-signature": "0".repeat(64) })), null);
  assert.equal(ls.isReportVariant("777"), true);
  assert.equal(ls.isReportVariant("778"), false);
  assert.equal(ls.isReportVariant(null), false);
});

test("the API base can point at a local stand-in only", () => {
  assert.equal(apiBase({}), "https://api.lemonsqueezy.com");
  assert.equal(apiBase({ LEMONSQUEEZY_API_BASE: "http://127.0.0.1:4010" }), "http://127.0.0.1:4010");
  assert.equal(apiBase({ LEMONSQUEEZY_API_BASE: "https://evil.example" }), "https://api.lemonsqueezy.com");
  assert.equal(apiBase({ LEMONSQUEEZY_API_BASE: "http://127.0.0.1.evil.example" }), "https://api.lemonsqueezy.com");
});

test("createCheckout sends our order id as custom data and returns the checkout URL", async () => {
  const seen: { url?: string; body?: unknown; auth?: string | null } = {};
  const orig = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen.url = url;
    seen.body = JSON.parse(String(init.body));
    seen.auth = new Headers(init.headers).get("authorization");
    return new Response(JSON.stringify({ data: { attributes: { url: "https://store.lemonsqueezy.com/checkout/abc" } } }), { status: 201 });
  }) as typeof fetch;
  try {
    const url = await lemonSqueezy({ ...env, LEMONSQUEEZY_TEST_MODE: "true" }).createCheckout({
      orderId: "o-1",
      userId: "u-1",
      email: "buyer@example.com",
      successUrl: "https://sparclabs.co/account/reports?paid=o-1",
    });
    assert.equal(url, "https://store.lemonsqueezy.com/checkout/abc");
    assert.equal(seen.url, "https://api.lemonsqueezy.com/v1/checkouts");
    assert.equal(seen.auth, "Bearer k");
    type Sent = {
      data: {
        attributes: { checkout_data: { custom: unknown }; test_mode: boolean };
        relationships: { variant: { data: { id: string } }; store: { data: { id: string } } };
      };
    };
    const a = (seen.body as Sent).data;
    assert.deepEqual(a.attributes.checkout_data.custom, { order_id: "o-1", user_id: "u-1" });
    assert.equal(a.attributes.test_mode, true);
    assert.equal(a.relationships.variant.data.id, "777");
    assert.equal(a.relationships.store.data.id, "1");
  } finally {
    globalThis.fetch = orig;
  }
});
