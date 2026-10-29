import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createUserCheckout, getVariantId, type Tier } from "@/lib/lemonsqueezy";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

// Self-serve checkout is OFF by deliberate decision (2026-10-29).
//
// The published /pricing page described entitlements — SSO, a dedicated Slack
// channel, 25-member shared workspaces, a team GPU pool, project versioning —
// that are not confirmed to ship, alongside a 30-day refund promise and support
// response windows with no policy behind them. Taking money against that
// description would form a contract on an inaccurate one.
//
// Do not re-enable by flipping this flag alone. Checkout goes back on only once
// /pricing states prices and entitlements that are true, and the Terms publish
// the billing, cancellation and refund terms that apply.
const CHECKOUT_ENABLED = process.env.CHECKOUT_ENABLED === "true";

export async function GET(req: NextRequest) {
  if (!CHECKOUT_ENABLED) {
    return NextResponse.redirect(new URL("/pricing?checkout=unavailable", req.url), { status: 303 });
  }

  const url = new URL(req.url);
  const tier = (url.searchParams.get("tier") ?? "") as Tier;
  const period = (url.searchParams.get("period") ?? "monthly") as "monthly" | "yearly";

  if (tier !== "pursue" && tier !== "converge") {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    const next = encodeURIComponent(`/api/checkout?tier=${tier}&period=${period}`);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  const variantId = getVariantId(tier, period);
  if (!variantId) {
    return NextResponse.json({ error: `Variant not configured for ${tier}_${period}.` }, { status: 500 });
  }

  try {
    const checkoutUrl = await createUserCheckout({
      variantId,
      userId: user.id,
      email: user.email,
      tier,
      redirectUrl: `${SITE_URL}/account/subscription?welcome=1`,
    });
    if (!checkoutUrl) throw new Error("Lemon Squeezy returned no URL.");
    return NextResponse.redirect(checkoutUrl, { status: 303 });
  } catch (err) {
    console.error("[checkout] failed:", err);
    return NextResponse.redirect(new URL("/pricing?error=checkout", req.url));
  }
}
