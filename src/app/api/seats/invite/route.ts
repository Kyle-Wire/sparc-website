import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const rl = await checkRateLimit("apiWrite", `seats-invite:${user.id}`);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/account/seats?error=rate_limited", req.url), { status: 303 });
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 320);
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.redirect(new URL("/account/seats?error=invalid_email", req.url), { status: 303 });
  }

  try {
    const admin = createSupabaseAdminClient();
    await admin.from("seats").upsert({
      owner_id: user.id,
      email,
      status: "invited",
      invited_at: new Date().toISOString(),
    }, { onConflict: "owner_id,email" });
  } catch { /* dev */ }

  return NextResponse.redirect(new URL("/account/seats?invited=1", req.url), { status: 303 });
}
