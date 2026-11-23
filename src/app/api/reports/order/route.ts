import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/brand";
import { checkoutEnabled, mayOrder, paymentProvider, REPORT, REPORT_TERMS_VERSION } from "@/lib/payments";
import { atCapacity } from "@/lib/payments/capacity";
import { tooManyAttempts } from "@/lib/payments/attempts";
import { checkOrder } from "@/lib/payments/order-input";

export const runtime = "nodejs";

// POST from the form on /report/buy. Writes the order (awaiting a card) and
// sends the buyer to the provider's checkout to save a card, with only the
// order's id. Nothing is charged until the report is ready (Kyle, 22 November
// 2026). The price recorded is the one the page showed, from
// src/lib/payments/catalog.ts.
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

  // Soft launch (Kyle, 22 November 2026): only invited emails may order until
  // ORDERS_OPEN is set. Checked here, not only on the page, so a hand-made
  // POST is refused too.
  if (!mayOrder(user.email)) return back("invite");

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
  if (await atCapacity(admin)) return back("full", input.placeSlug);
  if (await tooManyAttempts(admin, user.id)) return back("attempts", input.placeSlug);

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
      // What the buyer agreed to, and when (migration 0009): the evidence if a
      // charge is ever disputed.
      terms_version: REPORT_TERMS_VERSION,
      agreed_at: new Date().toISOString(),
      inspection_deadline: input.inspectionDeadline,
      deadline_acknowledged: input.deadlineAcknowledged,
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
      successUrl: `${SITE_URL}/account/reports?ordered=${order.id}`,
      cancelUrl: `${SITE_URL}/report/buy${input.placeSlug ? `?place=${input.placeSlug}` : ""}`,
    });
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[reports/order] checkout failed:", err);
    await admin.from("report_orders").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("id", order.id);
    return back("checkout", input.placeSlug);
  }
}
