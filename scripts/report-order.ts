/**
 * Fulfil house report orders by hand. Run from a shell with the service key,
 * never from the browser:
 *
 *   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...
 *   export STRIPE_SECRET_KEY=...  STRIPE_PRICE_REPORT=...     # deliver charges the saved card
 *   export RESEND_API_KEY=...                                 # optional: emails the buyer
 *
 *   npx tsx scripts/report-order.ts list [status]        # default: everything waiting on us
 *   npx tsx scripts/report-order.ts show <order-id>
 *   npx tsx scripts/report-order.ts start <order-id> ["note the buyer sees"]
 *   npx tsx scripts/report-order.ts deliver <order-id> <report.pdf> ["note"]
 *   npx tsx scripts/report-order.ts cannot-model <order-id> "why, in words the buyer reads"
 *   npx tsx scripts/report-order.ts cancel <order-id> ["note"]
 *
 * The buyer is charged when the report is ready (Kyle, 22 November 2026).
 * deliver uploads the PDF, charges the card saved at order (with sales tax
 * from Stripe Tax), and unlocks the report only if the charge goes through.
 * If it does not, the buyer is emailed and pays from their account; the
 * report unlocks then. Running deliver again retries the charge.
 *
 * cannot-model and cancel charge nothing and remove the saved card.
 *
 * The report PDF comes from Climate Home Inspection (tools/report/build_report.py).
 * It goes into the private "reports" bucket at <user_id>/<order_id>.pdf; the
 * buyer downloads it through /api/reports/<id>/download once it is paid.
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPORT, formatPrice } from "../src/lib/payments/catalog";
import { paymentProvider } from "../src/lib/payments/index";
import { notifyReportEvent } from "../src/lib/payments/notify";
import { noticeFor } from "../src/lib/payments/webhook";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparclabs.co";
const DAY_MS = 24 * 60 * 60 * 1000;
const WAITING = ["card_saved", "in_progress", "charging", "payment_failed"];

const USAGE = `npx tsx scripts/report-order.ts list [status]
npx tsx scripts/report-order.ts show <order-id>
npx tsx scripts/report-order.ts start <order-id> ["note"]
npx tsx scripts/report-order.ts deliver <order-id> <report.pdf> ["note"]
npx tsx scripts/report-order.ts cannot-model <order-id> "reason"
npx tsx scripts/report-order.ts cancel <order-id> ["note"]`;

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(2);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
type Row = Record<string, unknown> & {
  id: string;
  user_id: string;
  address: string;
  status: string;
  provider_customer_id: string | null;
  provider_setup_id: string | null;
  charge_attempts: number;
};

async function getOrder(db: SupabaseClient, id: string): Promise<Row> {
  const { data, error } = await db.from("report_orders").select("*").eq("id", id).maybeSingle<Row>();
  if (error) throw error;
  if (!data) {
    console.error(`No order ${id}.`);
    process.exit(1);
  }
  return data;
}

async function advance(db: SupabaseClient, id: string, to: string, path: string | null, note: string | null) {
  const { data, error } = await db.rpc("advance_report_order", { p_order_id: id, p_to: to, p_report_path: path, p_status_note: note });
  if (error) throw error;
  if (data !== to) {
    console.error(`Not moved: ${data}`);
    process.exit(1);
  }
  console.log(`${id}: ${to}`);
}

/** Record the charge's result through the same state machine as the webhook. */
async function record(db: SupabaseClient, o: Row, kind: "order_paid" | "charge_failed", f: { paymentId: string | null; amountCents?: number; currency?: string; receiptUrl?: string | null; error?: string; testMode: boolean }) {
  const { data, error } = await db.rpc("apply_payment_event", {
    p_provider: "stripe",
    // The webhook's copy of the same payment arrives under Stripe's event id
    // and is then a duplicate; this key keeps a rerun from recording twice.
    p_event_key: `deliver:${f.paymentId ?? `${o.id}-${o.charge_attempts}`}:${kind}`,
    p_event_name: `deliver.${kind}`,
    p_kind: kind,
    p_order_id: o.id,
    p_user_id: o.user_id,
    p_provider_order_id: f.paymentId ?? "",
    p_provider_order_number: null,
    p_amount_cents: f.amountCents ?? null,
    p_currency: f.currency ?? null,
    p_test_mode: f.testMode,
    p_receipt_url: f.receiptUrl ?? null,
    p_error: f.error ?? null,
  });
  if (error) throw error;
  return String(data);
}

