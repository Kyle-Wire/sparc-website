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
 *   npx tsx scripts/report-order.ts feedback <order-id>     # 7+ days after delivery: the honest feedback ask
 *   npx tsx scripts/report-order.ts package <order-id> <atlas.zip>   # the offline atlas, plates and data (D47)
 *   npx tsx scripts/report-order.ts update <order-id> <correction|change|hazard> <report.pdf> "what changed, plainly"
 *   npx tsx scripts/report-order.ts stop-updates <order-id>  # the buyer replied "no more updates"
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
 *
 * package uploads the zip of Climate Home Inspection's buyer package
 * (tools/package/package.py --buyer, zipped) to <user_id>/<order_id>-package.zip.
 * Run it before or after deliver; running it again replaces the package (an
 * update). The buyer sees a second download once the order is delivered.
 *
 * update adds a new version of a delivered report (business/15-update-policy.md:
 * corrections free for good, other updates for 12 months). A correction or a
 * changed finding is the next minor version (v1.1), a new hazard the next
 * major (v2.0). Old versions stay in the account. The buyer is emailed; if a
 * finding was wrong, the email's first line says so. Nothing is charged.
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPORT, formatPrice } from "../src/lib/payments/catalog";
import { promisedBy, todayEastern } from "../src/lib/payments/turnaround";
import { paymentProvider } from "../src/lib/payments/index";
import { notifyReportEvent } from "../src/lib/payments/notify";
import { noticeFor } from "../src/lib/payments/webhook";
import { sendEmail } from "../src/lib/email";
import { feedbackDue } from "../src/lib/payments/feedback";
import { packagePath, looksLikeZip, hasStartHere, PACKAGE_MAX_BYTES } from "../src/lib/payments/package";
import { versionsByOrder, nextVersion, versionPath, updateAllowed, UPDATE_KINDS, UPDATE_WINDOW_DAYS, type UpdateKind } from "../src/lib/payments/versions";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparclabs.co";
const WAITING = ["card_saved", "in_progress", "charging", "payment_failed"];

