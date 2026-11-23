/**
 * The Stripe adapter for the house report. The buyer is charged when the
 * report is ready (Kyle, 22 November 2026):
 *
 *   1. At order, a Checkout Session in setup mode saves the buyer's card to a
 *      Customer made for the order. Nothing is charged.
 *   2. When a person delivers the report, chargeSavedCard() works out sales
 *      tax with Stripe Tax and charges the saved card off-session.
 *   3. If that fails, createPayLink() makes a normal Checkout page (with Stripe
 *      Tax) for the buyer to pay from their account. The report unlocks on
 *      payment_intent.succeeded either way.
 *
 * SPARC Labs is the seller of record: Stripe Managed Payments refuses products
 * with "human intervention" and takes only payment or subscription sessions.
 *
 * Sources, opened 22 November 2026:
 *   - Save a card in Checkout (docs.stripe.com/payments/checkout/save-and-reuse,
 *     Stripe-hosted): mode=setup "requires you to pass the currency
 *     parameter"; `customer` attaches the card to an existing Customer;
 *     checkout.session.completed carries `setup_intent`, whose retrieved object
 *     has the `payment_method`; the later charge is a PaymentIntent with
 *     customer, payment_method, off_session=true, confirm=true, and "When a
 *     payment attempt fails, the request also fails with a 402 HTTP status code
 *     and the status of the PaymentIntent is requires_payment_method".
 *   - Stripe Tax for a PaymentIntent (docs.stripe.com/tax/custom,
 *     …/tax/payment-intent/simplified): POST /v1/tax/calculations with currency,
 *     line_items[][amount|reference|tax_code|tax_behavior] and
 *     customer_details[address] + [address_source]; then "Set
 *     hooks.inputs.tax.calculation to the Tax Calculation ID and amount to
 *     tax_calculation.amount_total", and Stripe "Creates a tax transaction from
 *     the calculation after the PaymentIntent transitions to a succeeded state".
 *     For the US, "We require your customer's postal code at a minimum".
 *   - Errors (docs.stripe.com/error-codes): a card decline carries decline_code;
 *     authentication_required means the buyer must come back and pay.
 *   - Signatures (docs.stripe.com/webhooks#verify-manually): header
 *     "t=<unix seconds>,v1=<hex>[,v1=…]"; HMAC-SHA256 over "<t>.<raw body>"
 *     with the endpoint secret; any v1 may match; default tolerance 300 s; v0
 *     is ignored.
 *   - Refunds (docs.stripe.com/api/events/types, …/api/charges/object):
 *     charge.refunded fires on full and partial refunds; the charge carries
 *     payment_intent, amount_refunded and refunded (true only when full).
 *
 * Plain fetch, no SDK, so a test can point it at a local stand-in
 * (STRIPE_API_BASE, honoured for localhost only).
 */

import crypto from "node:crypto";
import type { ChargeRequest, ChargeResult, CheckoutRequest, PayLinkRequest, PaymentEvent, PaymentProvider } from "./provider";
import { REPORT } from "./catalog";

const API = "https://api.stripe.com";
export const STRIPE_VERSION = "2026-04-22.dahlia";
const TOLERANCE_S = 300;

export interface StripeEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** The house report's Price id (price_…). Its amount must equal the catalogue's. */
  STRIPE_PRICE_REPORT?: string;
  /** Local stand-in for tests only. Ignored unless it is a localhost URL. */
  STRIPE_API_BASE?: string;
}

export function apiBase(env: StripeEnv): string {
  const b = env.STRIPE_API_BASE;
  if (b && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(b)) return b;
  return API;
}

/** Test keys start sk_test_ or rk_test_. */
export const isTestKey = (key: string | undefined) => Boolean(key && /^(sk|rk)_test_/.test(key));

