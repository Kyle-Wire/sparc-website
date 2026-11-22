import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/brand";
import { checkoutEnabled, paymentProvider, REPORT } from "@/lib/payments";
import { checkOrder } from "@/lib/payments/order-input";

export const runtime = "nodejs";

// POST from the form on /report/buy. Writes the order (awaiting payment) and
// sends the buyer to the provider's checkout with only the order's id. The
// price recorded is the one the page showed, from src/lib/payments/catalog.ts.
export async function POST(req: NextRequest) {
  const back = (error: string, place?: string | null) => {
    const u = new URL("/report/buy", req.url);
    u.searchParams.set("error", error);
    if (place) u.searchParams.set("place", place);
    return NextResponse.redirect(u, { status: 303 });
  };

  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  if (!checkoutEnabled()) return back("unavailable");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/report/buy")}`, req.url), { status: 303 });
  }

  const rl = await checkRateLimit("apiWrite", `report-order:${user.id}`);
  if (!rl.ok) return back("checkout");

  const form = await req.formData();
  const checked = checkOrder(form);
  if (!checked.ok) {
    const place = typeof form.get("place") === "string" ? String(form.get("place")) : null;
    return back(checked.error, place);
  }
  const input = checked.value;

  const provider = paymentProvider();
  if (!provider.configured()) return back("unconfigured", input.placeSlug);

  const admin = createSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("report_orders")
    .insert({
      user_id: user.id,
      product: REPORT.id,
      price_cents: REPORT.priceCents,
      currency: REPORT.currency,
      place_slug: input.placeSlug,
      address: input.address,
      note: input.note,
      provider: provider.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !order) {
    console.error("[reports/order] insert failed:", error);
    return back("checkout", input.placeSlug);
  }

  try {
    const url = await provider.createCheckout({
      orderId: order.id,
      userId: user.id,
      email: user.email,
      successUrl: `${SITE_URL}/account/reports?paid=${order.id}`,
      cancelUrl: `${SITE_URL}/report/buy${input.placeSlug ? `?place=${input.placeSlug}` : ""}`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[reports/order] checkout failed:", err);
    await admin.from("report_orders").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("id", order.id);
    return back("checkout", input.placeSlug);
  }
}
