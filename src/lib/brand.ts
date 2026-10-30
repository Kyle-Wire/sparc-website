// SPARC Labs · brand constants. Single source of truth — every page reads from here.

export const BRAND_LONG = "Spatial Research";
export const BRAND_SHORT = "SPARC";
export const COMPANY = "SPARC Labs";
// "Spatial Research" is what the SPARC acronym expands to, not a company name.
// The company is SPARC Labs; the legal entity is SPARC Labs LLC.
export const COMPANY_LONG = "SPARC Labs";
export const COMPANY_LEGAL = "SPARC Labs LLC";

export const DOMAIN = "sparclabs.co";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${DOMAIN}`;

export const EMAIL_PRIMARY = `hello@${DOMAIN}`;

// City and state only. The street address was a private residence; a public site
// should not publish it. If a mailing address is needed for contracting, use a
// registered-agent or PO box address rather than reinstating a home address.
export const OFFICE_CITY = "Philadelphia";
export const OFFICE_STATE = "PA";
export const OFFICE_FULL = `${OFFICE_CITY} · ${OFFICE_STATE}`;

export const VERSION = "v1.0.0";
export const FOUNDED_YEAR = 2024;
export const COPYRIGHT_YEAR = 2026;

export const TAGLINE_SHORT = `${BRAND_LONG} · ${VERSION}`;

// TAGLINE_LONG feeds page metadata, so whatever it says appears on every page of
// the site and in every link preview. It previously read "A neural model with
// built-in causal inference". Do not reinstate that, or any description of the
// pipeline as a neural or meta-learned model: the SharedTrunk + CityHead stacker
// never ran. It raised an UnboundLocalError before its first epoch and the
// pipeline silently fell back to a weighted average of the base models, which is
// what produced every figure of record. See sparc-resilience
// docs/results/reconciliation.md and the README's retraction notice.
export const TAGLINE_LONG =
  `${BRAND_LONG}. Spatial models of environmental hazards, built to be checked — ` +
  `every figure we publish traces to a named run, including the ones that failed.`;
