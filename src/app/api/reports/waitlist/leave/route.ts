import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST from /report/waitlist/leave (the link in every waitlist email). A POST,
// not the link itself, so a mail scanner that follows links cannot take
// someone off the list. The row stays as 'left' and the address is deleted.
export async function POST(req: NextRequest) {
  const done = (state: string) => NextResponse.redirect(new URL(`/report/waitlist/leave?done=${state}`, req.url), { status: 303 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  const rl = await checkRateLimit("publicForm", `report-waitlist-leave:${clientIp(req)}`);
  if (!rl.ok) return done("error");

  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!UUID.test(token)) return done("unknown");
  try {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("report_waitlist")
      .update({ status: "left", left_at: now, updated_at: now, address: null, note: null })
      .eq("leave_token", token)
      .in("status", ["waiting", "invited", "expired"])
      .select("id");
    if (error) throw error;
    return done(data && data.length ? "left" : "unknown");
  } catch (err) {
    console.error("[reports/waitlist/leave] failed:", err);
    return done("error");
  }
}
