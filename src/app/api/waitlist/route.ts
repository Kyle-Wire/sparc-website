import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const NO_CTRL = (s: string) => s.replace(/[\r\n\0]/g, "");

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit("publicForm", `waitlist:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } },
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return NextResponse.json({ error: "captcha_failed" }, { status: 403 });

  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 320);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const row = {
    email,
    name: NO_CTRL(String(body.name ?? "")).slice(0, 200) || null,
    organization: NO_CTRL(String(body.org ?? "")).slice(0, 200) || null,
    domain: NO_CTRL(String(body.domain ?? "")).slice(0, 64) || null,
    crs: NO_CTRL(String(body.crs ?? "")).slice(0, 64) || null,
    reason: NO_CTRL(String(body.reason ?? "")).slice(0, 4000) || null,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 500) || null,
    referer: (req.headers.get("referer") ?? "").slice(0, 500) || null,
  };

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("waitlist").upsert(row, { onConflict: "email" }).select("id").single();
    if (error) throw error;

    const ticket = String(data.id).slice(0, 8);

    // Optional notification — fire-and-forget so the user isn't blocked on email delivery.
    void notify(row).catch(() => {});

    // User-facing waitlist confirmation (branded React Email template).
    void sendEmail({
      to: email,
      template: "waitlist-confirmation",
      props: { email, ticket },
    }).catch(() => {});

    return NextResponse.json({ ok: true, ticket });
  } catch (err) {
    // If Supabase isn't configured yet we still want the form to feel real in dev.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[waitlist] persist skipped:", err);
      return NextResponse.json({ ok: true, ticket: "DEV-" + Math.random().toString(36).slice(2, 8) });
    }
    return NextResponse.json({ error: "could not save request" }, { status: 500 });
  }
}

async function notify(row: Record<string, unknown>) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "SPARC Waitlist <waitlist@sparclabs.co>",
      to: [to],
      subject: `Waitlist · ${row.email}`,
      text: Object.entries(row).map(([k, v]) => `${k}: ${v ?? ""}`).join("\n"),
    }),
  });
}