/** Stripe's form encoding: nested keys as a[b][0]=c. */
export function formEncode(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => out.push(...(typeof item === "object" ? formEncode(item as Record<string, unknown>, `${key}[${i}]`) : [`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`])));
    else if (typeof v === "object") out.push(...formEncode(v as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export function signPayload(rawBody: string, secret: string, t: number): string {
  return crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
}

export function signatureValid(rawBody: string, header: string | null, secret: string | undefined, nowSeconds: number): boolean {
  if (!secret || !header) return false;
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t" && /^\d+$/.test(v)) t = Number(v);
    if (k === "v1" && /^[0-9a-f]{64}$/i.test(v)) v1.push(v.toLowerCase());
  }
  if (t === null || !v1.length) return false;
  if (Math.abs(nowSeconds - t) > TOLERANCE_S) return false;
  const want = Buffer.from(signPayload(rawBody, secret, t), "hex");
  return v1.some((s) => {
    const got = Buffer.from(s, "hex");
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  });
}

const str = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));
/** An id that may come expanded ({id: …}) or as a bare string. */
const idOf = (v: unknown): string | null => (v && typeof v === "object" ? str((v as { id?: unknown }).id) : str(v));

interface StripeEvent {
  id?: string;
  type?: string;
  livemode?: boolean;
  data?: { object?: Record<string, unknown> };
}

