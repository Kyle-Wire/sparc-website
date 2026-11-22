/**
 * What the webhook does with a verified event for a report order. Kept apart
 * from the route so the decisions are tested without a server or a database
 * (webhook.test.ts).
 *
 * Answering: Stripe retries an event that is not answered with a 2xx. So every
 * event we understand and choose not to act on is answered 200 with a reason,
 * and only a failure on our side (the database did not answer) is a 500, which
 * Stripe then retries. The order's state machine is in SQL
 * (apply_payment_event, migration 0008), so a retry can never apply an event
 * twice.
 */

import type { PaymentEvent, PaymentProvider } from "./provider";
import { REPORT } from "./catalog";

export type ApplyFn = (args: { provider: string; event: PaymentEvent }) => Promise<string>;

/** Which note follows an order's move. */
export type Notice = "card_saved" | "delivered" | "payment_failed" | "refunded";

export interface Decision {
  status: 200 | 500;
  outcome: string;
  /** Set when the order moved: send the buyer and the inbox a note. */
  notify?: Notice;
}

const NOTICE: Record<string, Notice> = {
  card_saved: "card_saved",
  delivered: "delivered",
  charge_failed: "payment_failed",
  refunded: "refunded",
};

export function noticeFor(outcome: string): Notice | undefined {
  return NOTICE[outcome];
}

export async function decide(event: PaymentEvent, provider: PaymentProvider, apply: ApplyFn): Promise<Decision> {
  if (event.kind === "other") return { status: 200, outcome: "ignored" };
  if (event.orderId !== null && !/^[0-9a-f-]{36}$/i.test(event.orderId)) return { status: 200, outcome: "bad_order_id" };
  if (event.kind !== "order_refunded" && !event.orderId) return { status: 200, outcome: "no_order_id" };
  if (event.kind === "card_saved" ? !(event.setupId && event.customerId) : !event.providerOrderId) {
    return { status: 200, outcome: event.kind === "card_saved" ? "no_saved_card" : "no_payment_id" };
  }
  // A test purchase must never count once the keys are live.
  if (event.testMode && !provider.acceptsTestEvents()) return { status: 200, outcome: "test_event_in_live_mode" };
  if (event.kind !== "order_refunded" && event.productId !== REPORT.id) return { status: 200, outcome: "other_product" };

  let outcome: string;
  try {
    outcome = await apply({ provider: provider.id, event });
  } catch (err) {
    console.error("[payments] apply failed:", err);
    return { status: 500, outcome: "apply_failed" };
  }
  const notify = noticeFor(outcome);
  return notify ? { status: 200, outcome, notify } : { status: 200, outcome };
}
