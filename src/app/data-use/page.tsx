import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import Link from "next/link";
import { EMAIL_PRIMARY } from "@/lib/brand";

export const metadata = {
  title: "Data Use",
  description: "The short version of what happens to your data on SPARC Labs, by what you are doing.",
};

// This page was rewritten on 2026-10-30 because every specific claim on it was
// either unsupported or the reverse of what the code does. Removed, and not to
// be reinstated without the named thing actually existing:
//
//   "Your projects ... never leave it unless you explicitly export them" —
//     true of the local tool, false of a study we run for a client, and the
//     page did not distinguish the two.
//   "License activation pings (every 30 days)" — nothing in the estate reads a
//     licence key or emits an activation ping. There is no entitlement
//     enforcement anywhere (SPA-11).
//   "Anonymous metering events — counts of pipeline runs and scenarios" —
//     nothing emits these.
//   "crash reports — sanitized stack traces, no project paths or data" — the
//     reverse of the truth. The crash reporter mails the last 20 session-log
//     entries, which can carry project paths and run parameters (SPA-14).
//   "BYOK ... encrypted at rest with Supabase Vault" — the Supabase layer is
//     frozen and the BYOK chat path does not work at all (SPA-31).
//   "Transcend customers can deploy SPARC entirely offline ... email for the
//     air-gapped installer and signing keys" — there is no air-gapped
//     installer, there are no signing keys to send, and the tier names were
//     retired on 29 Oct.
//
// Rewritten again on 22 November 2026: the 30 October text said "There is no
// advertising, analytics or third-party tracking", but the layout loads Vercel
// Web Analytics and Speed Insights (the privacy page already says so). It also
// described software and studies, not the house report the site now sells.
// The privacy page is the detailed statement; this page is the short version
// and must never say more than it does.
//
// A data-handling statement must name the delivery mode it applies to. Do not
// put one in a philosophy tile, a hero lead or a badge, where it reads as a
// property of the company and cannot carry its own scope.

export default function DataUsePage() {
  const h2 = { fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 } as const;
  return (
    <>
      <Nav />
      <PageHero kicker="data use · explicit" title="What happens to your data." accent="var(--amber)" />
      <Section>
        <article style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 18, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7 }}>
          <p>
            The short version, by what you are doing. The <Link href="/privacy">privacy page</Link> has every
            detail and every company involved; where the two differ, the privacy page is right and this page is
            a mistake we will fix.
          </p>

          <h2 style={h2}>Looking up a place</h2>
          <p>
            An address you type is used to find the block and is not kept. The page you land on is named by a
            rounded point for the block, not the house. Saved places and notes stay in your browser and never
            reach us. Page views are counted without advertising or tracking cookies (Vercel Web Analytics).
          </p>

          <h2 style={h2}>If you order a house report</h2>
          <p>
            A report is about one house, so this is the one time we keep a street address. It is stored with your
            order, and only you and the person making your report can see it. We run our models for that place on
            our own computers and put the finished report in your account. Payment is handled by Stripe; we never
            see your card.
          </p>

          <h2 style={h2}>What we never do</h2>
          <ul>
            <li>Sell, rent or share addresses, places looked up or reports.</li>
            <li>Pass you to agents, lenders or insurers.</li>
            <li>Train any model on what you send us.</li>
            <li>Advertise, or run advertising trackers.</li>
          </ul>

          <h2 style={h2}>Deleting it</h2>
          <p>
            Email <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> and we will export or delete what we
            hold about you, including an order and its report, within 30 days. Payment records the law requires us
            to keep are kept as long as it requires.
          </p>

          <h2 style={h2}>Studies and software</h2>
          <p>
            If we run a study for an organization, or one day ship software, how its data is handled is written into
            that agreement, not into this page.
          </p>
        </article>
      </Section>
      <Footer />
    </>
  );
}
