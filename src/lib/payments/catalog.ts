/**
 * What is for sale, in one place. /pricing, /report/buy, the order route, the
 * account pages and the Terms all read this file, so a price or a promise is
 * written once.
 *
 * PRICE IS A PROPOSAL. Kyle decides it (pricing thread, 22 November 2026). The
 * figure here must equal the variant's price in the payment provider's store;
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
  tagline: "Flood and heat, modelled for one house and the streets around it. Bought once.",
  includes: [
    "Flood: our 1 m flood model run for the streets around the house, with design storms and a past storm, and how deep water gets beside it",
    "Heat: street-level air temperature and thermal comfort (PET) around the house in a hot spell, in sun and in shade",
    "Ground movement: whether the ground the house stands on is sinking or rising, from satellite radar, where the data covers it",
    "Every finding labelled with how much evidence stands behind it, and what to check at the house",
    "A PDF in your account, yours to keep and share",
  ],
  isNot: [
    "Not an engineering survey, an elevation certificate or a flood determination",
    "No dollar figures: no expected loss, no premiums, no payback",
    "Model results are labelled exploratory unless they have been compared with a measurement at that place",
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
