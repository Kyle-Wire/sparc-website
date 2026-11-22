/**
 * One shape for a payment provider, so the order flow does not care which one
 * takes the money.
 *
 * Kyle, 22 November 2026: Stripe Managed Payments only. (Lemon Squeezy, which
 * the site was first wired for, closed new store sign-ups on 16 November 2026
 * and stops processing payments on 31 March 2027.) Stripe is the one adapter;
 * the interface stays so the order table, pages and fulfilment script never
 * name a provider.
 */

export type ProviderId = "stripe";

export interface CheckoutRequest {
  /** Our report_orders.id. The only thing we trust back from the provider. */
  orderId: string;
  userId: string;
  email: string;
  /** Where the buyer lands after paying. */
  successUrl: string;
  /** Where the buyer lands if they back out. */
  cancelUrl: string;
}

/** A verified provider event, reduced to what the order needs. */
export interface PaymentEvent {
  kind: "order_paid" | "order_refunded" | "other";
  /** Unique per event: a resend has the same key. */
  eventKey: string;
  eventName: string;
  /** Our order id. A refund may not carry it; it is then matched on providerOrderId. */
  orderId: string | null;
  userId: string | null;
  /** The provider's payment id (Stripe: the PaymentIntent). */
  providerOrderId: string;
  /** A second reference for a person (Stripe: the Checkout Session id). */
  providerOrderNumber: string | null;
  /** In minor units (cents). */
  amountCents: number | null;
  currency: string | null;
  testMode: boolean;
  receiptUrl: string | null;
  /** What was bought, as we tagged it at checkout. */
  productId: string | null;
}

export interface PaymentProvider {
  id: ProviderId;
  /** True when every setting the provider needs is present. */
  configured(): boolean;
  createCheckout(req: CheckoutRequest): Promise<string>;
  /**
   * Check the signature over the raw body and parse it. Null means the
   * signature failed: answer 400 and do nothing else.
   */
  verifyAndParse(rawBody: string, headers: Headers, nowSeconds?: number): PaymentEvent | null;
  /** Whether test-mode events may count as payments (only while the keys are test keys). */
  acceptsTestEvents(): boolean;
}
