"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/brand";

const PROFESSIONS = [
  "Researcher / Faculty",
  "Graduate student",
  "Undergraduate student",
  "Industry / Practitioner",
  "Public sector / Government",
  "Journalist",
  "Other",
];

export function LoginForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [fullName, setFullName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [profession, setProfession] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [state, setState] = React.useState<"idle" | "submitting" | "confirm-sent" | "error">("idle");
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
            data: {
              full_name: fullName.trim(),
              organization: organization.trim(),
              profession: profession.trim(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setState("confirm-sent");
          return;
        }
        router.push(next as Route);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next as Route);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "confirm-sent") {
    return (
      <div className="card" style={{ padding: 28, textAlign: "center" }}>
        <div className="kicker" style={{ justifyContent: "center" }}>confirm your email</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 8px" }}>Check your inbox.</h3>
        <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <div className="kicker">{mode === "signup" ? "create your account" : "sign in"}</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 16px" }}>
        {mode === "signup" ? "Tell us about yourself" : "Welcome back"}
      </h3>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label className="label">Full name</label>
            <input
              className="input"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Naomi Schaal"
              autoComplete="name"
              maxLength={200}
            />
            <label className="label" style={{ marginTop: 12 }}>Organization</label>
            <input
              className="input"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="UC Berkeley · Geography"
              autoComplete="organization"
              maxLength={200}
            />
            <label className="label" style={{ marginTop: 12 }}>Profession</label>
            <select
              className="input"
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              <option value="" disabled>Select one…</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <label className="label" style={{ marginTop: 12 }}>Email</label>
          </>
        )}
        {mode === "signin" && <label className="label">Email</label>}
        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
        />
        <label className="label" style={{ marginTop: 12 }}>Password</label>
        <input
          className="input"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        <button
          type="submit"
          className="btn btn-accent"
          style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
          disabled={state === "submitting"}
        >
          {state === "submitting"
            ? mode === "signup" ? "Creating account…" : "Signing in…"
            : mode === "signup" ? "Create account" : "Sign in"} <span className="arrow">→</span>
        </button>
      </form>

      {error && <p style={{ color: "var(--crimson)", marginTop: 12, fontSize: 13 }}>{error}</p>}
    </div>
  );
}
