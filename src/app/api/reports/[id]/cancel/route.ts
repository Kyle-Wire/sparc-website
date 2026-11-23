import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import { paymentProvider } from "@/lib/payments";
import { mayCancel } from "@/lib/payments/self-serve";
import { notifyReportEvent } from "@/lib/payments/notify";

export const runtime = "nodejs";

// POST from "Cancel this order" on /account/reports. The Terms promise that a
// buyer may cancel any time before the report is ready and pays nothing; this
// makes that one button instead of an email. Only the buyer's own order, only
// while nothing is charged (src/lib/payments/self-serve.ts). The move goes
// through advance_report_order, the same locked state machine the fulfilment
// script uses, so it cannot race a charge: "charging" is refused there.
// Then the saved card is removed and the inbox is told so work stops.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = (q: string) => NextResponse.redirect(new URL(`/account/reports?${q}`, req.url), { status: 303 });

  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/account/reports")}`, req.url), { status: 303 });

  const rl = await checkRateLimit("apiWrite", `report-cancel:${user.id}`);
  if (!rl.ok) return back("error=cancel");

  // Read through the buyer's own session: row level security returns only their rows.
  const { data: o } = await supabase
    .from("report_orders")
    .select("id,user_id,status,provider_setup_id")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string; provider_setup_id: string | null }>();
  if (!o || o.user_id !== user.id) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!mayCancel(o.status)) return back("error=cancel-late");

  const admin = createSupabaseAdminClient();
  const { data: moved, error } = await admin.rpc("advance_report_order", {
    p_order_id: o.id,
    p_to: "cancelled",
    p_report_path: null,
    p_status_note: "Cancelled by you from your account.",
  });
  if (error || moved !== "cancelled") {
    console.error("[reports/cancel] not moved:", error ?? moved);
    return back("error=cancel-late");
  }

  if (o.provider_setup_id) {
    try {
      await paymentProvider().forgetCard(o.provider_setup_id);
    } catch (err) {
      // The order is cancelled and nothing will be charged; the inbox note says to remove the card by hand.
      console.error("[reports/cancel] card not removed:", err);
    }
  }
  await notifyReportEvent(admin, o.id, "cancelled").catch((e) => console.error("[reports/cancel] notify failed:", e));
  return back(`cancelled=${o.id}`);
}
