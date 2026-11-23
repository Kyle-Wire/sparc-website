"use client";

import * as React from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/brand";

export function ForgotForm() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent("/account/password")}`,
      });
      // A refusal for an unknown address is shown the same as a success, so
      // the form never tells anyone whether an email has an account here.
      if (error && error.status !== 400 && error.status !== 404) throw error;
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="card" role="status" style={{ padding: 28, textAlign: "center" }}>
        <div className="kicker" style={{ justifyContent: "center" }}>check your email</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 8px" }}>Look for a link from us.</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          If <strong>{email}</strong> has an account here, a link to choose a new password is on its way. It works
          once. Nothing arrived after a few minutes? Check spam, or <Link href="/contact">write to us</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <form onSubmit={submit}>
        <label className="label" htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button
          type="submit"
          className="btn btn-accent"
          style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
          disabled={state === "sending"}
        >
          {state === "sending" ? "Sending…" : "Send me a link"} <span className="arrow">→</span>
        </button>
      </form>
      {state === "error" && (
        <p role="alert" style={{ color: "var(--crimson)", marginTop: 12, fontSize: 13 }}>
          We could not send the link just now. Please try again in a minute.
        </p>
      )}
      <p style={{ marginTop: 14, fontSize: 13, textAlign: "center" }}>
        <Link href="/login" style={{ color: "var(--ink-2)" }}>Back to sign in</Link>
      </p>
    </div>
  );
}
