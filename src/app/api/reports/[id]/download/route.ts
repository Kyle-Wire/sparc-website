import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { packagePath, packageDownloadName } from "@/lib/payments/package";
import { parseVersion, versionPath } from "@/lib/payments/versions";

export const runtime = "nodejs";

// A delivered report, for its buyer only. The file sits in the private
// "reports" bucket; this hands out a link that lasts five minutes.
// ?file=package gives the offline atlas zip instead (src/lib/payments/package.ts),
// and ?v=1.1 an updated version of the report (src/lib/payments/versions.ts).
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

  const q = req.nextUrl.searchParams;
  const wantsPackage = q.get("file") === "package";
  const version = q.has("v") ? parseVersion(q.get("v")) : null;
  if (q.has("v") && !version) return NextResponse.json({ error: "not found" }, { status: 404 });
  const path = wantsPackage
    ? packagePath(order.user_id, order.id)
    : version && version.label !== "1.0"
      ? versionPath(order.user_id, order.id, version)
      : order.report_path;
  const name = wantsPackage ? packageDownloadName(order.delivered_at) : `house-report-v${version?.label ?? "1.0"}.pdf`;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from("reports").createSignedUrl(path, 300, { download: name });
  if ((wantsPackage || version) && error) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (error || !data?.signedUrl) {
    console.error("[reports/download] sign failed:", error);
    return NextResponse.json({ error: "could not open the file, please try again" }, { status: 502 });
  }
  return NextResponse.redirect(data.signedUrl, { status: 303 });
}
