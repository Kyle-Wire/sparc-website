/**
 * Fulfil house report orders by hand. Run from a shell with the service key,
 * never from the browser:
 *
 *   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...
 *   export RESEND_API_KEY=...            # optional: emails the buyer on delivery
 *
 *   npx tsx scripts/report-order.ts list [status]        # default: paid and in_progress
 *   npx tsx scripts/report-order.ts show <order-id>
 *   npx tsx scripts/report-order.ts start <order-id> ["note the buyer sees"]
 *   npx tsx scripts/report-order.ts deliver <order-id> <report.pdf> ["note"]
 *   npx tsx scripts/report-order.ts cannot-model <order-id> "why, in words the buyer reads"
 *
 * cannot-model does not move money. Refund the order in the payment
 * provider's dashboard; its refund webhook then marks the order refunded.
 *
 * The report PDF comes from Climate Home Inspection (tools/report/build_report.py).
 * It goes into the private "reports" bucket at <user_id>/<order_id>.pdf; the
 * buyer downloads it through /api/reports/<id>/download.
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../src/lib/email";
import { REPORT } from "../src/lib/payments/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparclabs.co";
const DAY_MS = 24 * 60 * 60 * 1000;

const USAGE = `npx tsx scripts/report-order.ts list [status]
npx tsx scripts/report-order.ts show <order-id>
npx tsx scripts/report-order.ts start <order-id> ["note"]
npx tsx scripts/report-order.ts deliver <order-id> <report.pdf> ["note"]
npx tsx scripts/report-order.ts cannot-model <order-id> "reason"`;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(2);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
type Db = ReturnType<typeof admin>;
type Row = Record<string, unknown> & { id: string; user_id: string; address: string; status: string };

async function getOrder(db: Db, id: string): Promise<Row> {
  const { data, error } = await db.from("report_orders").select("*").eq("id", id).maybeSingle<Row>();
  if (error) throw error;
  if (!data) {
    console.error(`No order ${id}.`);
    process.exit(1);
  }
  return data;
}

async function advance(db: Db, id: string, to: string, path: string | null, note: string | null) {
  const { data, error } = await db.rpc("advance_report_order", { p_order_id: id, p_to: to, p_report_path: path, p_status_note: note });
  if (error) throw error;
  if (data !== to) {
    console.error(`Not moved: ${data}`);
    process.exit(1);
  }
  console.log(`${id}: ${to}`);
}

async function main() {
  const [cmd, a, b, c] = process.argv.slice(2);
  const db = admin();

  if (cmd === "list") {
    const statuses = a ? [a] : ["paid", "in_progress"];
    const { data, error } = await db
      .from("report_orders")
      .select("id,status,address,place_slug,amount_paid_cents,test_mode,needs_review,paid_at")
      .in("status", statuses)
      .order("paid_at", { ascending: true });
    if (error) throw error;
    for (const o of data ?? []) {
      // Working days, roughly: the promise is in working days, so allow the weekends.
      const due = o.paid_at ? new Date(new Date(o.paid_at).getTime() + Math.ceil(REPORT.deliveryDays * 1.4) * DAY_MS).toISOString().slice(0, 10) : "";
      const money = `$${((o.amount_paid_cents ?? 0) / 100).toFixed(2)}`;
      console.log(
        [o.id, o.status, o.test_mode ? "TEST" : "live", money, `paid ${String(o.paid_at ?? "").slice(0, 10)}`, `due by ~${due}`, o.address, o.needs_review ? `REVIEW: ${o.needs_review}` : ""]
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
    const bytes = readFileSync(b);
    const path = `${o.user_id}/${o.id}.pdf`;
    const up = await db.storage.from("reports").upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    console.log(`Uploaded ${basename(b)} (${bytes.length} bytes) to reports/${path}`);
    await advance(db, a, "delivered", path, c ?? null);
    const { data: u } = await db.auth.admin.getUserById(o.user_id);
    const email = u?.user?.email;
    if (email) {
      const r = await sendEmail({
        to: email,
        template: "report-delivered",
        props: { address: o.address, accountUrl: `${SITE}/account/reports`, note: c ?? undefined },
        refId: `report-delivered-${o.id}`,
      });
      console.log(r.ok ? `Emailed ${email}.` : `Email not sent (${r.error}). Tell the buyer yourself: ${email}`);
    }
    return;
  }

  if (cmd === "cannot-model" && a && b) {
    await advance(db, a, "cannot_model", null, b);
    console.log("Now refund this order in the payment provider's dashboard. Its webhook marks the order refunded.");
    return;
  }

  console.error(USAGE);
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
