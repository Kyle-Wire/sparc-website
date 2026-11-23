/**
 * One shape for a payment provider, so the order flow does not care which one
 * takes the money.
 *
 * Kyle, 22 November 2026: Stripe, and the buyer is charged when the report is
 * ready, not when they order. (Lemon Squeezy, which the site was first wired
 * for, closed new store sign-ups on 16 November 2026 and stops processing
 * payments on 31 March 2027. Stripe Managed Payments refuses products with
 * "human intervention", and its Checkout cannot save a card for later; see
 * docs/payments.md.) Stripe is the one adapter; the interface stays so the
 * order table, pages and fulfilment script never name a provider.
 */

export type ProviderId = "stripe";

/** At order: save the buyer's card. Nothing is charged. */
export interface CheckoutRequest {
  /** Our report_orders.id. The only thing we trust back from the provider. */
  orderId: string;
  userId: string;
  email: string;
  /** Where the buyer lands after saving the card. */
  successUrl: string;
  /** Where the buyer lands if they back out. */
  cancelUrl: string;
}

/** After a failed charge: a page where the buyer pays for the finished report. */
export interface PayLinkRequest {
  orderId: string;
  userId: string;
  customerId: string;
  /** Counts the tries, so a new link is a new session. */
  attempt: number;
  successUrl: string;
  cancelUrl: string;
}

/** On delivery: charge the card saved at order, plus any sales tax. */
export interface ChargeRequest {
  orderId: string;
  userId: string;
  customerId: string;
  setupId: string;
  /** 0 for the first try; the same number never charges twice. */
  attempt: number;
}

export type ChargeResult =
  | { ok: true; paymentId: string; amountCents: number; taxCents: number; currency: string; receiptUrl: string | null; testMode: boolean }
  | { ok: false; paymentId: string | null; error: string; code: string | null; testMode: boolean };

/** A verified provider event, reduced to what the order needs. */
export interface PaymentEvent {
  kind: "card_saved" | "order_paid" | "charge_failed" | "order_refunded" | "other";
  /** Unique per event: a resend has the same key. */
  eventKey: string;
  eventName: string;
  /** Our order id. A refund may not carry it; it is then matched on providerOrderId. */
  orderId: string | null;
  userId: string | null;
  /** The provider's payment id (Stripe: the PaymentIntent). Empty for card_saved. */
  providerOrderId: string;
  /** A second reference for a person (Stripe: the Checkout Session or charge id). */
  providerOrderNumber: string | null;
  /** In minor units (cents). */
  amountCents: number | null;
  currency: string | null;
  testMode: boolean;
  receiptUrl: string | null;
  /** What was bought, as we tagged it at checkout. */
  productId: string | null;
  /** card_saved: the provider's customer and the setup that saved the card. */
  customerId?: string | null;
  setupId?: string | null;
  /** charge_failed: the reason, in words the buyer can read. */
  error?: string | null;
}

export interface PaymentProvider {
  id: ProviderId;
  /** True when every setting the provider needs is present. */
  configured(): boolean;
  /** A checkout page that saves the buyer's card without charging it. */
  createCheckout(req: CheckoutRequest): Promise<string>;
  /** A checkout page that charges for a finished report. */
  createPayLink(req: PayLinkRequest): Promise<string>;
  /** Charge the saved card. Never throws for a decline: that is a result. */
  chargeSavedCard(req: ChargeRequest): Promise<ChargeResult>;
  /** Remove the saved card (after a cancel, or when we cannot make the report). */
  forgetCard(setupId: string): Promise<void>;
  /**
   * Check the signature over the raw body and parse it. Null means the
   * signature failed: answer 400 and do nothing else.
   */
  verifyAndParse(rawBody: string, headers: Headers, nowSeconds?: number): PaymentEvent | null;
  /** Whether test-mode events may count as payments (only while the keys are test keys). */
  acceptsTestEvents(): boolean;
}
