import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";
import { REPORT, formatPrice, salesMode } from "@/lib/payments";

export const metadata = {
  title: "Pricing",
  description: "The public record for any US address is free with no account. Our models, run for one house, are the paid part.",
};
// The price shows only when checkout is switched on, so the page is rendered per request.
export const dynamic = "force-dynamic";

// History, kept because the rule it produced still stands.
//
// Until 2026-10-29 this page showed four named tiers with placeholder prices,
// two live purchase buttons, a refund line and support windows. None of it was
// confirmed, so it was all withdrawn and checkout was disabled in
// src/app/api/checkout/route.ts.
//
// On 2026-11-17 the site changed direction (docs/design/site-redesign-brief.md).
// This page now says what is free, what will be paid, and that nothing is on
// sale. The rule is unchanged:
//
//   Do not put a price, an entitlement list or a purchase button on this page
//   until every line is something SPARC Labs LLC can be held to in a contract.
//
// 22 November 2026: the house report can be bought, behind CHECKOUT_ENABLED
// (src/lib/payments/catalog.ts). With it off, this page is exactly as before.
// With it on, the report card carries its price and one link to /report/buy,
// and the Terms carry the report's billing and refund terms (/terms#reports),
// both read from the same catalogue entry. docs/payments.md lists what Kyle
// signs off before it is switched on in production.

const PLANS: { name: string; state: string; who: string; what: string[] }[] = [
  {
    name: "The public record",
    state: "Free · no account",
    who: "Anyone.",
    what: [
      "Any US address",
      "FEMA flood zones, flood insurance claims nearby, disaster declarations",
      "Hurricane and tropical storm tracks, sea level rise",
      "Tree canopy and paving",
    ],
  },
  {
    name: "A report",
    state: "Planned · bought once",
    who: "Someone buying a home. You get the report and you are done.",
    what: [
      "Flood, heat, ground movement and wind, modelled for the neighbourhood around one property",
      "Findings first, with how much evidence stands behind each",
      "What to check at the house",
    ],
  },
  {
    name: "A subscription",
    state: "Planned · monthly",
    who: "A home owner testing projects over time.",
    what: [
      "The flood model in your browser, with your own storms",
      "Heat runs queued on our server; ground movement and wind worked out for you",
      "What-if runs: rain garden, French drain, less paving, more trees",
      "Saved places and runs",
    ],
  },
];

const BEFORE_WE_CHARGE: string[] = [
  "What one report or one month covers, exactly.",
  "What each model has been tested against, and its margins, in a methods paper.",
  "A check that your device can run the flood model before you pay, with a plain answer if it cannot.",
  "Billing, cancellation and refund terms, published in the Terms of Service before any charge is taken.",
];

// For scale, the costs a buyer already knows. Rocket Mortgage, "How much does a
// home inspection cost in 2026?" (updated 12 November 2026, citing 2026
// HomeAdvisor data), opened 22 November 2026: a standard inspection "typically
// costs about $343, with most inspections falling between $296 – $424"; an
// optional radon test $150–$250 and sewer scope $175–$295.
const FOR_SCALE =
  "For scale: a standard home inspection usually costs $296 to $424, and a radon test or sewer scope added to it $150 to $295 (2026 HomeAdvisor figures, via Rocket Mortgage).";

export default function PricingPage() {
  // The price goes on this page only when anyone can order (ORDERS_OPEN).
  // During the invitation-only soft launch it reads as not on sale.
  return salesMode() === "open" ? <OnSale /> : <NotOnSale />;
}

