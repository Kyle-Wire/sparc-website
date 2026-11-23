import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { packagePath, packageDownloadName } from "@/lib/payments/package";

export const runtime = "nodejs";

// A delivered report, for its buyer only. The file sits in the private
// "reports" bucket; this hands out a link that lasts five minutes.
// ?file=package gives the offline atlas zip instead (src/lib/payments/package.ts).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/account/reports")}`, req.url), { status: 303 });

  // Read through the buyer's own session: row level security returns only their rows.
  const { data: order } = await supabase
    .from("report_orders")
    .select("id,user_id,status,report_path,delivered_at")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string; report_path: string | null; delivered_at: string | null }>();
  if (!order || order.user_id !== user.id || order.status !== "delivered" || !order.report_path) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const wantsPackage = req.nextUrl.searchParams.get("file") === "package";
  const path = wantsPackage ? packagePath(order.user_id, order.id) : order.report_path;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from("reports")
    .createSignedUrl(path, 300, { download: wantsPackage ? packageDownloadName(order.delivered_at) : true });
  if (wantsPackage && error) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (error || !data?.signedUrl) {
    console.error("[reports/download] sign failed:", error);
    return NextResponse.json({ error: "could not open the file, please try again" }, { status: 502 });
  }
  return NextResponse.redirect(data.signedUrl, { status: 303 });
}
