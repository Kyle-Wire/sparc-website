import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";

// A wrong or old link should still leave the reader one step from what they came for.
export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main">
        <PageHero
          kicker="404 · page not found"
          title="We could not find that page."
          lead="The link may be old, or the address may have a typo. Nothing about your place or your order has changed."
        />
        <section className="wrap" style={{ padding: "32px var(--wrap-pad) 72px" }}>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-accent" href="/">Look up a place</Link>
            <Link className="btn btn-ghost" href="/report/sample">See a sample report</Link>
            <Link className="btn btn-ghost" href="/faq">Questions</Link>
            <Link className="btn btn-ghost" href="/contact">Write to us</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
