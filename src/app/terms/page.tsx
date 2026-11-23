import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, COPYRIGHT_YEAR } from "@/lib/brand";
import { REPORT, checkoutEnabled, formatPrice } from "@/lib/payments";

export const metadata: Metadata = withPage("/terms", {
  title: "Terms of Service",
  description: "The terms for using SPARC Labs: a screening tool, not an engineering study, a home inspection or a flood determination.",
});
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const onSale = checkoutEnabled();
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
          {onSale ? (
            <>
              {/* DRAFT for Kyle's sign-off (22 November 2026), shown only when
                  CHECKOUT_ENABLED is on. Not yet read by a lawyer. Every figure
                  is read from src/lib/payments/catalog.ts. */}
              <h2 id="reports" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>The house report: billing, cancelling and refunds</h2>
              <p><strong>Price.</strong> {REPORT.name} costs {formatPrice(REPORT.priceCents)} for one property, plus any sales tax that applies where you are, which Stripe works out from your billing address. There is no subscription and nothing renews.</p>
              <p><strong>When you are charged.</strong> Nothing is charged when you order. You save a card on Stripe&apos;s checkout page, and by ordering you agree that we charge that card once, {formatPrice(REPORT.priceCents)} plus that tax, when your report is finished. The report opens in your account when the charge goes through. If the card does not go through, we email you, and the report opens once you pay from your account with that card or another. Your card is not charged at any other time or for any other amount.</p>
              <p><strong>What you get.</strong> A screening report for the property you name: {REPORT.includes.map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join("; ")}. Before we start, we check what our models can cover at that place. If a section cannot be made there, we tell you and the report says so.</p>
              <p><strong>When.</strong> We aim to finish the report within {REPORT.deliveryDays} working days of your order. If it is not finished by then, you may cancel and we charge nothing.</p>
              <p><strong>Cancelling and refunds.</strong> You may cancel at any time before the report is finished, and nothing is charged. If we cannot make the report for your property, we cancel it and charge nothing. Once a report is finished and paid for, it is not refundable unless it is materially wrong about what it says it describes; tell us at <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> and we will look at it with you, and refund in full if it is.</p>
              <p><strong>Your address.</strong> To make a report we keep the property address you give us, with your order. Only you and the person making your report can see it. See the <a href="/privacy">privacy page</a>.</p>
              <p><strong>Use of the report.</strong> The report is for you and the people you share it with in deciding about the property. It is a screening report and carries the limits in the warranty section below.</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Subscriptions</h2>
              <p>{COMPANY_LEGAL} is not selling subscriptions. Any other paid licence is agreed directly with us in writing, on the terms set out in that agreement.</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Subscriptions and billing</h2>
              <p>{COMPANY_LEGAL} is not currently selling subscriptions. Self-serve checkout is switched off and no tier prices are published. Any paid licence at this stage is agreed directly with us in writing, and the billing, cancellation and refund terms that apply are the ones set out in that agreement.</p>
              <p>If self-serve purchasing is reintroduced, the terms governing it — including cancellation and refunds — will be published on this page before any charge is taken. Questions in the meantime: <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>.</p>
            </>
          )}

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
