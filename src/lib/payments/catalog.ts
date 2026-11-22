/**
 * What is for sale, in one place. /pricing, /report/buy, the order route, the
 * account pages and the Terms all read this file, so a price or a promise is
 * written once.
 *
 * PRICE: $149, Kyle's decision (pricing thread, 22 November 2026). The figure
 * here must equal the report's Price in Stripe (STRIPE_PRICE_REPORT);
 * the webhook records what was actually paid and flags an order paid at more
 * than this figure (supabase/migrations/0007_report_orders.sql).
 *
 * Nothing in this file is shown to a visitor unless checkout is switched on
 * (checkoutEnabled() below), and checkout is switched on only where Kyle sets
 * CHECKOUT_ENABLED=true. The rule from 29 October 2026 still holds: no price,
 * entitlement or buy button goes on a public page until every line can be
 * held to in a contract and the Terms publish the billing and refund terms.
 * The Terms' report section reads REPORT below, so the two cannot drift.
 */

export type ProductId = "home-report";

export interface Product {
  id: ProductId;
  name: string;
  /** In US cents. */
  priceCents: number;
  currency: "USD";
  /** One line under the name. */
  tagline: string;
  /** What the buyer gets. Each line must be true of every report sold. */
  includes: string[];
  /** What it is not. Shown beside the price, not in small print. */
  isNot: string[];
  /** Working days from payment to delivery, or a full refund. */
  deliveryDays: number;
}

export const REPORT: Product = {
  id: "home-report",
  name: "The house report",
  priceCents: 14900,
  currency: "USD",
  tagline: "Flood, heat and ground movement around one house and its streets, in our models, with the receipts. Bought once.",
  includes: [
    "Flood: our 1 m flood model run for the streets around the house in design storms and a past storm, showing where water reaches and how deep it stands beside the house in each storm modelled",
    "Heat: modelled street air temperature around the house in a hot spell, afternoon and night, and modelled outdoor comfort (PET) in sun and in shade, with the satellite surface temperature of the block beside them",
    "Ground movement: whether the ground under the block moves toward or away from the satellite differently from the ground around it, from NASA's satellite radar product, where it covers the place",
    "Every finding labelled with how much evidence stands behind it, the model's own error and where that was measured, and what to check at the house",
    "A PDF in your account, yours to keep and share",
  ],
  isNot: [
    "Not an engineering survey, a home inspection, an elevation certificate or a flood determination",
    "Not a forecast: it shows what the models show in the storms and hot spells run, not what will happen",
    "No dollar figures: no expected loss, no premiums, no payback",
    "Model results are labelled exploratory unless they have been compared with a measurement at that place, and none has been yet",
    "Nothing about the basement, the first floor or indoor temperature, and no wind until our wind model passes its checks",
  ],
  deliveryDays: 10,
};

export const PRODUCTS: Record<ProductId, Product> = { "home-report": REPORT };

/** "$149" for whole dollars, "$149.50" otherwise. */
export function formatPrice(cents: number, currency = "USD"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Self-serve checkout is off unless CHECKOUT_ENABLED is exactly "true".
 * Set it in Vercel's Preview environment with the provider in test mode to try
 * the flow; set it in Production only once Kyle has signed off the price,
 * the Terms and a live store.
 */
export function checkoutEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.CHECKOUT_ENABLED === "true";
}
