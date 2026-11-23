"use client";

import * as React from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const [password, setPassword] = React.useState("");
  const [again, setAgain] = React.useState("");
  const [state, setState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== again) {
      setState("error");
      setMessage("The two passwords are not the same.");
      return;
    }
    setState("saving");
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("saved");
  }

  if (state === "saved") {
    return (
      <div className="card" role="status" style={{ padding: 28, textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Your password is changed.</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "0 0 16px" }}>Use it next time you sign in.</p>
        <Link href="/account/reports" className="btn btn-accent">Go to your reports <span className="arrow">→</span></Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <form onSubmit={submit}>
        <label className="label" htmlFor="pw-new">New password</label>
        <input id="pw-new" className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <label className="label" htmlFor="pw-again" style={{ marginTop: 12 }}>The same again</label>
        <input id="pw-again" className="input" type="password" required minLength={8} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
        <button type="submit" className="btn btn-accent" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save the new password"} <span className="arrow">→</span>
        </button>
      </form>
      {state === "error" && (
        <p role="alert" style={{ color: "var(--crimson)", marginTop: 12, fontSize: 13 }}>{message}</p>
      )}
    </div>
  );
}
