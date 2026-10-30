import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, COPYRIGHT_YEAR } from "@/lib/brand";

export const metadata = { title: "Privacy" };

// Corrected 2026-10-30. This page described a shipped desktop application, a
// live subscription and a metering stream, none of which exist: the desktop path
// is frozen, self-serve checkout is disabled, and nothing emits metering events.
// A privacy policy that overstates the data we handle is as much a
// misrepresentation as one that understates it, and this is the page a
// procurement reviewer reads. The corrected text below describes only the
// website, which is the only thing currently running.
//
// This has not been reviewed by counsel. It should be before anyone signs a
// contract or an E&O application that references it.

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <PageHero kicker="privacy · plain english" title="What we collect, what we don't." lead={`${COMPANY} does not currently distribute software, so this covers this website and anything you send us directly.`} accent="var(--purple)" />
      <Section>
        <article className="prose" style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 18, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>What we collect</h2>
          <p>Account information you give us, if you create an account: email, and optionally a name and organization. Whatever you write in a contact or access request, so that we can reply to it. Nothing else.</p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>What we don&apos;t</h2>
          <p>We do not run advertising, analytics or third-party trackers on this site. We do not sell anything through it, so there is no payment or subscription data. We do not receive project files, rasters, model outputs or LLM prompts from any installed application, because there is no installed application sending them. We do not train on anything you send us.</p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>If we run a study for you</h2>
          <p>A commissioned study is different and we will not describe it here in general terms: your inputs would leave your machine and come to ours. The handling terms belong in the engagement agreement, in writing, for that specific piece of work. See <a href="/data-use">data use</a>.</p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Your rights</h2>
          <p>You can ask us to export, correct or delete anything we hold about you by emailing <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>. We will respond within 30 days.</p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Subprocessors</h2>
          <ul><li>Supabase — authentication and database for this site (US/EU)</li><li>Vercel — website hosting (US)</li><li>Resend — transactional email (US)</li></ul>

          <h2 id="cookies" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0, scrollMarginTop: 96 }}>Cookies</h2>
          <p>This site uses only strictly necessary cookies. When you sign in, Supabase sets an HttpOnly, Secure, SameSite session cookie (<code>sb-*-auth-token</code>) so we can keep you logged in across pages. That&apos;s it — no advertising cookies, no analytics cookies, no third-party trackers, no cross-site identifiers.</p>
          <p>Because these cookies are strictly necessary to provide the service you requested, they&apos;re exempt from prior consent under GDPR and the ePrivacy Directive. You can clear them at any time from your browser&apos;s site settings; doing so will sign you out.</p>

          <p style={{ fontSize: 13, color: "var(--muted)" }}>© {COPYRIGHT_YEAR} {COMPANY_LEGAL} · {OFFICE_FULL}</p>
        </article>
      </Section>
      <Footer />
    </>
  );
}
