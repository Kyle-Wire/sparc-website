import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, COPYRIGHT_YEAR } from "@/lib/brand";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <Nav />
      <PageHero kicker="terms · honest" title="Terms of Service." accent="var(--crimson)" />
      <Section>
        <article style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 18, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7 }}>
          <p>By using {COMPANY} you agree to these terms. SPARC is <strong>proprietary software</strong> owned by {COMPANY_LEGAL} and licensed to you under the terms of a written licence or subscription agreement; it is not open source and no source-code rights are granted.</p>

          {/* Checkout is disabled and no tier prices are published (2026-10-29).
              The previous Subscriptions and Refunds sections promised merchant-of-record
              billing, pro-rated cancellation and a 30-day no-questions refund against a
              self-serve purchase flow that is now switched off. Billing terms get
              republished here only alongside prices we can stand behind — and before
              any charge is taken, not after. */}
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Subscriptions and billing</h2>
          <p>{COMPANY_LEGAL} is not currently selling subscriptions. Self-serve checkout is switched off and no tier prices are published. Any paid licence at this stage is agreed directly with us in writing, and the billing, cancellation and refund terms that apply are the ones set out in that agreement.</p>
          <p>If self-serve purchasing is reintroduced, the terms governing it — including cancellation and refunds — will be published on this page before any charge is taken. Questions in the meantime: <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>.</p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Acceptable use</h2>
          <p>Don&apos;t use SPARC to harm people. Don&apos;t use it to misrepresent uncertainty in ways a court would call fraud. Don&apos;t scrape our marketing site.</p>

          {/* This clause said "the neural-causal pipeline produces statistical
              estimates". The neural stacker never ran — it raised an
              UnboundLocalError before its first epoch and the pipeline fell back
              to a weighted average of the base models. A warranty disclaimer is a
              contract term, so it should not describe a component that does not
              exist. Wording changed; the disclaimer itself is unchanged. */}
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>No warranty</h2>
          <p>SPARC is provided &quot;as is&quot;. Its outputs are statistical estimates, not engineering certifications, and they are screening-level: they are not a substitute for a licensed engineer&apos;s analysis, a regulatory flood determination, or a ground survey. You are responsible for the decisions you make from its outputs.</p>

          <p style={{ fontSize: 13, color: "var(--muted)" }}>© {COPYRIGHT_YEAR} {COMPANY_LEGAL} · {OFFICE_FULL}</p>
        </article>
      </Section>
      <Footer />
    </>
  );
}