async function forget(o: Row) {
  if (!o.provider_setup_id) return;
  try {
    await paymentProvider().forgetCard(o.provider_setup_id);
    console.log("Removed the saved card.");
  } catch (e) {
    console.warn(`Could not remove the saved card (${(e as Error).message}). Remove it in the Stripe Dashboard: customer ${o.provider_customer_id}.`);
  }
}

async function main() {
  const [cmd, a, b, c] = process.argv.slice(2);
  const db = admin();

  if (cmd === "list") {
    const statuses = a ? [a] : WAITING;
    const { data, error } = await db
      .from("report_orders")
      .select("id,status,address,place_slug,test_mode,needs_review,card_saved_at,charge_error")
      .in("status", statuses)
      .order("card_saved_at", { ascending: true });
    if (error) throw error;
    for (const o of data ?? []) {
      // Working days, roughly: the promise is in working days, so allow the weekends.
      const due = o.card_saved_at ? new Date(new Date(o.card_saved_at).getTime() + Math.ceil(REPORT.deliveryDays * 1.4) * DAY_MS).toISOString().slice(0, 10) : "";
      console.log(
        [o.id, o.status, o.test_mode ? "TEST" : "live", `ordered ${String(o.card_saved_at ?? "").slice(0, 10)}`, `due by ~${due}`, o.address,
          o.charge_error ? `CARD: ${o.charge_error}` : "", o.needs_review ? `REVIEW: ${o.needs_review}` : ""]
          .filter(Boolean)
          .join(" | "),
      );
    }
    if (!data?.length) console.log("Nothing waiting.");
    return;
  }

  if (cmd === "show" && a) {
    console.log(JSON.stringify(await getOrder(db, a), null, 2));
    return;
  }

  if (cmd === "start" && a) {
    await advance(db, a, "in_progress", null, b ?? null);
    return;
  }

  if (cmd === "deliver" && a && b) {
    const o = await getOrder(db, a);
    if (!b.toLowerCase().endsWith(".pdf")) {
      console.error("The report must be a PDF.");
      process.exit(1);
    }
    if (!["card_saved", "in_progress", "charging", "payment_failed"].includes(o.status)) {
      console.error(`Order is ${o.status}; nothing to deliver or charge.`);
      process.exit(1);
    }
    if (!o.provider_customer_id || !o.provider_setup_id) {
      console.error(`Order is ${o.status} with no saved card; nothing to charge.`);
      process.exit(1);
    }
    const provider = paymentProvider();
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_REPORT) {
      console.error("Set STRIPE_SECRET_KEY and STRIPE_PRICE_REPORT first: delivering charges the saved card.");
      process.exit(2);
    }
    const bytes = readFileSync(b);
    const path = `${o.user_id}/${o.id}.pdf`;
    const up = await db.storage.from("reports").upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    console.log(`Uploaded ${basename(b)} (${bytes.length} bytes) to reports/${path}. It stays locked until paid.`);
    await advance(db, a, "charging", path, c ?? null);

    const r = await provider.chargeSavedCard({ orderId: o.id, userId: o.user_id, customerId: o.provider_customer_id, setupId: o.provider_setup_id, attempt: o.charge_attempts });
    const outcome = r.ok
      ? await record(db, o, "order_paid", { paymentId: r.paymentId, amountCents: r.amountCents, currency: r.currency, receiptUrl: r.receiptUrl, testMode: r.testMode })
      : await record(db, o, "charge_failed", { paymentId: r.paymentId, error: r.error, testMode: r.testMode });
    if (r.ok) console.log(`Charged ${formatPrice(r.amountCents, r.currency)} (tax ${formatPrice(r.taxCents, r.currency)}), payment ${r.paymentId}: ${outcome}.`);
    else console.log(`The card did not go through (${r.code ?? "?"}: ${r.error}): ${outcome}. The buyer is asked to pay from their account.`);

    const notice = noticeFor(outcome);
    if (notice) await notifyReportEvent(db, o.id, notice, { site: SITE }).catch((e) => console.warn(`Email not sent (${(e as Error).message}).`));
    if (!notice && outcome !== "duplicate") console.log("Check the order: `show` it and look at needs_review.");
    return;
  }

  if ((cmd === "cannot-model" && a && b) || (cmd === "cancel" && a)) {
    const o = await getOrder(db, a);
    await advance(db, a, cmd === "cancel" ? "cancelled" : "cannot_model", null, b ?? null);
    await forget(o);
    console.log("Nothing was charged.");
    return;
  }

  console.error(USAGE);
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
