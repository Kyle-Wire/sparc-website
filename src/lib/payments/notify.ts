/**
 * Emails that follow an order's move: the buyer's note when a payment lands,
 * and one line to the inbox (WAITLIST_NOTIFY_EMAIL, the same inbox as the
 * contact form) so a person starts on it. Both are best effort; the order has
 * already moved when these run.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/brand";
import { REPORT, formatPrice } from "./catalog";

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
}

export async function notifyReportEvent(admin: SupabaseClient, orderId: string, what: "paid" | "refunded") {
  const { data: o } = await admin
    .from("report_orders")
    .select("id,user_id,address,amount_paid_cents,price_cents,currency,receipt_url,test_mode,needs_review,place_slug")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (!o) return;
  const { data: u } = await admin.auth.admin.getUserById(o.user_id);
  const email = u?.user?.email;
  const amount = formatPrice(o.amount_paid_cents ?? o.price_cents, o.currency);
  const accountUrl = `${SITE_URL}/account/reports`;

  if (what === "paid" && email) {
    await sendEmail({
      to: email,
      template: "report-order-received",
      props: {
        address: o.address,
        amount,
        deliveryDays: REPORT.deliveryDays,
        accountUrl,
        receiptUrl: o.receipt_url ?? undefined,
        testMode: o.test_mode === true,
      },
      refId: `report-paid-${o.id}`,
    });
  }

  const inbox = process.env.WAITLIST_NOTIFY_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (inbox && key) {
    const lines = [
      `House report ${what}${o.test_mode ? " (TEST MODE, no money moved)" : ""}`,
      `Order: ${o.id}`,
      `Buyer: ${email ?? "(unknown)"}`,
      `Address: ${o.address}`,
      `Block: ${o.place_slug ?? "not given"}`,
      `Amount: ${amount}`,
      o.needs_review ? `REVIEW: ${o.needs_review}` : null,
      what === "paid" ? `Next: node scripts/report-order.mjs start ${o.id}` : null,
    ].filter(Boolean);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SPARC Labs <hello@sparclabs.co>",
        to: [inbox],
        subject: `${o.test_mode ? "[TEST] " : ""}House report ${what}: ${o.address}`,
        text: lines.join("\n"),
      }),
    });
  }
}
