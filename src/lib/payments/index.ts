import type { PaymentProvider } from "./provider";
import { lemonSqueezy, type LemonSqueezyEnv } from "./lemonsqueezy";

/** The provider in use. PAYMENTS_PROVIDER names it; Lemon Squeezy is the only one so far. */
export function paymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
  const id = env.PAYMENTS_PROVIDER ?? "lemonsqueezy";
  if (id === "lemonsqueezy") return lemonSqueezy(env as LemonSqueezyEnv);
  throw new Error(`Unknown PAYMENTS_PROVIDER: ${id}`);
}

export * from "./provider";
export * from "./catalog";
