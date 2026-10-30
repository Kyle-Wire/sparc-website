import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";

export const metadata = { title: "Download SPARC" };

// Corrected 2026-10-30. The disabled "Coming soon" buttons were honest. Almost
// nothing around them was:
//
//   "Sign in with the email you used here and your license activates
//   automatically" — there is no licensing system. Nothing in the estate reads
//   a licence key or activates anything (SPA-11 found no entitlement
//   enforcement anywhere).
//
//   "Builds will appear here when the beta opens" — there is no beta and no
//   date. Five specific filenames with version numbers implied five artefacts
//   exist and are waiting to be published. None of them has ever been built
//   for release.
//
//   "Wired network for sidecar telemetry" — no telemetry exists, and /privacy
//   now correctly states that nothing is emitted.
//
//   The system requirements were specific (8 GB / 32 GB / 64 GB, CUDA 11.8,
//   20 GB / 100 GB / 1 TB) for software that has never been installed by anyone
//   outside the owner's machine, so none of it has been measured.
//
// Do not restore a filename, a version or a requirement figure here until a
// build exists and someone has run it on a machine that is not the owner's.

export default function DownloadPage() {
  return (
    <>
      <Nav active="download" />
      <PageHero
        kicker="download · nothing to download yet"
        title="There is no build to give you."
        lead="We would rather say that plainly than keep a download page that implies otherwise. Here is where delivery actually stands, and what we can do for you today instead."
        accent="var(--gold)"
      />

      <Section>
        <article style={{ maxWidth: 760, display: "grid", gap: 18, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7 }}>
          <p>
            This page used to list five installers with filenames and version
            numbers behind &ldquo;Coming soon&rdquo; buttons, and told you your licence
            would activate automatically when you signed in. The buttons were
            accurate. The rest was not: no installer has been built for release,
            and there is no licensing system to activate anything.
          </p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>What we can do today</h2>
          <p>
            Run the work ourselves and hand you the results — the outputs, the
            record of the run behind them, and the limits stated alongside. That
            is a real offering and it is how the one program that has reached users
            outside the company was delivered.{" "}
            <Link href="/demo" style={{ color: "var(--accent)" }}>Tell us what you are trying to decide</Link>.
          </p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>What we are building towards</h2>
          <p>
            Software that runs on your machine, so your data never has to leave
            it, installed by one double-click and shipped as a versioned,
            checksummed package you can verify. We are not going to put a date on
            that here, because we do not have one we would stand behind.
          </p>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>System requirements</h2>
          <p>
            We have taken these down rather than guess. The previous figures were
            never measured on a machine other than the developer&apos;s, and
            publishing requirements for software nobody outside the company has
            installed is how a procurement reviewer ends up planning around a
            number we invented. They will be published when the first install on
            someone else&apos;s hardware has happened.
          </p>
        </article>
      </Section>

      <Section sunken kicker="in the meantime" title="Talk to us about a pilot.">
        <Link href="/demo" className="btn btn-accent">Request access →</Link>
      </Section>

      <Footer />
    </>
  );
}
