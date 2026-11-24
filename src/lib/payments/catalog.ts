/**
 * What is for sale, in one place. /pricing, /report/buy, the order route, the
 * account pages and the Terms all read this file, so a price or a promise is
 * written once.
 *
 * PRICE: $149, Kyle's decision (pricing thread, 22 November 2026). The figure
 * here must equal the report's Price in Stripe (STRIPE_PRICE_REPORT): the
 * deliver step refuses to charge if they differ. The buyer is charged when the
 * report is ready, plus sales tax (Kyle, 22 November 2026; migration 0008).
 *
 * Nothing in this file is shown to a visitor unless checkout is switched on
 * (checkoutEnabled() below), and checkout is switched on only where Kyle sets
 * CHECKOUT_ENABLED=true. The rule from 29 October 2026 still holds: no price,
 * entitlement or buy button goes on a public page until every line can be
 * held to in a contract and the Terms publish the billing and refund terms.
 * The Terms' report section reads REPORT below, so the two cannot drift.
 *
 * 23 November 2026, morning: ground movement came out of `includes` while
 * its readings were held.
 * 23 November 2026, afternoon: Kyle decided ground movement and wind are in
 * every report, and that the site is written in its finished state, since
 * sales are not pushed until every model passes its tests ("we can get the
 * site to a place where we assume everything is good to go"). The lines
 * describe what each section gives; none claims a validation. Where each
 * model stands against its benchmarks lives on /how-we-test (test-runs.ts,
 * receipts.ts), which is the one place that changes as checks finish.
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
  /** Working days from order to the finished report; later, the buyer may cancel and pays nothing. */
  deliveryDays: number;
}

export const REPORT: Product = {
  id: "home-report",
  name: "The house report",
  priceCents: 14900,
  currency: "USD",
  tagline: "Flood, heat, ground movement and wind around one house and its streets, in our models, with the receipts. Bought once.",
  includes: [
    "Flood: our 1 m flood model run for the streets around the house in design storms and a past storm, showing where water reaches and how deep it stands beside the house in each storm modelled",
    "Heat: modelled street air temperature around the house in a hot spell, afternoon and night, and modelled outdoor comfort (PET) in sun and in shade, with the satellite surface temperature of the block beside them",
    "Ground movement: whether the ground under the block moves differently from the ground around it, from NASA's satellite radar product where it covers the place, as a rate with its range",
    "Wind: storm gusts for the area from long weather-station records, and how wind moves between the buildings around the house, each with its range",
    "How much evidence stands behind every finding, the model's own error and where that was measured, and what to check at the house, set out once at the back",
    "A PDF in your account, yours to keep and share, with an atlas that opens with no internet, print-ready maps and the data files",
    "Corrections free for as long as SPARC Labs exists, and 12 months of updates when a finding changes or a hazard is added for your place",
  ],
  isNot: [
    "Not an engineering survey, a home inspection, an elevation certificate or a flood determination",
    "Not a forecast: it shows what the models show in the storms and hot spells run, not what will happen",
    "No dollar figures: no expected loss, no premiums, no payback",
    "Not checked at your house: no model result is compared with a measurement there, and the report says so once, at the back",
    "Nothing about the basement, the first floor or indoor temperature",
    "No figure without its range; a check that failed at your place, or another open problem with a figure, is noted beside it",
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

/**
 * How the report is sold. Kyle, 22 November 2026: open by invitation first
 * (a soft launch of 5 to 10 buyers, every report run by hand), then to anyone.
 *
 *   off     checkout is off (CHECKOUT_ENABLED is not "true"): nothing is sold.
 *   invite  checkout is on, and only emails in ORDER_INVITE_EMAILS can order.
 *           /pricing shows no price; /report/buy tells anyone else it is by
 *           invitation. This is the default once checkout is on.
 *   open    checkout is on and ORDERS_OPEN is "true": anyone signed in can order.
 */
export type SalesMode = "off" | "invite" | "open";

export function salesMode(env: Record<string, string | undefined> = process.env): SalesMode {
  if (!checkoutEnabled(env)) return "off";
  return env.ORDERS_OPEN === "true" ? "open" : "invite";
}

/** The invited emails, lower-cased, from a comma- or whitespace-separated list. */
export function invitedEmails(env: Record<string, string | undefined> = process.env): Set<string> {
  return new Set(
    (env.ORDER_INVITE_EMAILS ?? "")
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

/** Whether this signed-in email may place an order now. */
export function mayOrder(email: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  const mode = salesMode(env);
  if (mode === "off" || !email) return false;
  if (mode === "open") return true;
  return invitedEmails(env).has(email.trim().toLowerCase());
}

/**
 * The sentence the buyer ticks on /report/buy, and the version of the terms
 * they ticked it under. Both are saved with the order (migration 0009), so if
 * a charge is ever disputed we can show what the buyer agreed to and when.
 * Bump the version whenever this sentence, REPORT above or the Terms' report
 * section changes. Form: the date of the change, plus "-draft" until a lawyer
 * has read the Terms.
 */
export const AGREE_STATEMENT =
  "I have read what the report is and is not. It is a screening report, not an engineering survey, and none of its model results has been checked against a measurement at the house.";
export const REPORT_TERMS_VERSION = "2026-11-23c-draft";

/** The cap when nothing is set: Kyle, 24 November 2026, "we cap it at 10". */
export const DEFAULT_WEEKLY_CAP = 10;

/**
 * How many orders we take in any seven days, from the environment. The cap in
 * force is order_settings.weekly_cap in the database (migration 0012, changed
 * with `npx tsx scripts/waitlist.ts cap <n|none>`, no deploy needed); this is
 * the fallback when that row cannot be read. ORDERS_WEEKLY_CAP takes a whole
 * number, or "none" / "off" for no cap; unset or unreadable means
 * DEFAULT_WEEKLY_CAP. One person reads every report before it leaves, so past
 * the cap a buyer joins the waitlist (src/lib/payments/waitlist.ts) before a
 * card is saved, rather than us missing the promise after.
 */
export function weeklyCap(env: Record<string, string | undefined> = process.env): number | null {
  const raw = (env.ORDERS_WEEKLY_CAP ?? "").trim().toLowerCase();
  if (raw === "none" || raw === "off") return null;
  const n = Number(raw);
  return raw !== "" && Number.isInteger(n) && n > 0 ? n : DEFAULT_WEEKLY_CAP;
}

/** The order states that count against the weekly cap: the ones we owe work on or have done. */
export const CAP_STATUSES = ["card_saved", "in_progress", "charging", "payment_failed", "delivered", "refunded"] as const;
