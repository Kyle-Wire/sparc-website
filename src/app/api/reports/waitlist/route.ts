import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkoutEnabled, mayOrder } from "@/lib/payments";
import { WAITLIST_DOMAIN, waitlistReason } from "@/lib/payments/waitlist";

export const runtime = "nodejs";

// POST from /report/buy when the week is full (ORDERS_WEEKLY_CAP). Puts the
// signed-in buyer on the house-report wait list: no card, no charge. Sends
// them back to the page with their real place in line.
export async function POST(req: NextRequest) {
  const back = (params: Record<string, string>) => {
    const u = new URL("/report/buy", req.url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u, { status: 303 });
  };

  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  if (!checkoutEnabled()) return back({ error: "unavailable" });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/report/buy")}`, req.url), { status: 303 });
  }
  if (!mayOrder(user.email)) return back({ error: "invite" });

  const rl = await checkRateLimit("apiWrite", `report-waitlist:${user.id}`);
  if (!rl.ok) return back({ error: "checkout" });

  const form = await req.formData();
  const str = (k: string) => (typeof form.get(k) === "string" ? String(form.get(k)) : null);
  const place = str("place");
  const reason = waitlistReason({ place, deadline: str("deadline"), note: str("note") });
  const email = user.email.toLowerCase();

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("waitlist")
      .upsert(
        { email, domain: WAITLIST_DOMAIN, reason, status: "queued", referer: "/report/buy" },
        { onConflict: "email" },
      )
      .select("created_at")
      .single<{ created_at: string }>();
    if (error) throw error;

    const { count } = await admin
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .eq("domain", WAITLIST_DOMAIN)
      .eq("status", "queued")
      .lte("created_at", data.created_at);

    void notify(email, reason).catch(() => {});

    const params: Record<string, string> = { waitlisted: String(Math.max(1, count ?? 1)) };
    if (place) params.place = place;
    return back(params);
  } catch (err) {
    console.error("[report-waitlist] save failed:", err);
    return back({ error: "checkout" });
  }
}

// Tells Kyle someone joined (same settings as the contact form's notice).
async function notify(email: string, reason: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "SPARC Waitlist <waitlist@sparclabs.co>",
      to: [to],
      subject: `House report wait list · ${email}`,
      text: `${email}\n${reason}`,
    }),
  });
}