export function parseEvent(rawBody: string): PaymentEvent | null {
  let e: StripeEvent;
  try {
    e = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const o = e.data?.object;
  if (!e.id || !e.type || !o) return null;
  const meta = (o.metadata ?? {}) as Record<string, unknown>;
  const base = {
    eventKey: e.id,
    eventName: e.type,
    testMode: e.livemode !== true,
    receiptUrl: null,
    userId: str(meta.user_id),
    productId: str(meta.product),
  };
  const none = { kind: "other" as const, orderId: null, providerOrderId: str(o.id) ?? "", providerOrderNumber: null, amountCents: null, currency: null };

  if (e.type === "checkout.session.completed") {
    // Only the setup session (the card saved at order) matters here. A paid
    // session from a pay link is acted on through its payment_intent.succeeded.
    if (o.mode !== "setup" || o.status !== "complete") return { ...base, ...none };
    return {
      ...base,
      kind: "card_saved",
      orderId: str(o.client_reference_id) ?? str(meta.order_id),
      providerOrderId: "",
      providerOrderNumber: str(o.id),
      amountCents: null,
      currency: str(o.currency)?.toUpperCase() ?? null,
      customerId: idOf(o.customer),
      setupId: idOf(o.setup_intent),
    };
  }
  if (e.type === "payment_intent.succeeded" || e.type === "payment_intent.payment_failed") {
    const ok = e.type === "payment_intent.succeeded";
    const err = (o.last_payment_error ?? null) as { message?: unknown } | null;
    return {
      ...base,
      kind: ok ? "order_paid" : "charge_failed",
      orderId: str(meta.order_id),
      providerOrderId: str(o.id) ?? "",
      providerOrderNumber: idOf(o.latest_charge),
      amountCents: typeof o.amount_received === "number" && o.amount_received > 0 ? o.amount_received : typeof o.amount === "number" ? o.amount : null,
      currency: str(o.currency)?.toUpperCase() ?? null,
      error: ok ? null : str(err?.message) ?? "The card was declined.",
    };
  }
  if (e.type === "charge.refunded") {
    // Only a full refund closes the order. A partial one is left for a person.
    return {
      ...base,
      kind: o.refunded === true ? "order_refunded" : "other",
      orderId: str(meta.order_id),
      userId: null,
      productId: null,
      providerOrderId: str(o.payment_intent) ?? "",
      providerOrderNumber: str(o.id),
      amountCents: typeof o.amount_refunded === "number" ? o.amount_refunded : null,
      currency: str(o.currency)?.toUpperCase() ?? null,
      receiptUrl: str(o.receipt_url),
    };
  }
  return { ...base, ...none };
}

const tags = (orderId: string, userId: string, extra: Record<string, string> = {}) => ({ order_id: orderId, user_id: userId, product: REPORT.id, ...extra });

/** The Checkout Session that saves the card at order. Exported for the test. */
export function setupSessionBody(req: CheckoutRequest, customerId: string): Record<string, unknown> {
  return {
    mode: "setup",
    currency: REPORT.currency.toLowerCase(),
    customer: customerId,
    client_reference_id: req.orderId,
    metadata: tags(req.orderId, req.userId),
    // Sales tax is worked out from the billing address when we charge.
    billing_address_collection: "required",
    success_url: req.successUrl,
    cancel_url: req.cancelUrl,
  };
}

/** The Checkout Session a buyer pays from after a failed charge. Exported for the test. */
export function payLinkBody(req: PayLinkRequest, env: StripeEnv): Record<string, unknown> {
  const t = tags(req.orderId, req.userId, { attempt: `link-${req.attempt}` });
  return {
    mode: "payment",
    customer: req.customerId,
    line_items: [{ price: env.STRIPE_PRICE_REPORT, quantity: 1 }],
    client_reference_id: req.orderId,
    metadata: t,
    payment_intent_data: { metadata: t },
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
    billing_address_collection: "required",
    success_url: req.successUrl,
    cancel_url: req.cancelUrl,
  };
}

interface StripeError {
  error?: { message?: string; code?: string; decline_code?: string; payment_intent?: { id?: string; status?: string } };
}

export function stripe(env: StripeEnv): PaymentProvider {
  const testMode = isTestKey(env.STRIPE_SECRET_KEY);

  async function call<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>, idempotencyKey?: string): Promise<{ status: number; json: T & StripeError }> {
    if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured (secret key).");
    const qs = method === "GET" && body ? `?${formEncode(body).join("&")}` : "";
    const res = await fetch(`${apiBase(env)}${path}${qs}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Stripe-Version": STRIPE_VERSION,
        ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: method === "POST" && body ? formEncode(body).join("&") : undefined,
    });
    const json = ((await res.json().catch(() => ({}))) ?? {}) as T & StripeError;
    return { status: res.status, json };
  }
  async function must<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>, key?: string): Promise<T> {
    const r = await call<T>(method, path, body, key);
    if (r.status >= 400) throw new Error(`Stripe ${method} ${path} failed: HTTP ${r.status} ${r.json.error?.message ?? ""}`.trim());
    return r.json;
  }

  return {
    id: "stripe",
    configured: () => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_REPORT),

    async createCheckout(req) {
      // A Customer per order: test-mode and live customers never mix, and the
      // card is attached where the deliver step looks for it.
      const customer = await must<{ id: string }>("POST", "/v1/customers", { email: req.email, metadata: tags(req.orderId, req.userId) }, `customer-${req.orderId}`);
      const s = await must<{ url?: string }>("POST", "/v1/checkout/sessions", setupSessionBody(req, customer.id), `setup-${req.orderId}`);
      if (!s.url) throw new Error("Stripe returned no checkout URL.");
      return s.url;
    },

    async createPayLink(req) {
      if (!env.STRIPE_PRICE_REPORT) throw new Error("Stripe is not configured (report price).");
      const s = await must<{ url?: string }>("POST", "/v1/checkout/sessions", payLinkBody(req, env));
      if (!s.url) throw new Error("Stripe returned no checkout URL.");
      return s.url;
    },

    async chargeSavedCard(req: ChargeRequest): Promise<ChargeResult> {
      if (!env.STRIPE_PRICE_REPORT) throw new Error("Stripe is not configured (report price).");
      // The price as Stripe holds it must be the price the buyer was shown.
      const price = await must<{ unit_amount?: number; currency?: string; product?: { tax_code?: string | { id?: string } | null } }>(
        "GET", `/v1/prices/${encodeURIComponent(env.STRIPE_PRICE_REPORT)}`, { expand: ["product"] });
      if (price.unit_amount !== REPORT.priceCents || price.currency?.toUpperCase() !== REPORT.currency) {
        throw new Error(`STRIPE_PRICE_REPORT is ${price.unit_amount} ${price.currency}; the catalogue says ${REPORT.priceCents} ${REPORT.currency}. Fix one before charging.`);
      }
      const setup = await must<{ payment_method?: unknown; status?: string }>("GET", `/v1/setup_intents/${encodeURIComponent(req.setupId)}`);
      const pm = idOf(setup.payment_method);
      if (!pm || setup.status !== "succeeded") {
        return { ok: false, paymentId: null, code: "no_saved_card", error: "We could not find the card saved with this order.", testMode };
      }
      const card = await must<{ billing_details?: { address?: Record<string, string | null> } }>("GET", `/v1/payment_methods/${encodeURIComponent(pm)}`);
      const addr = card.billing_details?.address ?? {};
      if (!addr.postal_code || !addr.country) {
        return { ok: false, paymentId: null, code: "no_billing_address", error: "The card saved with this order has no billing address, which we need to work out sales tax.", testMode };
      }

      const calc = await must<{ id: string; amount_total: number; tax_amount_exclusive?: number }>("POST", "/v1/tax/calculations", {
        currency: REPORT.currency.toLowerCase(),
        line_items: [{ amount: REPORT.priceCents, reference: REPORT.id, tax_behavior: "exclusive", tax_code: idOf(price.product?.tax_code) ?? undefined }],
        customer_details: {
          address: { line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postal_code: addr.postal_code, country: addr.country },
          address_source: "billing",
        },
      });

      const r = await call<{ id?: string; status?: string; amount?: number; currency?: string; latest_charge?: { receipt_url?: string } | string }>(
        "POST",
        "/v1/payment_intents",
        {
          amount: calc.amount_total,
          currency: REPORT.currency.toLowerCase(),
          customer: req.customerId,
          payment_method: pm,
          off_session: true,
          confirm: true,
          description: REPORT.name,
          metadata: tags(req.orderId, req.userId, { attempt: String(req.attempt) }),
          hooks: { inputs: { tax: { calculation: calc.id } } },
          expand: ["latest_charge"],
        },
        // The same order and try never charges twice, however often the script is rerun.
        `charge-${req.orderId}-${req.attempt}`,
      );
      if (r.status < 400 && r.json.status === "succeeded" && r.json.id) {
        const ch = r.json.latest_charge;
        return {
          ok: true,
          paymentId: r.json.id,
          amountCents: r.json.amount ?? calc.amount_total,
          taxCents: calc.tax_amount_exclusive ?? calc.amount_total - REPORT.priceCents,
          currency: (r.json.currency ?? REPORT.currency).toUpperCase(),
          receiptUrl: ch && typeof ch === "object" ? ch.receipt_url ?? null : null,
          testMode,
        };
      }
      if (r.status === 402 || r.status < 400) {
        const e = r.json.error;
        const code = e?.decline_code ?? e?.code ?? r.json.status ?? null;
        const error = code === "authentication_required" || r.json.status === "requires_action"
          ? "Your bank asked you to confirm this payment yourself."
          : e?.message ?? "The card was declined.";
        return { ok: false, paymentId: e?.payment_intent?.id ?? r.json.id ?? null, code, error, testMode };
      }
      throw new Error(`Stripe charge failed: HTTP ${r.status} ${r.json.error?.message ?? ""}`.trim());
    },

    async forgetCard(setupId) {
      const setup = await must<{ payment_method?: unknown }>("GET", `/v1/setup_intents/${encodeURIComponent(setupId)}`);
      const pm = idOf(setup.payment_method);
      if (pm) await must("POST", `/v1/payment_methods/${encodeURIComponent(pm)}/detach`, {});
    },

    verifyAndParse(rawBody, headers, nowSeconds = Math.floor(Date.now() / 1000)) {
      if (!signatureValid(rawBody, headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET, nowSeconds)) return null;
      return parseEvent(rawBody);
    },

    acceptsTestEvents: () => testMode,
  };
}