const USAGE = `npx tsx scripts/report-order.ts list [status]
npx tsx scripts/report-order.ts show <order-id>
npx tsx scripts/report-order.ts start <order-id> ["note"]
npx tsx scripts/report-order.ts deliver <order-id> <report.pdf> ["note"]
npx tsx scripts/report-order.ts cannot-model <order-id> "reason"
npx tsx scripts/report-order.ts cancel <order-id> ["note"]
npx tsx scripts/report-order.ts feedback <order-id>
npx tsx scripts/report-order.ts package <order-id> <atlas.zip>
npx tsx scripts/report-order.ts update <order-id> <correction|change|hazard> <report.pdf> "what changed"
npx tsx scripts/report-order.ts stop-updates <order-id>`;

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
      .select("id,status,address,place_slug,test_mode,needs_review,card_saved_at,charge_error,inspection_deadline,deadline_acknowledged")
      .in("status", statuses)
      .order("card_saved_at", { ascending: true });
    if (error) throw error;
    // Earliest of (the buyer's inspection deadline, our promise) first: that is
    // the order to work on next (blind-spots review, 23 November 2026).
    const rows = (data ?? []).map((o) => {
      const ordered = o.card_saved_at ? todayEastern(new Date(o.card_saved_at)) : null;
      const due = ordered ? promisedBy(ordered, REPORT.deliveryDays) : null;
      const deadline = (o.inspection_deadline as string | null) ?? null;
      const first = [due, deadline].filter((x): x is string => !!x).sort()[0] ?? "9999-12-31";
      return { o, ordered, due, deadline, first };
    });
    rows.sort((a, b) => a.first.localeCompare(b.first));
    for (const { o, ordered, due, deadline } of rows) {
      console.log(
        [o.id, o.status, o.test_mode ? "TEST" : "live", `ordered ${ordered ?? "?"}`, `promised by ${due ?? "?"}`,
          deadline ? `INSPECTION DEADLINE ${deadline}${o.deadline_acknowledged ? " (before our promise; buyer said they understand)" : ""}` : "",
          o.address, o.charge_error ? `CARD: ${o.charge_error}` : "", o.needs_review ? `REVIEW: ${o.needs_review}` : ""]
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

  // The feedback ask (business/17-reviews-and-consent.md): every buyer, once,
  // about 7 days after delivery. Refuses earlier, and for undelivered orders.
  // Resend has no send-once switch here, so log each send in the order time log.
  if (cmd === "feedback" && a) {
    const o = await getOrder(db, a);
    const due = feedbackDue(o.status, (o.delivered_at as string | null) ?? null, new Date());
    if (!due.ok) {
      console.error(`Not sent: ${due.why}`);
      process.exit(1);
    }
    const { data: u } = await db.auth.admin.getUserById(o.user_id);
    const email = u?.user?.email;
    if (!email) {
      console.error("Not sent: the buyer's account has no email.");
      process.exit(1);
    }
    const full = String((u?.user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "").trim();
    const r = await sendEmail({
      to: email,
      replyTo: process.env.WAITLIST_NOTIFY_EMAIL ?? "hello@sparclabs.co",
      template: "report-feedback",
      props: { firstName: full.split(/\s+/)[0] || undefined, deliveredOn: due.deliveredOn },
      refId: `report-feedback-${o.id}`,
    });
    console.log(r.ok ? `Sent the feedback ask to ${email} (${r.id}). Note it in the order time log.` : `Not sent: ${r.error}`);
    return;
  }

  // The offline atlas, plates and data files (D47), as one zip. Not charged
  // for separately and changes no state: the buyer sees it once delivered.
  if (cmd === "package" && a && b) {
    const o = await getOrder(db, a);
    if (["awaiting_card", "abandoned", "cancelled", "cannot_model", "refunded"].includes(o.status)) {
      console.error(`Order is ${o.status}; no package goes with it.`);
      process.exit(1);
    }
    const bytes = readFileSync(b);
    if (!looksLikeZip(bytes)) {
      console.error("The package must be a zip of the buyer's package folder.");
      process.exit(1);
    }
    if (!hasStartHere(bytes)) {
      console.error("No START-HERE.html in the zip: is this the package folder from tools/package/package.py --buyer?");
      process.exit(1);
    }
    if (bytes.length > PACKAGE_MAX_BYTES) {
      console.error(`The zip is ${(bytes.length / 1048576).toFixed(1)} MB; the storage limit is ${PACKAGE_MAX_BYTES / 1048576} MB a file. Raise it in Supabase Storage settings, or leave the full-resolution rasters for the drive.`);
      process.exit(1);
    }
    const path = packagePath(o.user_id, o.id);
    const up = await db.storage.from("reports").upload(path, bytes, { contentType: "application/zip", upsert: true });
    if (up.error) throw up.error;
    console.log(`Uploaded ${basename(b)} (${(bytes.length / 1048576).toFixed(1)} MB) to reports/${path}.` +
      (o.status === "delivered" ? " The buyer can download it now." : " The buyer sees it once the report is delivered and paid."));
    return;
  }

  // A new version of a delivered report. Never replaces an old one.
  if (cmd === "update" && a && b && c) {
    const kind = b as UpdateKind;
    const whatChanged = process.argv[6]?.trim();
    if (!UPDATE_KINDS.includes(kind)) {
      console.error(`The kind is one of ${UPDATE_KINDS.join(", ")}.`);
      process.exit(2);
    }
    if (!c.toLowerCase().endsWith(".pdf") || !whatChanged) {
      console.error('Give the new PDF and, in quotes, what changed in one or two plain sentences.');
      process.exit(2);
    }
    const o = await getOrder(db, a);
    const { data: u } = await db.auth.admin.getUserById(o.user_id);
    const optedOut = Boolean((u?.user?.app_metadata as { updates_opt_out?: boolean } | undefined)?.updates_opt_out);
    const ok = updateAllowed(kind, o.status, (o.delivered_at as string | null) ?? null, new Date(), optedOut);
    if (!ok.ok) {
      console.error(`Not sent: ${ok.why}.`);
      process.exit(1);
    }
    const { data: files, error: le } = await db.storage.from("reports").list(o.user_id, { limit: 1000 });
    if (le) throw le;
    const have = versionsByOrder((files ?? []).map((f) => f.name)).get(o.id) ?? [];
    const v = nextVersion(have, kind);
    const path = versionPath(o.user_id, o.id, v);
    const bytes = readFileSync(c);
    // upsert false: a version, once written, is never overwritten.
    const up = await db.storage.from("reports").upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (up.error) throw up.error;
    console.log(`Uploaded ${basename(c)} as v${v.label} (reports/${path}). Earlier versions: ${have.map((x) => "v" + x.label).join(", ") || "none"}.`);
    const email = u?.user?.email;
    if (!email) {
      console.log("The account has no email; the new version is in the account only.");
      return;
    }
    const until = new Date(new Date(o.delivered_at as string).getTime() + UPDATE_WINDOW_DAYS * 86_400_000);
    const r = await sendEmail({
      to: email,
      replyTo: process.env.WAITLIST_NOTIFY_EMAIL ?? "hello@sparclabs.co",
      template: "report-updated",
      props: {
        address: o.address as string,
        accountUrl: `${SITE}/account/reports`,
        version: v.label,
        kind,
        whatChanged,
        updatesUntil: until.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" }),
      },
      refId: `report-updated-${o.id}-v${v.label}`,
    });
    console.log(r.ok ? `Emailed ${email} (${r.id}). Note it in the order time log.` : `Email not sent: ${r.error}`);
    return;
  }

  // The buyer replied "no more updates". Corrections still go (update refuses the rest).
  if (cmd === "stop-updates" && a) {
    const o = await getOrder(db, a);
    const { data: u } = await db.auth.admin.getUserById(o.user_id);
    const meta = { ...(u?.user?.app_metadata ?? {}), updates_opt_out: true };
    const { error } = await db.auth.admin.updateUserById(o.user_id, { app_metadata: meta });
    if (error) throw error;
    console.log("Done: no more updates for this buyer's reports. Corrections still go.");
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
