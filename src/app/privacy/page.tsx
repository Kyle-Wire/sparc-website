import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, COPYRIGHT_YEAR } from "@/lib/brand";
import { checkoutEnabled } from "@/lib/payments";

export const metadata: Metadata = withPage("/privacy", {
  title: "Privacy",
  description: "What SPARC Labs keeps when you look up a place or order a report: an address you search is not kept, saved places stay in your browser, and nothing is sold or shared.",
});
export const dynamic = "force-dynamic";

// Rewritten 2026-11-18 for the site as it now runs.
//
// The page it replaces was written for a site with no address search, and two
// of its sentences had become false: it said the site ran no analytics, while
// the layout loads Vercel Web Analytics and Speed Insights (and the live site
// serves both scripts); and it said nothing about addresses, which the site
// now takes. This is a plain statement of what the code does, ahead of full
// terms, which Kyle has said come later.
//
// Every sentence below is checkable against the code or a publisher's page:
//   address handling     src/app/api/geocode/route.ts, src/lib/place/coords.ts,
//                        src/components/place/place-point.ts
//   map clicks           src/app/api/inspect/route.ts
//   saved places         src/components/place/saved-places.ts
//   map layers           src/components/place/PlaceMap.tsx, next.config.ts
//   contact form         src/app/api/waitlist/route.ts
//   analytics            src/app/layout.tsx; Vercel's statement that Web
//                        Analytics uses no third-party cookies and discards
//                        its visitor hash after 24 hours
//                        (vercel.com/docs/analytics/privacy-policy, read
//                        18 Nov 2026)
//
// If the code changes what happens to something a visitor gives us, this page
// changes in the same pull request.
//
// This has not been reviewed by counsel. It should be before anyone signs a
// contract or an E&O application that references it.

const h2 = { fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "10px 0 0" } as const;