function OnSale() {
  return (
    <>
      <Nav active="pricing" />
      <PageHero
        kicker="pricing"
        title="The public record is free. The house report is paid."
        lead="Looking up what is on record costs nothing and needs no account. When you are deciding on one house, the house report runs our own models for it."
        accent="var(--amber)"
      />
      <Section kicker="two ways to use it" title="Free for the area. Paid for the house.">
        <div className="grid-2 pricing-tiers" style={{ gap: 18, alignItems: "stretch" }}>
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="kicker">Free · no account</div>
            <h3 style={{ margin: 0 }}>{PLANS[0].name}</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>What is on public record around any US address.</p>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
              {PLANS[0].what.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <div style={{ marginTop: "auto", paddingTop: 10 }}>
              <Link href="/" className="btn">Look up a place <span className="arrow">→</span></Link>
            </div>
          </div>
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="kicker">Bought once · for one house</div>
            <h3 style={{ margin: 0 }}>{REPORT.name}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>{formatPrice(REPORT.priceCents)}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>once, plus any sales tax</span>
            </div>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
              {REPORT.includes.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: "4px 0 0" }}>
              <strong style={{ color: "var(--ink)" }}>You pay when it is ready.</strong> Nothing is charged when you
              order. If we cannot model your place, or it is not ready within {REPORT.deliveryDays} working days and
              you cancel, you pay nothing.
            </p>
            <div className="row" style={{ marginTop: "auto", paddingTop: 10, gap: 10, flexWrap: "wrap" }}>
              <Link href="/report/buy" className="btn btn-accent">Order the house report <span className="arrow">→</span></Link>
              <Link href="/report/sample" className="btn">See a sample</Link>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>{FOR_SCALE}</p>
      </Section>

      <Section sunken kicker="what it is not" title="Said before you pay, not after.">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.7, maxWidth: 760 }}>
          {REPORT.isNot.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: 760 }}>
          A subscription for owners trying projects over time is planned, not on sale. Billing and refund terms are in
          the <Link href="/terms#reports">Terms of Service</Link>. Questions: {EMAIL_PRIMARY}.
        </p>
      </Section>
      <Footer />
    </>
  );
}

function NotOnSale() {
  return (
    <>
      <Nav active="pricing" />
      <PageHero
        kicker="pricing · nothing on sale yet"
        title="The public record is free. The models will be paid."
        lead="Looking up what is on record costs nothing and needs no account. Our own flood, heat, ground movement and wind models will be the paid part. There are no prices here yet, because there is nothing we can sell you today."
        accent="var(--amber)"
      />

      <Section kicker="what is planned" title="Three ways to use it.">
        <div className="grid-3 pricing-tiers" style={{ gap: 18, alignItems: "stretch" }}>
          {PLANS.map((p) => (
            <div key={p.name} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="kicker">{p.state}</div>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{p.who}</p>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {p.what.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>
          The two paid plans are a plan, not an offer. What each includes may change before it goes on sale.
        </p>
      </Section>

      <Section sunken kicker="today" title="A report, run by hand.">
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760, margin: "0 0 20px" }}>
          Until the models are on the site, a report is something we run ourselves when someone asks. Tell
          us the place and what you are trying to decide. We will say what we can and cannot model there
          before anything is agreed, and any price is given in writing, individually.
        </p>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Link href="/start" className="btn btn-accent">
            Get a report or run it yourself <span className="arrow">→</span>
          </Link>
          <Link href="/models" className="btn">
            How the models work
          </Link>
        </div>
        <p className="mono" style={{ marginTop: 18, fontSize: 11, color: "var(--muted)" }}>
          or email {EMAIL_PRIMARY}
        </p>
      </Section>

      <Section kicker="before we charge for anything" title="What we will publish first.">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12, maxWidth: 760 }}>
          {BEFORE_WE_CHARGE.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 12, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
              {/* --amber as a text colour is 2.27:1 on paper, below every
                  threshold. Darkened variant, same hue. */}
              <span className="mono" style={{ color: "var(--amber-ink)", fontWeight: 700, marginTop: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 22, fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: 760 }}>
          Until all four exist, this page carries no prices. No support commitment, response time or
          discount is offered either. The <Link href="/terms">Terms of Service</Link> state the licence
          position as it stands.
        </p>
      </Section>

      <Footer />
    </>
  );
}
