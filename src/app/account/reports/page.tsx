import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ordersWithPackage } from "@/lib/payments/package";
import { versionsByOrder, type Version } from "@/lib/payments/versions";
import { formatPrice, REPORT, checkoutEnabled } from "@/lib/payments";
import { mayCancel, orderDates } from "@/lib/payments/self-serve";
import { formatDay } from "@/lib/payments/turnaround";
import "@/components/commerce/commerce.css";

export const dynamic = "force-dynamic";

interface Order {
  id: string;
  status: string;
  address: string;
  place_slug: string | null;
  price_cents: number;
  amount_paid_cents: number | null;
  currency: string;
  receipt_url: string | null;
  test_mode: boolean | null;
  status_note: string | null;
  charge_error: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  inspection_deadline: string | null;
  card_saved_at: string | null;
}

// The card is charged when the report is ready (Kyle, 22 November 2026), so
// "Paid" comes last, together with "Ready".
const STEPS = ["Ordered", "Being modelled", "Paid and ready"] as const;
const REACHED: Record<string, number> = {
  awaiting_card: -1,
  abandoned: -1,
  card_saved: 0,
  in_progress: 1,
  charging: 1,
  payment_failed: 1,
  cannot_model: 0,
  cancelled: 0,
  delivered: 2,
  refunded: 2,
};
const LABEL: Record<string, string> = {
  awaiting_card: "not ordered",
  card_saved: "ordered",
  in_progress: "being modelled",
  charging: "finishing",
  payment_failed: "ready to pay",
  delivered: "ready",
  cannot_model: "could not model",
  cancelled: "cancelled",
  refunded: "refunded",
};

