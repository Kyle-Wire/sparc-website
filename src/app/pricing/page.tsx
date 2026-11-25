import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";
import { REPORT, formatPrice, salesMode } from "@/lib/payments";

export const metadata: Metadata = withPage("/pricing", {
  title: "Pricing",
  description: "The public record for any US address is free with no account. Our models, run for one house, are the paid part.",
});
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

// The four plans (Kyle, 25 Nov 2026): the SPARC Labs Field Kit report;
// Storm Ahead ("first year free with report, and then 79 a year", price shown
// here); and, marked coming soon, Storm Ahead with an Acorn sensor and the
// Field Kit with an Acorn. No sensor price: nothing is built yet.
function Plans({ price, deliveryDays, includes }: { price?: string; deliveryDays?: number; includes?: string[] }) {
  return (
    <div className="plans">
      <div className="plan plan-main">
        <div className="kicker">bought once · for one house</div>
        <h3>The SPARC Labs Field Kit</h3>
        {price ? (
          <div className="plan-price">
            {price}
            <small>once</small>
          </div>
        ) : null}
        <ul>
          {(includes ?? ["The house report, the offline atlas and maps to print", "Flood, heat, ground movement and wind for the neighbourhood around the house"]).slice(0, 4).map((w) => (
            <li key={w}>{w.split(":")[0]}</li>
          ))}
          <li>A year of Storm Ahead, free</li>
        </ul>
        {deliveryDays ? (
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
            You pay when it is ready. If we cannot model your place, or it is not ready within {deliveryDays} working days and you cancel, you pay nothing.
          </p>
        ) : null}
        <div className="plan-go row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link href={price ? "/report/buy" : "/start"} className="btn btn-accent">Get a report <span className="arrow">→</span></Link>
          <Link href="/report/sample" className="btn">See a sample</Link>
        </div>
      </div>
      <div className="plan">
        <div className="kicker">yearly · after your free year</div>
        <h3>Storm Ahead</h3>
        <div className="plan-price">
          $79<small>a year</small>
        </div>
        <ul>
          <li>Watches the official forecasts for your house</li>
          <li>Runs your house&apos;s own flood and wind models when a storm is on course</li>
          <li>Free for the first year with every report</li>
          <li>Nothing renews unless you choose to</li>
        </ul>
        <div className="plan-go">
          <Link href="/storm-ahead" className="btn">How Storm Ahead works</Link>
        </div>
      </div>
      <div className="plan plan-soon">
        <div className="kicker">coming soon</div>
        <h3>Storm Ahead with Acorn</h3>
        <ul>
          <li>Storm Ahead, plus an Acorn sensor in your yard</li>
          <li>Rain, wind and heat measured at your own house</li>
        </ul>
        <div className="plan-go">
          <Link href="/acorn" className="btn btn-ghost">Meet Acorn</Link>
        </div>
      </div>
      <div className="plan plan-soon">
        <div className="kicker">coming soon</div>
        <h3>The Field Kit with Acorn</h3>
        <ul>
          <li>The SPARC Labs Field Kit report for your house</li>
          <li>An Acorn sensor that keeps checking it</li>
        </ul>
        <div className="plan-go">
          <Link href="/acorn" className="btn btn-ghost">Meet Acorn</Link>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  // The price goes on this page only when anyone can order (ORDERS_OPEN).
  // During the invitation-only soft launch it reads as not on sale.
  return salesMode() === "open" ? <OnSale /> : <NotOnSale />;
}

function OnSale() {
  return (
    <>
      <Nav active="pricing" />
      <main id="main">
      <PageHero
        kicker="pricing"
        title="The public record is free. The SPARC Labs Field Kit is paid."
        lead="Looking up what is on record costs nothing and needs no account. When you are deciding on one house, the SPARC Labs Field Kit runs our own models for it: a house report, an atlas, maps to print and a year of updates."
        accent="var(--amber)"
      />
      <Section kicker="plans" title="One report for the house. Storm Ahead to keep watching it.">
        <Plans price={formatPrice(REPORT.priceCents)} deliveryDays={REPORT.deliveryDays} includes={REPORT.includes} />
        <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>
          The public record for any US address stays free, with no account: FEMA flood zones, claims nearby, storm
          tracks, sinkholes and more. <Link href="/map">Look up a home</Link>.
        </p>
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>{FOR_SCALE}</p>
      </Section>

      <Section sunken kicker="what it is not" title="Said before you pay, not after.">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.7, maxWidth: 760 }}>
          {REPORT.isNot.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: 760 }}>
          Billing and refund terms are in
          the <Link href="/terms#reports">Terms of Service</Link>. Questions: {EMAIL_PRIMARY}.
        </p>
      </Section>
      </main>
      <Footer />
    </>
  );
}

function NotOnSale() {
  return (
    <>
      <Nav active="pricing" />
      <main id="main">
      <PageHero
        kicker="pricing · by invitation"
        title="The public record is free. The SPARC Labs Field Kit is paid."
        lead="Looking up what is on record costs nothing and needs no account. Our own models, run for one house, are the paid part. Reports are by invitation while we open, and the report's price is given to you in writing."
        accent="var(--amber)"
      />

      <Section kicker="plans" title="One report for the house. Storm Ahead to keep watching it.">
        <Plans />
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
          Until all four exist, the report itself carries no public price. No support commitment, response time or
          discount is offered either. The <Link href="/terms">Terms of Service</Link> state the licence
          position as it stands.
        </p>
      </Section>

      </main>

      <Footer />
    </>
  );
}
