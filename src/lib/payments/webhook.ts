/**
 * What the webhook does with a verified event for a report order. Kept apart
 * from the route so the decisions are tested without a server or a database
 * (webhook.test.ts).
 *
 * Answering: Lemon Squeezy resends anything that is not a 200, up to three
 * times. So every event we understand and choose not to act on is answered
 * 200 with a reason, and only a failure on our side (the database did not
 * answer) is a 500, which the provider then retries. The order's state
 * machine itself is in SQL (apply_payment_event in migration 0007), so a
 * retry can never apply a payment twice.
 */

import type { PaymentEvent, PaymentProvider } from "./provider";

export type ApplyFn = (args: {
  provider: string;
  event: PaymentEvent;
}) => Promise<string>;

export interface Decision {
  status: 200 | 500;
  outcome: string;
  /** Set when the order moved to paid: send the buyer and the inbox a note. */
  notify?: "paid" | "refunded";
}

export interface WebhookEnv {
  /** "true" while the store is in test mode; test events are refused otherwise. */
  LEMONSQUEEZY_TEST_MODE?: string;
}

export async function decide(event: PaymentEvent, provider: PaymentProvider, apply: ApplyFn, env: WebhookEnv): Promise<Decision> {
  if (event.kind === "other") return { status: 200, outcome: "ignored" };
  if (!event.orderId) return { status: 200, outcome: "no_order_id" };
  if (!/^[0-9a-f-]{36}$/i.test(event.orderId)) return { status: 200, outcome: "bad_order_id" };
  // A test purchase must never count as paid once the store is live.
  if (event.testMode && env.LEMONSQUEEZY_TEST_MODE !== "true") return { status: 200, outcome: "test_event_in_live_mode" };
  if (event.kind === "order_paid" && !provider.isReportVariant(event.variantId)) return { status: 200, outcome: "other_product" };

  let outcome: string;
  try {
    outcome = await apply({ provider: provider.id, event });
  } catch (err) {
    console.error("[payments] apply failed:", err);
    return { status: 500, outcome: "apply_failed" };
  }
  if (outcome === "paid") return { status: 200, outcome, notify: "paid" };
  if (outcome === "refunded") return { status: 200, outcome, notify: "refunded" };
  return { status: 200, outcome };
}