function words(o: Order, justOrdered: boolean, justPaid: boolean): string {
  const price = formatPrice(o.price_cents, o.currency);
  switch (o.status) {
    case "awaiting_card":
      return justOrdered
        ? "Your card is being confirmed. This usually takes a few seconds: refresh the page."
        : "Not ordered: the card was not saved. Nothing was charged. You can order again any time.";
    case "card_saved":
      return `Ordered. Nothing has been charged. A person checks what can be modelled at this place next. When the report is ready, within ${REPORT.deliveryDays} working days, we charge your card ${price} plus any sales tax and the report opens here. If we cannot make it, we charge nothing.`;
    case "in_progress":
      return `We are running the models for this place. Nothing has been charged yet.`;
    case "charging":
      return "Your report is finished and your card is being charged. This takes a few seconds: refresh the page.";
    case "payment_failed":
      return justPaid
        ? "Your payment is being confirmed. This usually takes a few seconds: refresh the page."
        : `Your report is finished, but the card you saved did not go through${o.charge_error ? ` (your bank said: “${o.charge_error}”)` : ""}. Pay ${price} plus any sales tax below, with this card or another, and the report opens straight away.`;
    case "delivered":
      return "Your report is ready.";
    case "cannot_model":
      return "We could not make this report, so nothing was charged, and the saved card has been removed.";
    case "cancelled":
      return "Cancelled. Nothing was charged, and the saved card has been removed.";
    case "refunded":
      return "Refunded in full.";
    default:
      return o.status;
  }
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ ordered?: string; paying?: string; error?: string; cancelled?: string }>;
}) {
  const { ordered, paying, error: payError, cancelled } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let orders: Order[] = [];
  let failed = false;
  try {
    const { data, error } = await supabase
      .from("report_orders")
      .select("id,status,address,place_slug,price_cents,amount_paid_cents,currency,receipt_url,test_mode,status_note,charge_error,created_at,paid_at,delivered_at,inspection_deadline,card_saved_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    // An order whose card was never saved is shown only right after checkout, never as clutter.
    orders = (data ?? []).filter((o: Order) => o.status !== "abandoned" && (o.status !== "awaiting_card" || o.id === ordered));
  } catch {
    failed = true;
  }

  // Which delivered orders have the offline atlas yet (one listing of the
  // buyer's own folder). If storage is unreachable, only the PDF is offered.
  // The same listing gives each report's versions (updates, v1.1 and on).
  let withPackage = new Set<string>();
  let versions = new Map<string, Version[]>();
  if (orders.some((o) => o.status === "delivered")) {
    try {
      const { data: files } = await createSupabaseAdminClient().storage.from("reports").list(user.id, { limit: 1000 });
      const names = (files ?? []).map((f) => f.name);
      withPackage = ordersWithPackage(names);
      versions = versionsByOrder(names);
    } catch {
      /* the PDF is still offered */
    }
  }

  return (
    <div className="orders">
      <div className="card" style={{ padding: 24 }}>
        <div className="kicker">your reports</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
          {orders.length ? "House reports" : "No reports yet"}
        </h2>
        {!orders.length && !failed && (
          <p style={{ color: "var(--ink-2)", margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>
            A house report models flood and heat for one house and the streets around it.{" "}
            {checkoutEnabled() ? <Link href="/report/buy">Order one</Link> : <Link href="/start">Ask for one</Link>}, or{" "}
            <Link href="/report/sample">see how a report is laid out</Link>.
          </p>
        )}
        {payError === "pay" && (
          <p className="journey-error" role="alert">
            The payment page did not open. Nothing was charged; please try again in a minute.
          </p>
        )}
        {payError === "cancel" && (
          <p className="journey-error" role="alert">
            The order could not be cancelled just now. Nothing has been charged; please try again in a minute, or reply to
            your order email and we will cancel it for you.
          </p>
        )}
        {payError === "cancel-late" && (
          <p className="journey-error" role="alert">
            This order can no longer be cancelled here, because the report is finished or being charged. Reply to your
            order email and a person will sort it out with you.
          </p>
        )}
        {cancelled && (
          <p className="order-done" role="status">
            Cancelled. Nothing was charged, and your saved card has been removed.
          </p>
        )}
        {failed && (
          <p className="journey-error" role="alert">
            We could not load your orders just now. Nothing about them has changed; please refresh in a minute.
          </p>
        )}
      </div>

      {orders.map((o) => {
        const reached = REACHED[o.status] ?? 0;
        const amount = formatPrice(o.amount_paid_cents ?? o.price_cents, o.currency);
        const off = ["refunded", "cannot_model", "cancelled"].includes(o.status);
        return (
          <article key={o.id} className="card order" aria-label={`Report for ${o.address}`}>
            <div className="order-head">
              <h3>{o.address}</h3>
              <span className="row" style={{ gap: 8 }}>
                {o.test_mode && (
                  <span className="pill" data-state="test">
                    test mode · no real money
                  </span>
                )}
                <span className="pill" data-state={o.status === "payment_failed" ? "attention" : undefined}>
                  {LABEL[o.status] ?? o.status.replace("_", " ")}
                </span>
              </span>
            </div>
            <div className="order-meta mono">
              Ordered {date(o.created_at)}
              {o.paid_at ? ` · paid ${amount} on ${date(o.paid_at)}` : ""}
              {o.delivered_at ? ` · ready ${date(o.delivered_at)}` : ""} · ref {o.id.slice(0, 8)}
            </div>
            <ol className="order-steps" aria-label="Progress">
              {STEPS.map((s, i) => (
                <li key={s} data-on={i <= reached && !off ? "true" : undefined}>
                  {s}
                </li>
              ))}
            </ol>
            <p className="order-note">{words(o, o.id === ordered, o.id === paying)}</p>
            {(o.status === "card_saved" || o.status === "in_progress") && (() => {
              // The promise counts from when the card was saved, as in scripts/report-order.ts list.
              const d = orderDates(o.card_saved_at ?? o.created_at, o.inspection_deadline, REPORT.deliveryDays);
              return (
                <p className="order-note">
                  <strong>Ready by {formatDay(d.promised)}</strong> at the latest.
                  {d.deadline && !d.tight && <> Your inspection period ends {formatDay(d.deadline)}.</>}
                  {d.tight && (
                    <> Your inspection period ends {formatDay(d.deadline!)}, before that. We put orders with the nearest
                    deadline first, and we will email you if we cannot make it.</>
                  )}
                </p>
              );
            })()}
            {o.status_note && <p className="order-note">{o.status_note}</p>}
            {o.status === "delivered" && withPackage.has(o.id) && (
              <p className="order-note">
                The zip holds the atlas, print plates and data files. Unzip it and open START-HERE.html: it works with no
                internet.
              </p>
            )}
            {o.status === "delivered" && (versions.get(o.id)?.length ?? 0) > 1 && (
              <p className="order-note">
                Updated since delivery. Every version stays here, and each update says on its first page what changed:{" "}
                {versions.get(o.id)!.map((v, i, all) => (
                  <React.Fragment key={v.label}>
                    <a href={`/api/reports/${o.id}/download?v=${v.label}`}>v{v.label}</a>
                    {i < all.length - 1 ? " · " : ""}
                  </React.Fragment>
                ))}
                .
              </p>
            )}
            <div className="order-actions">
              {o.status === "payment_failed" && (
                <form method="post" action={`/api/reports/${o.id}/pay`}>
                  <button type="submit" className="btn btn-accent">
                    Pay and open the report <span className="arrow">→</span>
                  </button>
                </form>
              )}
              {o.status === "delivered" && (() => {
                const latest = versions.get(o.id)?.at(-1);
                return latest && latest.label !== "1.0" ? (
                  <a className="btn btn-accent" href={`/api/reports/${o.id}/download?v=${latest.label}`}>
                    Download the report, v{latest.label} <span className="arrow">→</span>
                  </a>
                ) : (
                  <a className="btn btn-accent" href={`/api/reports/${o.id}/download`}>
                    Download the report <span className="arrow">→</span>
                  </a>
                );
              })()}
              {o.status === "delivered" && withPackage.has(o.id) && (
                <a className="btn btn-sm" href={`/api/reports/${o.id}/download?file=package`}>
                  Download the offline atlas, prints and data (zip)
                </a>
              )}
              {mayCancel(o.status) && (
                <details className="order-cancel">
                  <summary>Cancel this order</summary>
                  <form method="post" action={`/api/reports/${o.id}/cancel`}>
                    <p className="order-note">
                      Nothing has been charged and nothing will be. We stop work and remove your saved card. You can
                      order again later.
                    </p>
                    <button type="submit" className="btn btn-sm">Yes, cancel the order</button>
                  </form>
                </details>
              )}
              {o.place_slug && (
                <Link className="btn btn-sm" href={(`/place/${o.place_slug}`) as Route}>
                  The public record here
                </Link>
              )}
              {o.receipt_url && (
                <a className="btn btn-sm btn-ghost" href={o.receipt_url} rel="noopener noreferrer" target="_blank">
                  Receipt
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
