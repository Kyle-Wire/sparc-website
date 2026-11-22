/**
 * One shape for every payment provider, so the order flow does not care which
 * one takes the money.
 *
 * Why: Lemon Squeezy closed new store sign-ups on 16 November 2026 and stops
 * processing payments on 31 March 2027 (lemonsqueezy.com/blog/saying-goodbye-
 * to-lemon-squeezy, read 22 November 2026). It points sellers to Stripe
 * Managed Payments. Lemon Squeezy is the first adapter because the site was
 * already wired for it; a Stripe adapter is a second file beside it, chosen by
 * PAYMENTS_PROVIDER, with nothing else in the flow changing.
 */

export type ProviderId = "lemonsqueezy";

export interface CheckoutRequest {
  /** Our report_orders.id. The only thing we trust back from the provider. */
  orderId: string;
  userId: string;
  email: string;
  /** Where the buyer lands after paying. */
  successUrl: string;
}

/** A verified provider event, reduced to what the order needs. */
export interface PaymentEvent {
  kind: "order_paid" | "order_refunded" | "other";
  /** Unique per delivery kind and object: a resend has the same key. */
  eventKey: string;
  eventName: string;
  orderId: string | null;
  userId: string | null;
  providerOrderId: string;
  providerOrderNumber: string | null;
  /** In minor units (cents). */
  amountCents: number | null;
  currency: string | null;
  testMode: boolean;
  receiptUrl: string | null;
  /** The product variant bought, as the provider names it. */
  variantId: string | null;
}

export interface PaymentProvider {
  id: ProviderId;
  /** True when every setting the provider needs is present. */
  configured(): boolean;
  createCheckout(req: CheckoutRequest): Promise<string>;
  /**
   * Check the signature over the raw body and parse it. Null means the
   * signature failed: answer 401 and do nothing else.
   */
  verifyAndParse(rawBody: string, headers: Headers): PaymentEvent | null;
  /** Whether this event's variant is the report we sell, in this store. */
  isReportVariant(variantId: string | null): boolean;
}
