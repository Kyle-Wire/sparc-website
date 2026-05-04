import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const NOTIFY_TO = process.env.DEMO_NOTIFY_TO ?? "kylewire1899@gmail.com";
// Until you verify sparclabs.co in Resend, keep using the sandbox sender.
const FROM = process.env.RESEND_FROM ?? "SPARC Labs <onboarding@resend.dev>";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const stripCtl = (s: string) => s.replace(/[\r\n\0]/g, "");

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const ip = clientIp(req);
  const rl = await checkRateLimit("publicForm", `request-demo:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } },
    );
  }

  let body: {
    email?: string;
    full_name?: string;
    organization?: string;
    profession?: string;
    use_case?: string;
    org_size?: string;
    team_size?: string | number;
    is_investor?: boolean;
    turnstileToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ ok: false, error: "captcha_failed" }, { status: 403 });
  }

  const email = stripCtl(String(body.email ?? "").trim()).slice(0, 320);
  const full_name = stripCtl(String(body.full_name ?? "").trim()).slice(0, 200);
  const organization = stripCtl(String(body.organization ?? "").trim()).slice(0, 200);
  const profession = stripCtl(String(body.profession ?? "").trim()).slice(0, 100);
  const use_case = stripCtl(String(body.use_case ?? "").trim()).slice(0, 2000);
  const org_size = stripCtl(String(body.org_size ?? "").trim()).slice(0, 50);
  const team_size = stripCtl(String(body.team_size ?? "").trim()).slice(0, 20);
  const is_investor = Boolean(body.is_investor);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "valid email required" }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const firstName = full_name.split(" ")[0] || "there";

  // 1) Internal notification
  const notify = await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: email,
    subject: `${is_investor ? "[INVESTOR] " : ""}Demo request: ${full_name || email}`,
    html: `
      <h2 style="margin:0 0 12px;font-family:system-ui">New SPARC Labs signup / demo request${is_investor ? " \u2014 investor" : ""}</h2>
      <table style="font-family:system-ui;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${escape(full_name) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Role</td><td>${escape(profession) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Organization</td><td>${escape(organization) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Org size</td><td>${escape(org_size) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Team size</td><td>${escape(team_size) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">Use case</td><td style="white-space:pre-wrap">${escape(use_case) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Investor?</td><td>${is_investor ? "<strong>Yes</strong>" : "No"}</td></tr>
      </table>
    `,
  });

  // 2) Friendly confirmation back to the user — branded React Email template.
  const confirm = await sendEmail({
    to: email,
    template: "demo-request-received",
    props: { firstName },
  });

  if (notify.error || !confirm.ok) {
    return NextResponse.json(
      { ok: false, notify: notify.error, confirm: confirm.error },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
