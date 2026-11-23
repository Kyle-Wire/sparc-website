/**
 * Emails that follow an order's move: the buyer's note, and one line to the
 * inbox (WAITLIST_NOTIFY_EMAIL, the same inbox as the contact form) so a
 * person knows what to do next. Both are best effort; the order has already
 * moved when these run. Used by the webhook and by scripts/report-order.ts.
 *
 *   card_saved      the order is in, nothing charged     buyer + inbox
 *   delivered       charged, report unlocked             buyer + inbox
 *   payment_failed  report done, card did not go through buyer + inbox
 *   refunded        refunded in full                     inbox
 *   cancelled       the buyer cancelled from the account inbox (stop work)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/brand";
import { REPORT, formatPrice } from "./catalog";
import type { Notice } from "./webhook";

interface OrderRow {
  id: string;
  user_id: string;
  address: string;
  amount_paid_cents: number | null;
  price_cents: number;
  currency: string;
  receipt_url: string | null;
  test_mode: boolean | null;
  needs_review: string | null;
  place_slug: string | null;
  status_note: string | null;
  charge_error: string | null;
}

const NEXT: Record<Notice, (id: string) => string | null> = {
  card_saved: (id) => `Next: npx tsx scripts/report-order.ts start ${id}`,
  delivered: () => null,
  payment_failed: () => "The buyer has been asked to pay from their account. Nothing to do unless they write.",
  refunded: () => null,
  cancelled: () => "The buyer cancelled from their account: stop work on it. Nothing is charged. The site removes the saved card; if it is still on the Stripe customer, remove it there.",
};

export async function notifyReportEvent(admin: SupabaseClient, orderId: string, what: Notice, opts: { site?: string } = {}) {
  const { data: o } = await admin
    .from("report_orders")
    .select("id,user_id,address,amount_paid_cents,price_cents,currency,receipt_url,test_mode,needs_review,place_slug,status_note,charge_error")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (!o) return;
  const { data: u } = await admin.auth.admin.getUserById(o.user_id);
  const email = u?.user?.email;
  const price = formatPrice(o.price_cents, o.currency);
  const paid = o.amount_paid_cents !== null ? formatPrice(o.amount_paid_cents, o.currency) : null;
  const accountUrl = `${opts.site ?? SITE_URL}/account/reports`;
  const testMode = o.test_mode === true;

  if (email && what === "card_saved") {
    await sendEmail({
      to: email,
      template: "report-order-received",
      props: { address: o.address, amount: price, deliveryDays: REPORT.deliveryDays, accountUrl, testMode },
      refId: `report-ordered-${o.id}`,
    });
  } else if (email && what === "delivered") {
    await sendEmail({
      to: email,
      template: "report-delivered",
      props: { address: o.address, accountUrl, note: o.status_note ?? undefined, amount: paid ?? undefined, receiptUrl: o.receipt_url ?? undefined, testMode },
      refId: `report-delivered-${o.id}`,
    });
  } else if (email && what === "payment_failed") {
    await sendEmail({
      to: email,
      template: "report-payment-needed",
      props: { address: o.address, amount: price, reason: o.charge_error ?? "The card was declined.", accountUrl, testMode },
      refId: `report-payment-needed-${o.id}`,
    });
  }

  const inbox = process.env.WAITLIST_NOTIFY_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (inbox && key) {
    const label = { card_saved: "ordered (card saved, nothing charged)", delivered: "paid and delivered", payment_failed: "ready but the card failed", refunded: "refunded", cancelled: "cancelled by the buyer" }[what];
    const lines = [
      `House report ${label}${testMode ? " (TEST MODE, no money moved)" : ""}`,
      `Order: ${o.id}`,
      `Buyer: ${email ?? "(unknown)"}`,
      `Address: ${o.address}`,
      `Block: ${o.place_slug ?? "not given"}`,
      paid ? `Charged: ${paid}` : `Price: ${price} plus tax`,
      o.charge_error && what === "payment_failed" ? `Card said: ${o.charge_error}` : null,
      o.needs_review ? `REVIEW: ${o.needs_review}` : null,
      NEXT[what](o.id),
    ].filter(Boolean);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SPARC Labs <hello@sparclabs.co>",
        to: [inbox],
        subject: `${testMode ? "[TEST] " : ""}House report ${label}: ${o.address}`,
        text: lines.join("\n"),
      }),
    });
  }
}
