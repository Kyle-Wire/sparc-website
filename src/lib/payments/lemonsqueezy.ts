/**
 * The Lemon Squeezy adapter.
 *
 * Sources, opened 22 November 2026:
 *   - Webhook requests: docs.lemonsqueezy.com/help/webhooks/webhook-requests.
 *     Headers are X-Event-Name and X-Signature only; there is no event id, so
 *     a delivery is keyed on event name and object id. Any answer but 200 is a
 *     failure, retried three more times (about 5 s, 25 s, 125 s).
 *   - Signing: docs.lemonsqueezy.com/help/webhooks/signing-requests. HMAC-SHA256
 *     of the raw body with the webhook's signing secret, hex digest.
 *   - Payloads: docs.lemonsqueezy.com/help/webhooks/example-payloads. custom_data
 *     is in meta; test_mode, identifier, order_number, total, currency, status,
 *     first_order_item.variant_id and urls.receipt are in data.attributes. The
 *     page shows total both as integer cents and as a decimal; treat integers
 *     as cents and check on the first test order.
 *   - Checkout creation: the request body the official SDK sends
 *     (@lemonsqueezy/lemonsqueezy.js 4.x, createCheckout): JSON:API, type
 *     "checkouts", snake_case attributes checkout_data, product_options,
 *     checkout_options, test_mode, relationships store and variant.
 *
 * Plain fetch rather than the SDK, so a test can point it at a local stand-in
 * (LEMONSQUEEZY_API_BASE, honoured for localhost only).
 */

import crypto from "node:crypto";
import type { CheckoutRequest, PaymentEvent, PaymentProvider } from "./provider";

const API = "https://api.lemonsqueezy.com";

export interface LemonSqueezyEnv {
  LEMONSQUEEZY_API_KEY?: string;
  LEMONSQUEEZY_STORE_ID?: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
  LEMONSQUEEZY_VARIANT_REPORT?: string;
  /** "true" while the store is in test mode. Checkouts are then created as test checkouts. */
  LEMONSQUEEZY_TEST_MODE?: string;
  /** Local stand-in for tests only. Ignored unless it is a localhost URL. */
  LEMONSQUEEZY_API_BASE?: string;
}

export function apiBase(env: LemonSqueezyEnv): string {
  const b = env.LEMONSQUEEZY_API_BASE;
  if (b && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(b)) return b;
  return API;
}

export function signBody(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function signatureValid(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const want = Buffer.from(signBody(rawBody, secret), "hex");
  const got = Buffer.from(signature, "hex");
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

/** Lemon Squeezy money: integers are minor units; a decimal is major units. */
export function toCents(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Number.isInteger(v) ? v : Math.round(v * 100);
}

const str = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));

interface LSPayload {
  meta?: { event_name?: string; custom_data?: Record<string, unknown> | null };
  data?: { id?: string | number; type?: string; attributes?: Record<string, unknown> };
}

export function parseEvent(rawBody: string): PaymentEvent | null {
  let p: LSPayload;
  try {
    p = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const name = p.meta?.event_name;
  const id = str(p.data?.id);
  if (!name || !id) return null;
  const a = p.data?.attributes ?? {};
  const custom = p.meta?.custom_data ?? {};
  const item = (a.first_order_item ?? {}) as Record<string, unknown>;
  const urls = (a.urls ?? {}) as Record<string, unknown>;

  let kind: PaymentEvent["kind"] = "other";
  if (p.data?.type === "orders") {
    if (name === "order_created" && a.status === "paid") kind = "order_paid";
    else if (name === "order_refunded") kind = "order_refunded";
  }
  return {
    kind,
    eventKey: `${name}:${id}`,
    eventName: name,
    orderId: str(custom.order_id),
    userId: str(custom.user_id),
    providerOrderId: id,
    providerOrderNumber: str(a.order_number) ?? str(a.identifier),
    amountCents: toCents(a.total),
    currency: str(a.currency),
    testMode: a.test_mode === true,
    receiptUrl: str(urls.receipt),
    variantId: str(item.variant_id),
  };
}

export function lemonSqueezy(env: LemonSqueezyEnv): PaymentProvider {
  return {
    id: "lemonsqueezy",
    configured: () =>
      Boolean(env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_STORE_ID && env.LEMONSQUEEZY_WEBHOOK_SECRET && env.LEMONSQUEEZY_VARIANT_REPORT),

    async createCheckout(req: CheckoutRequest): Promise<string> {
      const variant = env.LEMONSQUEEZY_VARIANT_REPORT;
      if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID || !variant) {
        throw new Error("Lemon Squeezy is not configured (API key, store id, report variant).");
      }
      const body = {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: req.email,
              custom: { order_id: req.orderId, user_id: req.userId },
            },
            product_options: { redirect_url: req.successUrl, enabled_variants: [Number(variant)] },
            checkout_options: { embed: false },
            test_mode: env.LEMONSQUEEZY_TEST_MODE === "true",
          },
          relationships: {
            store: { data: { type: "stores", id: String(env.LEMONSQUEEZY_STORE_ID) } },
            variant: { data: { type: "variants", id: String(variant) } },
          },
        },
      };
      const res = await fetch(`${apiBase(env)}/v1/checkouts`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as { data?: { attributes?: { url?: string } } } | null;
      const url = json?.data?.attributes?.url;
      if (!res.ok || !url) throw new Error(`Lemon Squeezy checkout failed: HTTP ${res.status}`);
      return url;
    },

    verifyAndParse(rawBody: string, headers: Headers): PaymentEvent | null {
      if (!signatureValid(rawBody, headers.get("x-signature"), env.LEMONSQUEEZY_WEBHOOK_SECRET)) return null;
      return parseEvent(rawBody);
    },

    isReportVariant: (variantId) => Boolean(variantId && env.LEMONSQUEEZY_VARIANT_REPORT && variantId === String(env.LEMONSQUEEZY_VARIANT_REPORT)),
  };
}
