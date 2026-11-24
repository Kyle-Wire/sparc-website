import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { parsePlaceSlug, placeSlug } from "@/lib/place/coords";
import { AGREE_STATEMENT, REPORT, checkoutEnabled, formatPrice, mayOrder, salesMode } from "@/lib/payments";
import { capacity, openInvite, waitingCount, type OpenInvite } from "@/lib/payments/capacity";
import { DEADLINE_WARNING, WAITLIST_ERRORS, expectedWeeks, waitNote, waitPhrase, INVITE_DAYS, type Capacity } from "@/lib/payments/waitlist";
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

type Props = {
  searchParams: Promise<{ place?: string; error?: string; joined?: string; tight?: string; wl_error?: string }>;
};

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
  const error = sp.error ? ORDER_ERRORS[sp.error] ?? ORDER_ERRORS.checkout : null;
  const today = todayEastern();
  const by = promisedBy(today, REPORT.deliveryDays);

  // The weekly cap (migration 0012, default 10): past it, buyers join the
  // waitlist before any card is saved. An open waitlist invite holds a place,
  // so its holder may order even when the week is full or sales are by
  // invitation.
  let cap: Capacity | null = null;
  let invite: OpenInvite | null = null;
  let waiting = 0;
  if (onSale) {
    try {
      const admin = createSupabaseAdminClient();
      [cap, invite, waiting] = await Promise.all([capacity(admin), openInvite(admin, email), waitingCount(admin)]);
    } catch {
      cap = null;
    }
  }
  const full = !!cap?.full && !invite;
  const allowed = mayOrder(email) || !!invite;
  const joined = sp.joined ?? null;
  const wlError = sp.wl_error ? WAITLIST_ERRORS[sp.wl_error as keyof typeof WAITLIST_ERRORS] ?? WAITLIST_ERRORS.save : null;
  const nextPosition = waiting + 1;
  const weeklyCap = cap?.cap ?? null;
  // Join the list when this week is full, or during the invitation-only launch
  // for anyone not invited.
  const showWaitlist = !joined && (full || (inviteOnly && !allowed));

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
              <div className="kicker">{showWaitlist || joined ? "the waitlist" : "your order"}</div>
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
              {joined ? (
                <JoinedNote joined={joined} tight={sp.tight === "1"} cap={weeklyCap} />
              ) : showWaitlist ? (
                <WaitlistForm
                  full={full}
                  cap={weeklyCap}
                  nextPosition={nextPosition}
                  email={email}
                  slug={slug}
                  today={today}
                  error={wlError}
                  signInHref={!email ? `/login?next=${encodeURIComponent(here)}` : null}
                />
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
                  {invite && (
                    <p className="buy-held" role="status">
                      <strong>Your place is held until {formatHold(invite.expiresAt)}.</strong> You came off the waitlist, so
                      this order goes ahead whatever else comes in this week.
                    </p>
                  )}
                  <label className="label" htmlFor="b-address">
                    The property&apos;s street address
                  </label>
                  <input
                    id="b-address"
                    name="address"
                    className="input"
                    defaultValue={invite?.address ?? undefined}
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

function formatHold(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

/** After joining: where they stand, in the same words as the email. */
function JoinedNote({ joined, tight, cap }: { joined: string; tight: boolean; cap: number | null }) {
  if (joined === "invited") {
    return (
      <div className="buy-signin" role="status">
        <p>
          <strong>You already have an invitation.</strong> Sign in, or make an account, with the email address we wrote to,
          and the order form opens here. We have updated the details you gave.
        </p>
      </div>
    );
  }
  const position = Math.max(1, Number.parseInt(joined, 10) || 1);
  return (
    <div className="buy-signin" role="status">
      <p className="buy-joined-h">
        <strong>You are on the list.</strong>
      </p>
      <p>{waitNote(position, cap)}</p>
      {tight && (
        <p>
          <strong>{DEADLINE_WARNING}</strong>
        </p>
      )}
      <p>We have sent the same to your email, with a link to leave the list. Nothing was charged and no card was asked for.</p>
    </div>
  );
}

/** The waitlist form: no account and no card needed. */
function WaitlistForm({
  full,
  cap,
  nextPosition,
  email,
  slug,
  today,
  error,
  signInHref,
}: {
  full: boolean;
  cap: number | null;
  nextPosition: number;
  email: string | null;
  slug: string | null;
  today: string;
  error: string | null;
  signInHref: string | null;
}) {
  const weeks = expectedWeeks(nextPosition, cap);
  return (
    <form method="post" action="/api/reports/waitlist" className="buy-fields">
      {slug && <input type="hidden" name="place" value={slug} />}
      <div className="buy-full" role="status">
        {full ? (
          <p>
            <strong>This week is full.</strong> We take up to {cap} reports a week, because a person reads every one before
            it leaves, and this week&apos;s places are taken. Rather than take your order and miss our promise, we put you
            on a list and invite you in the order you joined.
          </p>
        ) : (
          <p>
            <strong>Reports are by invitation for now.</strong> We are starting with a few buyers, each report run and read by
            hand. Join the list and we invite people in the order they joined.
          </p>
        )}
        <p className="buy-wait">
          {nextPosition === 1 ? "Nobody is ahead of you." : `${nextPosition - 1} ${nextPosition === 2 ? "person is" : "people are"} ahead of you.`}{" "}
          At our current pace that is <strong>{waitPhrase(weeks)}</strong> before we invite you. That is an estimate, not a
          promise. Once invited you have {INVITE_DAYS} days to order. Nothing is charged to join.
        </p>
      </div>
      {error && (
        <p className="journey-error" role="alert">
          {error}
        </p>
      )}
      <label className="label" htmlFor="w-name">Your name</label>
      <input id="w-name" name="name" className="input" required maxLength={200} autoComplete="name" />
      <label className="label" htmlFor="w-email">Email</label>
      <input
        id="w-email"
        name="email"
        type="email"
        className="input"
        required
        maxLength={320}
        autoComplete="email"
        defaultValue={email ?? undefined}
      />
      <label className="label" htmlFor="w-address">The property&apos;s street address</label>
      <input
        id="w-address"
        name="address"
        className="input"
        required
        minLength={5}
        maxLength={300}
        autoComplete="street-address"
        placeholder="Number, street, city, state"
      />
      <p className="buy-hint">
        We keep it only to run your report, and only the person running it can see it. Leave the list and we delete it.
      </p>
      <label className="label" htmlFor="w-deadline">When does your inspection period end? (optional)</label>
      <input id="w-deadline" name="inspection_deadline" type="date" className="input" min={today} />
      <p className="buy-hint">If the wait will probably miss it, we tell you straight away, so you can look elsewhere.</p>
      <label className="label" htmlFor="w-note">What are you trying to decide? (optional)</label>
      <textarea id="w-note" name="note" className="input" maxLength={2000} style={{ minHeight: 70, resize: "vertical" }} />
      <button type="submit" className="btn btn-accent buy-submit">
        Join the waitlist <span className="arrow">→</span>
      </button>
      {signInHref && (
        <p className="buy-hint">
          Already invited? <Link href={signInHref as Route}>Sign in</Link> with the email we wrote to.
        </p>
      )}
    </form>
  );
}
