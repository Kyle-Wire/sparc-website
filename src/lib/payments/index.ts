import type { PaymentProvider } from "./provider";
import { stripe, type StripeEnv } from "./stripe";

/** The provider in use: Stripe (Kyle, 22 November 2026). */
export function paymentProvider(env: Record<string, string | undefined> = process.env): PaymentProvider {
  return stripe(env as StripeEnv);
}

export * from "./provider";
export * from "./catalog";
