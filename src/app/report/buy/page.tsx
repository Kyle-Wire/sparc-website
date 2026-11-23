import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { parsePlaceSlug, placeSlug } from "@/lib/place/coords";
import { AGREE_STATEMENT, REPORT, checkoutEnabled, formatPrice, mayOrder, salesMode } from "@/lib/payments";
import { atCapacity } from "@/lib/payments/capacity";
import { formatDay, promisedBy, todayEastern } from "@/lib/payments/turnaround";
import { DeadlineField } from "@/components/commerce/DeadlineField";
import { HouseFactsField } from "@/components/commerce/HouseFactsField";
import { EMAIL_PRIMARY } from "@/lib/brand";
import { ORDER_ERRORS } from "@/lib/payments/order-input";
import "@/components/commerce/commerce.css";

export const metadata: Metadata = {
  title: "Order the house report",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ place?: string; error?: string }> };

// The one page where the report is bought. Built to the map-first brief §7:
// no countdowns, no scarcity, nothing pre-ticked, the sample one click away,
// and what the report is NOT shown beside the price rather than under it.
export default async function BuyReportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const p = sp.place ? parsePlaceSlug(sp.place) : null;
  const slug = p ? placeSlug(p) : null;
  const here = `/report/buy${slug ? `?place=${slug}` : ""}`;
  const onSale = checkoutEnabled();

  let email: string | null = null;
  if (onSale) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }
  }
  const inviteOnly = salesMode() === "invite";
  const allowed = mayOrder(email);
  const error = sp.error ? ORDER_ERRORS[sp.error] ?? ORDER_ERRORS.checkout : null;
  const today = todayEastern();
  const by = promisedBy(today, REPORT.deliveryDays);

  // Weekly cap (ORDERS_WEEKLY_CAP): say "not this week" before a card is saved.
  let full = false;
  if (onSale && email && allowed) {
    try {
      full = await atCapacity(createSupabaseAdminClient());
    } catch {
      full = false;
    }
  }

  return (
    <>
      <Nav active="pricing" />
      <main id="main">
      <PageHero
        kicker={onSale ? "the house report · bought once" : "the house report · not on sale yet"}
        title={onSale ? "Order the house report." : "The house report is not on sale yet."}
        lead={REPORT.tagline}
        accent="var(--flood)"
      />
      <div className="wrap buy-wrap">
        {!onSale ? (
          <div className="screening-note">
            <strong>Nothing can be bought here yet.</strong> Until it can, a report is run by hand when someone asks.{" "}
            <Link href={slug ? `/start?place=${slug}` : "/start"}>Ask for a report</Link> and a person will reply.
          </div>
        ) : (
          <div className="buy-grid">
            <section className="card buy-form" aria-labelledby="buy-form-h">
              <div className="kicker">your order</div>
              <h2 id="buy-form-h">{REPORT.name}</h2>
              <p className="buy-price">
                <span className="buy-price-figure">{formatPrice(REPORT.priceCents)}</span>
                <span className="buy-price-unit">once, for one house</span>
              </p>
              {error && (
                <p className="journey-error" role="alert">
                  {error}
                </p>
              )}
              {inviteOnly && (
                <p className="buy-hint" style={{ marginTop: 0 }}>
                  Open by invitation for now: a first few buyers, each report run and read by hand, before anyone can
                  order.
                </p>
              )}
              {email && allowed && full ? (
                <div className="buy-signin">
                  <p>
                    We have as many reports as we can make well this week, so we are not taking new orders for a few
                    days. Every report is read by a person before it leaves, and we would rather say so now than miss
                    our promise later. Write to{" "}
                    <a href={`mailto:${EMAIL_PRIMARY}?subject=${encodeURIComponent("House report: when can you start?")}`}>{EMAIL_PRIMARY}</a>{" "}
                    with the property and your deadline, and we will tell you when we can start. Nothing is charged.
                  </p>
                </div>
              ) : email && !allowed ? (
                <div className="buy-signin">
                  <p>
                    This account ({email}) is not on the invitation list yet. Write to{" "}
                    <a href={`mailto:${EMAIL_PRIMARY}?subject=${encodeURIComponent("House report invitation")}`}>{EMAIL_PRIMARY}</a>{" "}
                    with the property you are deciding on, or{" "}
                    <Link href={slug ? `/start?place=${slug}` : "/start"}>ask for a report</Link>, and a person will reply.
                    Nothing is charged.
                  </p>
                </div>
              ) : !email ? (
                <div className="buy-signin">
                  <p>
                    Your report lives in your account, so you can come back to it, download it again and see where your
                    order is. Make one first: it takes a minute.
                  </p>
                  <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn btn-accent" href={(`/signup?next=${encodeURIComponent(here)}`) as Route}>
                      Create an account <span className="arrow">→</span>
                    </Link>
                    <Link className="btn" href={(`/login?next=${encodeURIComponent(here)}`) as Route}>
                      Sign in
                    </Link>
                  </div>
                </div>
              ) : (
                <form method="post" action="/api/reports/order" className="buy-fields">
                  {slug && <input type="hidden" name="place" value={slug} />}
                  <label className="label" htmlFor="b-address">
                    The property&apos;s street address
                  </label>
                  <input
                    id="b-address"
                    name="address"
                    className="input"
                    required
                    minLength={5}
                    maxLength={300}
                    autoComplete="street-address"
                    placeholder="Number, street, city, state"
                  />
                  <p className="buy-hint">
                    A report is about one house, so this is the one place we keep an address. Only you and the person
                    running your report can see it.
                  </p>
                  <label className="label" htmlFor="b-note">
                    What are you trying to decide? (optional)
                  </label>
                  <textarea
                    id="b-note"
                    name="note"
                    className="input"
                    maxLength={2000}
                    style={{ minHeight: 84, resize: "vertical" }}
                    placeholder="For example: we close in three weeks and want to know which side of the house gets water."
                  />
                  <HouseFactsField thisYear={Number(today.slice(0, 4))} />
                  <DeadlineField
                    today={today}
                    promisedBy={by}
                    promisedByText={formatDay(by)}
                    workingDays={REPORT.deliveryDays}
                    email={EMAIL_PRIMARY}
                  />
                  <label className="buy-agree">
                    <input type="checkbox" name="agree" value="yes" required />
                    <span>{AGREE_STATEMENT}</span>
                  </label>
                  <button type="submit" className="btn btn-accent buy-submit">
                    Save a card and order <span className="arrow">→</span>
                  </button>
                  <p className="buy-hint">
                    <strong>Nothing is charged today.</strong> You save a card on Stripe&apos;s secure page. When your
                    report is ready, we charge it {formatPrice(REPORT.priceCents)} plus any sales tax, and the report
                    opens in your account. Signed in as <span className="mono">{email}</span>; we never see your card.
                  </p>
                </form>
              )}
            </section>

            <aside className="buy-side">
              <div className="card buy-panel">
                <div className="kicker">what you get</div>
                <ul>
                  {REPORT.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <Link href="/report/sample">See how a report is laid out →</Link>
              </div>
              <div className="card buy-panel">
                <div className="kicker">what it is not</div>
                <ul>
                  {REPORT.isNot.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card buy-panel buy-promise">
                <div className="kicker">our promise</div>
                <p>
                  <strong>
                    You pay when your report is ready, within {REPORT.deliveryDays} working days, or not at all.
                  </strong>{" "}
                  We check what can be modelled at your place before we start. If something cannot be, we tell you;
                  if the report cannot be made at all, we charge nothing. Changed your mind before it is ready? Cancel
                  from your account in two clicks and we charge nothing. <Link href="/terms#reports">The terms</Link>
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
      </main>
      <Footer />
    </>
  );
}
