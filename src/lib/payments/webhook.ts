/**
 * What the webhook does with a verified event for a report order. Kept apart
 * from the route so the decisions are tested without a server or a database
 * (webhook.test.ts).
 *
 * Answering: Stripe retries an event that is not answered with a 2xx. So every
 * event we understand and choose not to act on is answered 200 with a reason,
 * and only a failure on our side (the database did not answer) is a 500, which
 * Stripe then retries. The order's state machine is in SQL
 * (apply_payment_event, migration 0007), so a retry can never apply a payment
 * twice.
 */

import type { PaymentEvent, PaymentProvider } from "./provider";
import { REPORT } from "./catalog";

export type ApplyFn = (args: { provider: string; event: PaymentEvent }) => Promise<string>;

export interface Decision {
  status: 200 | 500;
  outcome: string;
  /** Set when the order moved: send the buyer and the inbox a note. */
  notify?: "paid" | "refunded";
}

export async function decide(event: PaymentEvent, provider: PaymentProvider, apply: ApplyFn): Promise<Decision> {
  if (event.kind === "other") return { status: 200, outcome: "ignored" };
  if (event.orderId !== null && !/^[0-9a-f-]{36}$/i.test(event.orderId)) return { status: 200, outcome: "bad_order_id" };
  if (event.kind === "order_paid" && !event.orderId) return { status: 200, outcome: "no_order_id" };
  if (!event.providerOrderId) return { status: 200, outcome: "no_payment_id" };
  // A test purchase must never count as paid once the keys are live.
  if (event.testMode && !provider.acceptsTestEvents()) return { status: 200, outcome: "test_event_in_live_mode" };
  if (event.kind === "order_paid" && event.productId !== REPORT.id) return { status: 200, outcome: "other_product" };

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
