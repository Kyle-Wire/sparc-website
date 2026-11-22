import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/brand";
import { paymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

// POST from "Pay and open the report" on /account/reports. Only for the
// buyer's own order, and only once the report is finished and the saved card
// failed (status payment_failed). Sends them to a Stripe Checkout page with
// Stripe Tax; the report unlocks on payment_intent.succeeded (the webhook).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = (error?: string) =>
    NextResponse.redirect(new URL(`/account/reports${error ? `?error=${error}` : ""}`, req.url), { status: 303 });

  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/account/reports")}`, req.url), { status: 303 });

  const rl = await checkRateLimit("apiWrite", `report-pay:${user.id}`);
  if (!rl.ok) return back("pay");

  // Read through the buyer's own session: row level security returns only their rows.
  const { data: o } = await supabase
    .from("report_orders")
    .select("id,user_id,status,provider_customer_id,charge_attempts")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string; provider_customer_id: string | null; charge_attempts: number }>();
  if (!o || o.user_id !== user.id) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (o.status !== "payment_failed" || !o.provider_customer_id) return back();

  const provider = paymentProvider();
  if (!provider.configured()) return back("pay");
  try {
    const url = await provider.createPayLink({
      orderId: o.id,
      userId: user.id,
      customerId: o.provider_customer_id,
      attempt: o.charge_attempts,
      successUrl: `${SITE_URL}/account/reports?paying=${o.id}`,
      cancelUrl: `${SITE_URL}/account/reports`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[reports/pay] checkout failed:", err);
    return back("pay");
  }
}
