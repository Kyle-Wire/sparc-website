import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { checkoutEnabled } from "@/lib/payments";
import { capacity, queuePosition } from "@/lib/payments/capacity";
import { DEADLINE_WARNING, checkWaitlist, waitMissesDeadline, waitNote } from "@/lib/payments/waitlist";

export const runtime = "nodejs";

// POST from the waitlist form on /report/buy (migration 0012). No account is
// needed to wait. Joining again with the same email updates the details and
// keeps the person's place. Nothing is charged and no card is asked for.
export async function POST(req: NextRequest) {
  const back = (params: Record<string, string>) => {
    const u = new URL("/report/buy", req.url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u, { status: 303 });
  };

  if (!isSameOrigin(req)) return NextResponse.json({ error: "cross-origin" }, { status: 403 });
  if (!checkoutEnabled()) return back({ error: "unavailable" });

  const rl = await checkRateLimit("publicForm", `report-waitlist:${clientIp(req)}`);
  if (!rl.ok) return back({ wl_error: "save" });

  const form = await req.formData();
  const checked = checkWaitlist(form);
  if (!checked.ok) {
    const place = typeof form.get("place") === "string" ? String(form.get("place")) : "";
    return back(place ? { wl_error: checked.error, place } : { wl_error: checked.error });
  }
  const w = checked.value;
  const placeParam: Record<string, string> = w.placeSlug ? { place: w.placeSlug } : {};

  try {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const details = {
      name: w.name,
      address: w.address,
      place_slug: w.placeSlug,
      note: w.note,
      inspection_deadline: w.inspectionDeadline,
      updated_at: now,
    };
    const { data: live } = await admin
      .from("report_waitlist")
      .select("id, created_at, status, leave_token")
      .eq("email", w.email)
      .in("status", ["waiting", "invited"])
      .maybeSingle<{ id: string; created_at: string; status: string; leave_token: string }>();

    let row: { id: string; created_at: string; status: string; leave_token: string };
    if (live) {
      const { error } = await admin.from("report_waitlist").update(details).eq("id", live.id);
      if (error) throw error;
      row = live;
    } else {
      const { data, error } = await admin
        .from("report_waitlist")
        .insert({ ...details, email: w.email })
        .select("id, created_at, status, leave_token")
        .single<{ id: string; created_at: string; status: string; leave_token: string }>();
      if (error || !data) throw error ?? new Error("no row");
      row = data;
    }

    // Already invited: say so rather than putting them back in the queue.
    if (row.status === "invited") return back({ ...placeParam, joined: "invited" });

    const position = await queuePosition(admin, row.created_at);
    const { cap } = await capacity(admin);
    const warn = waitMissesDeadline(w.inspectionDeadline, position, cap);
    const leaveUrl = `${SITE_URL}/report/waitlist/leave?token=${row.leave_token}`;

    if (!live) {
      void sendEmail({
        to: w.email,
        template: "report-waitlist-joined",
        props: { name: w.name, address: w.address, waitNote: waitNote(position, cap), deadlineWarning: warn ? DEADLINE_WARNING : undefined, leaveUrl },
        refId: `report-waitlist-joined-${row.id}`,
      }).catch(() => {});
      void notifyInbox(w.email, w.address, position, w.inspectionDeadline, warn).catch(() => {});
    }

    return back({ ...placeParam, joined: String(position), ...(warn ? { tight: "1" } : {}) });
  } catch (err) {
    console.error("[reports/waitlist] save failed:", err);
    return back({ ...placeParam, wl_error: "save" });
  }
}

async function notifyInbox(email: string, address: string, position: number, deadline: string | null, warn: boolean) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "SPARC Labs <hello@sparclabs.co>",
      to: [to],
      subject: `House report waitlist: number ${position}`,
      text: [
        `Someone joined the house report waitlist at number ${position}.`,
        `Email: ${email}`,
        `Address: ${address}`,
        deadline ? `Inspection deadline: ${deadline}${warn ? " (the wait will probably miss it; they were told)" : ""}` : null,
        "Invite the next people with: npx tsx scripts/waitlist.ts invite --next <n>",
      ].filter(Boolean).join("\n"),
    }),
  });
}
