import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const NOTIFY_TO = process.env.DEMO_NOTIFY_TO ?? "kylewire1899@gmail.com";
// Until you verify sparclabs.co in Resend, keep using the sandbox sender.
const FROM = process.env.RESEND_FROM ?? "SPARC Labs <onboarding@resend.dev>";

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  let body: {
    email?: string;
    full_name?: string;
    organization?: string;
    profession?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().slice(0, 320);
  const full_name = String(body.full_name ?? "").trim().slice(0, 200);
  const organization = String(body.organization ?? "").trim().slice(0, 200);
  const profession = String(body.profession ?? "").trim().slice(0, 100);

  if (!email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const firstName = full_name.split(" ")[0] || "there";

  // 1) Internal notification
  const notify = await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: email,
    subject: `Demo request: ${full_name || email}`,
    html: `
      <h2 style="margin:0 0 12px;font-family:system-ui">New SPARC Labs signup / demo request</h2>
      <table style="font-family:system-ui;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${escape(full_name) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Profession</td><td>${escape(profession) || "<em>not provided</em>"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Organization</td><td>${escape(organization) || "<em>not provided</em>"}</td></tr>
      </table>
    `,
  });

  // 2) Friendly confirmation back to the user
  const confirm = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Thanks — your SPARC Labs demo request is in",
    html: `
      <div style="font-family:system-ui;font-size:15px;line-height:1.55;color:#111">
        <p>Hi ${escape(firstName)},</p>
        <p>Thanks for signing up for SPARC Labs. We received your request and will be in touch shortly to schedule a demo and answer any questions.</p>
        <p>In the meantime, you can sign in at <a href="https://sparclabs.co/login">sparclabs.co/login</a>.</p>
        <p>— The SPARC Labs team</p>
      </div>
    `,
  });

  if (notify.error || confirm.error) {
    return NextResponse.json(
      { ok: false, notify: notify.error, confirm: confirm.error },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
