import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";

export const metadata = { title: "Pricing" };

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
      "Flood and heat modelled for the neighbourhood around one property",
      "Findings first, with how much evidence stands behind each",
      "What to check at the house",
    ],
  },
  {
    name: "A subscription",
    state: "Planned · monthly",
    who: "A home owner testing projects over time.",
    what: [
      "The flood and heat models, with your own storms",
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

export default function PricingPage() {
  return (
    <>
      <Nav active="pricing" />
      <PageHero
        kicker="pricing · nothing on sale yet"
        title="The public record is free. The models will be paid."
        lead="Looking up what is on record costs nothing and needs no account. Our own flood and heat models will be the paid part. There are no prices here yet, because there is nothing we can sell you today."
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
          <Link href="/contact" className="btn btn-accent">
            Ask for a report <span className="arrow">→</span>
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
