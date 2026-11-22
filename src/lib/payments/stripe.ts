/**
 * The Stripe adapter: Checkout with Managed Payments, Stripe's merchant of
 * record service, for the house report.
 *
 * Sources, opened 22 November 2026:
 *   - Managed Payments set-up (docs.stripe.com/payments/managed-payments/set-up):
 *     a Checkout Session with managed_payments[enabled]=true, mode=payment and a
 *     price whose product has a tax code "Eligible for Managed Payments";
 *     fulfil on checkout.session.completed and
 *     checkout.session.async_payment_succeeded, not on the success page.
 *   - Disallowed with Managed Payments (…/managed-payments/update-checkout):
 *     automatic_tax, payment_method_types, payment_intent_data.receipt_email,
 *     statement descriptors, shipping and Connect fields. None is sent here.
 *   - API version (…/changelog/dahlia/2026-04-22/managed-payments): managed_payments
 *     was added in 2026-04-22.dahlia; without an SDK, send Stripe-Version.
 *   - Eligibility (…/managed-payments/eligibility): digital products, sold
 *     directly, "fully automated, with no human intervention". A report a
 *     person runs by hand may not qualify. If Stripe says no, set
 *     STRIPE_MANAGED_PAYMENTS=false: the same Checkout then runs with Stripe
 *     Tax (automatic_tax) and SPARC Labs is the seller of record.
 *   - Signatures (docs.stripe.com/webhooks#verify-manually): header
 *     "t=<unix seconds>,v1=<hex>[,v1=…]"; HMAC-SHA256 over "<t>.<raw body>"
 *     with the endpoint secret; any v1 may match; default tolerance 300 s; v0
 *     is ignored.
 *   - Session object (docs.stripe.com/api/checkout/sessions/object): amount_total
 *     (minor units), currency (lowercase), payment_status paid | unpaid |
 *     no_payment_required, payment_intent, livemode, client_reference_id, metadata.
 *   - Refunds (docs.stripe.com/api/events/types, …/api/charges/object):
 *     charge.refunded fires on full and partial refunds; the charge carries
 *     payment_intent, amount_refunded and refunded (true only when full).
 *
 * Plain fetch, no SDK, so a test can point it at a local stand-in
 * (STRIPE_API_BASE, honoured for localhost only).
 */

import crypto from "node:crypto";
import type { CheckoutRequest, PaymentEvent, PaymentProvider } from "./provider";
import { REPORT } from "./catalog";

const API = "https://api.stripe.com";
export const STRIPE_VERSION = "2026-04-22.dahlia";
const TOLERANCE_S = 300;

export interface StripeEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** The house report's Price id (price_…). */
  STRIPE_PRICE_REPORT?: string;
  /** "false" turns Managed Payments off and Stripe Tax on (see the header). */
  STRIPE_MANAGED_PAYMENTS?: string;
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
  };

  if (e.type === "checkout.session.completed" || e.type === "checkout.session.async_payment_succeeded") {
    const paid = o.payment_status === "paid";
    return {
      ...base,
      kind: paid && o.mode === "payment" ? "order_paid" : "other",
      orderId: str(o.client_reference_id) ?? str(meta.order_id),
      userId: str(meta.user_id),
      providerOrderId: str(o.payment_intent) ?? str(o.id) ?? "",
      providerOrderNumber: str(o.id),
      amountCents: typeof o.amount_total === "number" ? o.amount_total : null,
      currency: str(o.currency)?.toUpperCase() ?? null,
      productId: str(meta.product),
    };
  }
  if (e.type === "charge.refunded") {
    // Only a full refund closes the order. A partial one is left for a person.
    return {
      ...base,
      kind: o.refunded === true ? "order_refunded" : "other",
      orderId: str(meta.order_id),
      userId: null,
      providerOrderId: str(o.payment_intent) ?? "",
      providerOrderNumber: str(o.id),
      amountCents: typeof o.amount_refunded === "number" ? o.amount_refunded : null,
      currency: str(o.currency)?.toUpperCase() ?? null,
      productId: null,
      receiptUrl: str(o.receipt_url),
    };
  }
  return { ...base, kind: "other", orderId: null, userId: null, providerOrderId: str(o.id) ?? "", providerOrderNumber: null, amountCents: null, currency: null, productId: null };
}

/** The Checkout Session request, as form fields. Exported for the test. */
export function checkoutBody(req: CheckoutRequest, env: StripeEnv): Record<string, unknown> {
  const managed = env.STRIPE_MANAGED_PAYMENTS !== "false";
  const tags = { order_id: req.orderId, user_id: req.userId, product: REPORT.id };
  return {
    mode: "payment",
    line_items: [{ price: env.STRIPE_PRICE_REPORT, quantity: 1 }],
    client_reference_id: req.orderId,
    customer_email: req.email,
    metadata: tags,
    // Copied onto the payment, so its charge (and a refund of it) names the order too.
    payment_intent_data: { metadata: tags },
    success_url: req.successUrl,
    cancel_url: req.cancelUrl,
    ...(managed ? { managed_payments: { enabled: true } } : { automatic_tax: { enabled: true } }),
  };
}

export function stripe(env: StripeEnv): PaymentProvider {
  return {
    id: "stripe",
    configured: () => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_REPORT),

    async createCheckout(req: CheckoutRequest): Promise<string> {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_REPORT) throw new Error("Stripe is not configured (secret key, report price).");
      const res = await fetch(`${apiBase(env)}/v1/checkout/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Stripe-Version": STRIPE_VERSION,
          // A double click makes one session, not two.
          "Idempotency-Key": `checkout-${req.orderId}`,
        },
        body: formEncode(checkoutBody(req, env)).join("&"),
      });
      const json = (await res.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
      if (!res.ok || !json?.url) throw new Error(`Stripe checkout failed: HTTP ${res.status} ${json?.error?.message ?? ""}`.trim());
      return json.url;
    },

    verifyAndParse(rawBody, headers, nowSeconds = Math.floor(Date.now() / 1000)) {
      if (!signatureValid(rawBody, headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET, nowSeconds)) return null;
      return parseEvent(rawBody);
    },

    acceptsTestEvents: () => isTestKey(env.STRIPE_SECRET_KEY),
  };
}
