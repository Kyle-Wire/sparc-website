import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, EMAIL_PRIMARY } from "@/lib/brand";

export const metadata = { title: "Pricing" };

// This page was reset to a true statement on 2026-10-29.
//
// What was here before: four named tiers at $0 / $49 / $160-per-seat / Custom,
// live "Start Pursue" and "Start Converge" buttons posting to /api/checkout, a
// tier-by-tier comparison table, a 30-day refund line, support response windows
// of 48h and 24h, and an FAQ answer offering academic pricing on request.
//
// None of it was confirmed. The prices were placeholders, several listed
// entitlements are not confirmed to ship, and there is no support rota, refund
// policy or discount programme behind the promises. Checkout is disabled in
// src/app/api/checkout/route.ts.
//
// Do not restore prices, entitlement lists or purchase buttons to this page
// until every line is something SPARC Labs LLC can be held to in a contract.

type Standing = { k: string; v: string };

const STANDING: Standing[] = [
  {
    k: "No self-serve purchase",
    v: "Checkout is switched off. There is nothing on this site you can buy with a card today.",
  },
  {
    k: "No published prices",
    v: "The tier prices previously shown here were internal placeholders, not offers. They are gone rather than left standing as numbers we would not repeat in a quote.",
  },
  {
    k: "No standing discounts",
    v: "There is no academic, student or faculty discount programme. This page previously said there was. That was getting ahead of ourselves, and it is withdrawn.",
  },
  {
    k: "No support commitment",
    v: "We publish no response-time commitment and no uptime figure. Support terms will be written into an agreement before they are advertised anywhere.",
  },
];

const BEFORE_WE_CHARGE: string[] = [
  "The unit we price — what one licence actually covers, and for how long.",
  "What each hazard module includes, and which areas it is validated for.",
  "Support terms, in writing, with a response window we can actually staff.",
  "Billing, cancellation and refund terms, published in the Terms of Service before any charge is taken.",
];

export default function PricingPage() {
  return (
    <>
      <Nav active="pricing" />
      <PageHero
        kicker="pricing · being re-established"
        title="We are not selling SPARC yet."
        lead="This page used to show four tiers, two live purchase buttons and a set of commitments we had not earned. It is now a straight account of where commercial terms actually stand. Prices, entitlements and support terms are being rebuilt from scratch."
        accent="var(--amber)"
      />

      <Section kicker="where this stands" title="What is true today.">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {STANDING.map((s, i) => (
            <div
              key={s.k}
              style={{
                padding: "20px 22px",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{s.k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>{s.v}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>
          {COMPANY} is a small company whose models are in active development. The validation work
          behind them is real, and we publish its limits alongside its results. The commercial
          wrapper around that work is not finished — and we would rather say so here than let a
          procurement officer discover it after a purchase order.
        </p>
      </Section>

      <Section sunken kicker="access today" title="How to work with us in the meantime.">
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760, margin: "0 0 20px" }}>
          Everything is a conversation right now. If you have a study area and a decision behind it,
          tell us what you are trying to decide and we will tell you whether the relevant module is
          validated for your situation — including where it is not. Any engagement is scoped and
          priced in writing, individually, with the uncertainty stated up front.
        </p>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <Link href="/contact" className="btn btn-accent">
            Start a conversation <span className="arrow">→</span>
          </Link>
          <Link href="/research" className="btn">
            Read the methods
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
              <span className="mono" style={{ color: "var(--amber)", fontWeight: 700, marginTop: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 22, fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: 760 }}>
          Until all four exist, this page carries no prices. The{" "}
          <Link href="/terms">Terms of Service</Link> state the licence position as it stands.
        </p>
      </Section>

      <Footer />
    </>
  );
}