export default function PrivacyPage() {
  const onSale = checkoutEnabled();
  return (
    <>
      <Nav />
      <main id="main">
      <PageHero
        kicker="privacy · plain english"
        title="What happens to what you give this site."
        lead="An address you type is used to find the block and is not kept. Pages and links carry the block, not the house. Here is all of it, item by item."
        accent="var(--purple)"
      />
      <Section>
        <article className="prose" style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 14, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7 }}>
          <h2 style={h2}>An address you type</h2>
          <p>
            It goes to our server, and from there to the US Census Bureau&apos;s geocoder, which turns it into a
            location. If the Census Bureau does not find it, our server asks Photon, a free search over OpenStreetMap run by komoot, instead. Only the
            address is sent, nothing else about you. We do not store it, log it or put it in a link. What comes back is rounded to about a
            block, and that block is what the page address carries.
          </p>
          <p>
            The exact point is sent back to your browser and kept there, for that tab only, so the map can
            mark the address for you. It is gone when you close the tab. Someone you send the link to sees
            the block and no mark.
          </p>

          <h2 style={h2}>A spot you click on the map</h2>
          <p>
            It goes to our server, which asks FEMA, the US Geological Survey and the national land cover
            server what they hold for that spot. We do not store it.
          </p>

          <h2 style={h2}>The place you are looking at</h2>
          <p>
            To fill a place page, our server asks public agencies about the block: the Census Bureau, FEMA,
            the US Geological Survey and the land cover server. Their answers are kept for a while so the
            next lookup of the same block is quick. They are kept by block, not by visitor.
          </p>
          <p>
            The map&apos;s pictures are different: your browser loads them straight from the US Geological
            Survey, FEMA, NOAA and the land cover server. Those agencies receive your internet address and
            the area of map you are looking at, as they would if you used their own map sites.
          </p>

          <h2 style={h2}>Saved places, notes and recently viewed</h2>
          <p>
            These stay in your browser. They are never sent to us. They hold the block, the name of its
            town, your note and a snapshot of that day&apos;s figures, and no address. Clearing your browsing
            data removes them, and so do the &quot;Remove&quot; and &quot;Clear this list&quot; buttons on{" "}
            <Link href="/places">Your places</Link>.
          </p>

          <h2 style={h2}>The contact form</h2>
          <p>
            What you write there (your name, email, organization if you give one, and your message) is
            stored in our database and emailed to us so we can reply, along with the kind of browser you
            used and the page you came from. You get an automatic email saying we have it. If you ask for a
            report we will need
            the real address of the property; we will ask for it by email, and how it is handled will be
            agreed in writing for that piece of work.
          </p>

          {onSale && (
            <>
              <h2 id="reports" style={h2}>Ordering a house report</h2>
              <p>
                A report is about one house, so this is the one place the site keeps a street address. When you order,
                we store the address you give, your note, your account and the order&apos;s progress in our database.
                Only you (signed in) and the person making your report can read it. It is not put in any link.
              </p>
              <p>
                Your card is saved by Stripe, on its own checkout page, which receives your email, your billing
                address and the card details you enter. We never see your card number. Stripe keeps the card so we
                can charge it once when your report is finished, uses your billing address to work out sales tax,
                and tells us whether the charge went through and the amount. Stripe sends your receipt. The finished
                report is stored privately and is downloaded through your account with a link that lasts a few
                minutes.
              </p>
              <p>
                We keep your order and report while you have an account, so you can download it again. Ask us at{" "}
                <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> to delete them sooner; payment records the law
                requires us to keep are kept for as long as it requires.
              </p>
            </>
          )}

          <h2 style={h2}>Counting visits</h2>
          <p>
            The site uses Vercel Web Analytics to count page views and Vercel Speed Insights to measure how
            fast pages load. Vercel says Web Analytics uses no third-party cookies and identifies a visit by
            a hash that is discarded after 24 hours. The count includes which pages were viewed. A place
            page&apos;s address holds a block, so a block can appear in that count; a street address cannot.
          </p>
          <p>
            To stop abuse, the server may also count requests from one internet address for a short time.
          </p>

          <h2 style={h2}>What we do not do</h2>
          <p>
            No advertising and no advertising trackers. We do not sell or share a list of visitors, addresses
            or places looked up, and we do not pass visitors to agents, lenders or insurers. We do not train
            anything on what you send us.
          </p>

          <h2 style={h2}>Accounts</h2>
          {onSale ? (
            <p>
              An account is needed only to order a house report, so the report has somewhere to live. We hold the email
              you sign up with, a password managed by Supabase (we never see it), a name if you give one, and your orders.
            </p>
          ) : (
            <p>
              Nothing on the site needs an account today. If you have one from before, we hold the email you
              signed up with and anything else you entered then, such as a name and organization.
            </p>
          )}

          <h2 style={h2}>Your rights</h2>
          <p>
            You can ask us to export, correct or delete anything we hold about you by emailing{" "}
            <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>. We will respond within 30 days.
          </p>

          <h2 style={h2}>Who else is involved</h2>
          <ul>
            <li>Vercel: hosts the website, and receives your internet address with each page you load, as any host does. Also the visit counting above.</li>
            <li>Supabase: the database for contact messages and accounts.</li>
            <li>Resend: sends the email that tells us a contact message has arrived{onSale ? ", and the emails about a report order" : ""}.</li>
            {onSale && <li>Stripe: saves your card for a report on its checkout page, charges it once when the report is finished, works out sales tax from your billing address, and sends the receipt. It receives your email, billing address and card details there.</li>}
            <li>US Census Bureau: receives an address you search for, from our server.</li>
            <li>komoot (Photon, OpenStreetMap search): receives an address you search for, from our server, only when the Census Bureau does not find it.</li>
            <li>FEMA, US Geological Survey, NOAA, the USDA soil survey (NRCS) and the national land cover server (MRLC): the sources of the records and map layers, as described above. A spot you click is sent to them, rounded to about a metre, and not stored.</li>
          </ul>

          <h2 id="cookies" style={{ ...h2, scrollMarginTop: 96 }}>Cookies and browser storage</h2>
          <p>
            The site sets no advertising or tracking cookies. If you sign in to an account, Supabase sets a
            session cookie (<code>sb-*-auth-token</code>) to keep you signed in; without an account there is
            no such cookie.
          </p>
          <p>
            Your browser&apos;s own storage holds three things, none of which leaves it: whether you have
            dismissed the cookie notice, your saved and recently viewed places, and, for one tab, the exact
            point of an address you searched.
          </p>

          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Written 18 November 2026 for the site as it runs today. {COMPANY} will change this page whenever
            the site changes what it does with something you give it. Full terms are still to come.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>© {COPYRIGHT_YEAR} {COMPANY_LEGAL} · {OFFICE_FULL}</p>
        </article>
      </Section>
      </main>
      <Footer />
    </>
  );
}
