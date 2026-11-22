import type { Route } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, REPORT, checkoutEnabled } from "@/lib/payments";
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
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
}

const STEPS = ["Ordered", "Paid", "Being modelled", "Ready"] as const;
const REACHED: Record<string, number> = {
  awaiting_payment: 0,
  abandoned: 0,
  paid: 1,
  in_progress: 2,
  delivered: 3,
  cannot_model: 2,
  refunded: 1,
};

function words(o: Order, justPaid: boolean): string {
  switch (o.status) {
    case "awaiting_payment":
      return justPaid
        ? "Your payment is being confirmed. This usually takes a few seconds: refresh the page."
        : "Not paid. Nothing was charged. You can order again any time.";
    case "abandoned":
      return "The checkout did not open, so nothing was charged.";
    case "paid":
      return `Paid. A person checks what can be modelled at this place next. Your report arrives within ${REPORT.deliveryDays} working days of payment, or your money back.`;
    case "in_progress":
      return "We are running the models for this place.";
    case "delivered":
      return "Your report is ready.";
    case "cannot_model":
      return "We could not make this report, so your payment is being refunded in full.";
    case "refunded":
      return "Refunded in full.";
    default:
      return o.status;
  }
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const { paid } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let orders: Order[] = [];
  let failed = false;
  try {
    const { data, error } = await supabase
      .from("report_orders")
      .select("id,status,address,place_slug,price_cents,amount_paid_cents,currency,receipt_url,test_mode,status_note,created_at,paid_at,delivered_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    // An order whose checkout was never finished is shown only right after checkout, never as clutter.
    orders = (data ?? []).filter((o: Order) => o.status !== "abandoned" && (o.status !== "awaiting_payment" || o.id === paid));
  } catch {
    failed = true;
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
        {failed && (
          <p className="journey-error" role="alert">
            We could not load your orders just now. Nothing about them has changed; please refresh in a minute.
          </p>
        )}
      </div>

      {orders.map((o) => {
        const reached = REACHED[o.status] ?? 0;
        const amount = formatPrice(o.amount_paid_cents ?? o.price_cents, o.currency);
        return (
          <article key={o.id} className="card order" aria-label={`Report for ${o.address}`}>
            <div className="order-head">
              <h3>{o.address}</h3>
              <span className="row" style={{ gap: 8 }}>
                {o.test_mode && (
                  <span className="pill" data-state="test">
                    test mode · no money moved
                  </span>
                )}
                <span className="pill">{o.status.replace("_", " ")}</span>
              </span>
            </div>
            <div className="order-meta mono">
              Ordered {date(o.created_at)}
              {o.paid_at ? ` · paid ${amount} on ${date(o.paid_at)}` : ""}
              {o.delivered_at ? ` · ready ${date(o.delivered_at)}` : ""} · ref {o.id.slice(0, 8)}
            </div>
            <ol className="order-steps" aria-label="Progress">
              {STEPS.map((s, i) => (
                <li key={s} data-on={i <= reached && o.status !== "refunded" ? "true" : undefined}>
                  {s}
                </li>
              ))}
            </ol>
            <p className="order-note">{words(o, o.id === paid)}</p>
            {o.status_note && <p className="order-note">{o.status_note}</p>}
            <div className="order-actions">
              {o.status === "delivered" && (
                <a className="btn btn-accent" href={`/api/reports/${o.id}/download`}>
                  Download the report <span className="arrow">→</span>
                </a>
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
