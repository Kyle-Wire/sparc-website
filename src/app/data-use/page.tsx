import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, EMAIL_PRIMARY } from "@/lib/brand";

export const metadata = { title: "Data Use" };

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
// A data-handling statement must name the delivery mode it applies to. Do not
// put one in a philosophy tile, a hero lead or a badge, where it reads as a
// property of the company and cannot carry its own scope.

export default function DataUsePage() {
  return (
    <>
      <Nav />
      <PageHero kicker="data use · explicit" title="What happens to your data." accent="var(--amber)" />
      <Section>
        <article className="prose">
          <p>
            {COMPANY} is not selling or distributing software today, so there is no
            installed application sending us anything. This page says what is
            actually true right now rather than describing a product that does not
            exist yet. It will be replaced with a real statement, per delivery
            mode, before anyone receives software or commissions a study.
          </p>

          <h2>This website</h2>
          <p>
            If you contact us through this site, we receive what you type and your
            email address, and we use it to reply. The site sets a session cookie
            only if you sign in. There is no advertising, analytics or third-party
            tracking. Hosting is Vercel; transactional email is Resend.
          </p>

          <h2>If we run a study for you</h2>
          <p>
            This is the route we can actually offer today, and it is important to
            be plain about it: <strong>your inputs leave your machine.</strong> You
            send us an area and the data you want used, we process it on our own
            workstation, and we send back a signed-off package. We have not yet
            published how long we keep that material, who can see it, or how it is
            deleted — so if you are considering an engagement, ask us and we will
            answer in writing as part of the agreement rather than by website copy.
          </p>

          <h2>Local compute, when there is software to install</h2>
          <p>
            Our models are built to run on the machine of whoever is using them —
            that is a deliberate design choice and the reason municipal data never
            has to be uploaded to us. It is a property of the software, not a
            promise about a study we run for you, and the two should never be
            quoted interchangeably.
          </p>

          <h2>Questions</h2>
          <p>
            Email <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>. If a
            procurement process needs a data-handling schedule, say so and we will
            write one for the specific engagement.
          </p>
        </article>
      </Section>
      <Footer />
    </>
  );
}
