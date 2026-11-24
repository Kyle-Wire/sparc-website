import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";
import "@/components/commerce/commerce.css";

export const metadata: Metadata = {
  title: "Leave the waitlist",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string; done?: string }> };

// The link in every waitlist email lands here. Leaving takes a button press,
// so a mail scanner following the link cannot take anyone off the list.
export default async function LeaveWaitlistPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = (sp.token ?? "").slice(0, 64);
  const done = sp.done;

  return (
    <>
      <Nav active="pricing" />
      <main id="main">
        <PageHero kicker="the house report · waitlist" title="Leave the waitlist." lead="" accent="var(--flood)" />
        <div className="wrap buy-wrap">
          <section className="card buy-form" style={{ maxWidth: 620 }}>
            {done === "left" ? (
              <div className="buy-signin">
                <p>
                  <strong>You are off the list.</strong> We have deleted the address you gave us, and we will not email you
                  about it again. If you change your mind, you can <Link href="/report/buy">join again</Link>; you would join
                  at the back.
                </p>
              </div>
            ) : done === "unknown" ? (
              <div className="buy-signin">
                <p>
                  That link is not one we can find on the list. You may have left already. If you think this is wrong, write
                  to <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> and a person will sort it out.
                </p>
              </div>
            ) : done === "error" ? (
              <div className="buy-signin">
                <p>
                  Something went wrong on our side and nothing was changed. Please try again in a minute, or write to{" "}
                  <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a>.
                </p>
              </div>
            ) : (
              <form method="post" action="/api/reports/waitlist/leave" className="buy-signin">
                <input type="hidden" name="token" value={token} />
                <p>
                  Leaving gives your place to the next person and deletes the address you gave us. Nothing was ever
                  charged, so there is nothing to refund.
                </p>
                <button type="submit" className="btn">
                  Leave the waitlist
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
