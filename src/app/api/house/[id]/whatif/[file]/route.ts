import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ownOrder } from "@/lib/house/server";
import { whatifEnginePath, whatifModelPath } from "@/lib/house/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A buyer's flood lab files, served same-origin so the page's Content Security
// Policy (script-src 'self') allows them: the house's emulator ("model") and
// FloodSim's emulator code ("engine"). Both live in the private "reports" bucket
// and reach only the buyer of a delivered report. The engine script defines a
// top-level `FS`; one line is added so the lab can find it on window.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  if (file !== "engine" && file !== "model") return NextResponse.json({ error: "not found" }, { status: 404 });
  const own = await ownOrder(id);
  if (!own || own.order.status !== "delivered") return NextResponse.json({ error: "not found" }, { status: 404 });

  const path = file === "engine" ? whatifEnginePath(own.userId, id) : whatifModelPath(own.userId, id);
  const { data, error } = await createSupabaseAdminClient().storage.from("reports").download(path);
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  const text = await data.text();
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "Content-Type": file === "engine" ? "text/javascript; charset=utf-8" : "application/json; charset=utf-8",
  };
  return new NextResponse(file === "engine" ? `${text}\n;window.__SPARC_FS = FS;\n` : text, { headers });
}
