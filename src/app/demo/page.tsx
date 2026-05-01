"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section, Kicker } from "@/components/marketing/page-shell";

const PROFESSIONS = [
  "Planner",
  "Researcher",
  "Engineer",
  "Government / Public sector",
  "Student",
  "Investor",
  "Other",
];

const ORG_SIZES = [
  "1–5",
  "6–25",
  "26–100",
  "101–500",
  "500+",
];

const NEXT_STEPS = [
  { n: "01", t: "We review", body: "We read every request personally \u2014 usually within a few business days." },
  { n: "02", t: "30-min walkthrough", body: "If there's a fit, we schedule a short call to learn about your project and show the app." },
  { n: "03", t: "Build + template", body: "We send a build with the right template pre-loaded for your domain and help you get rolling." },
];

function DemoForm({ initialIsInvestor }: { initialIsInvestor: boolean }) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [profession, setProfession] = React.useState(initialIsInvestor ? "Investor" : "");
  const [useCase, setUseCase] = React.useState("");
  const [orgSize, setOrgSize] = React.useState("");
  const [teamSize, setTeamSize] = React.useState("");
  const [isInvestor, setIsInvestor] = React.useState(initialIsInvestor);
  const [state, setState] = React.useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setError("");
    try {
      const res = await fetch("/api/account/request-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          organization: organization.trim(),
          profession: profession.trim(),
          use_case: useCase.trim(),
          org_size: orgSize.trim(),
          team_size: teamSize.trim(),
          is_investor: isInvestor,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <Kicker dot dotColor="var(--purple)">request received</Kicker>
        <h3 style={{ fontSize: 24, fontWeight: 700, margin: "14px 0 10px" }}>Thanks, {fullName.split(" ")[0] || "there"}.</h3>
        <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.55, margin: "0 auto", maxWidth: 480 }}>
          We&apos;ll be in touch at <strong>{email}</strong> within a few business days. In the meantime, feel free to{" "}
          <a href="/product" style={{ color: "var(--accent)" }}>tour the pipeline</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 28 }}>
      <div className="kicker">request access</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 18px" }}>Tell us about your work</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
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
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@org.org"
            autoComplete="email"
            maxLength={320}
          />
        </div>
        <div>
          <label className="label">Organization</label>
          <input
            className="input"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="City of Providence · Planning"
            autoComplete="organization"
            maxLength={200}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
          >
            <option value="">Select…</option>
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Org size</label>
          <select
            className="input"
            value={orgSize}
            onChange={(e) => setOrgSize(e.target.value)}
          >
            <option value="">Select…</option>
            {ORG_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Team size (would use SPARC)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={10000}
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            placeholder="3"
          />
        </div>
      </div>

      <label className="label" style={{ marginTop: 14 }}>What spatial question are you working on?</label>
      <textarea
        className="input"
        rows={4}
        value={useCase}
        onChange={(e) => setUseCase(e.target.value)}
        placeholder="Modeling urban heat across Providence neighborhoods to prioritize canopy investment…"
        maxLength={2000}
        style={{ resize: "vertical" }}
      />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, color: "var(--ink-2)" }}>
        <input
          type="checkbox"
          checked={isInvestor}
          onChange={(e) => setIsInvestor(e.target.checked)}
        />
        I&apos;m reaching out as an investor
      </label>

      {state === "error" && (
        <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid var(--crimson)", borderRadius: 6, color: "var(--crimson)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-accent"
        disabled={state === "submitting"}
        style={{ marginTop: 18, width: "100%", justifyContent: "center", padding: "12px 14px" }}
      >
        {state === "submitting" ? "Sending…" : "Send request"} <span className="arrow">→</span>
      </button>
    </form>
  );
}

function DemoFormShell() {
  const params = useSearchParams();
  const initialIsInvestor = params.get("role") === "investor";
  return <DemoForm initialIsInvestor={initialIsInvestor} />;
}

export default function DemoPage() {
  return (
    <>
      <Nav active="demo" />
      <PageHero
        kicker="pilot program · private beta"
        title="Request access."
        lead="We're piloting SPARC with a small group of planners, researchers, and agencies. Tell us about your work and we'll get back to you with a build."
      />
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, alignItems: "start" }}>
          <React.Suspense fallback={<div className="card" style={{ padding: 28 }}>Loading…</div>}>
            <DemoFormShell />
          </React.Suspense>
          <div>
            <Kicker dot dotColor="var(--purple)">what happens next</Kicker>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {NEXT_STEPS.map((s) => (
                <div key={s.n} className="card" style={{ padding: 18 }}>
                  <div className="row" style={{ alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "var(--ink)", color: "#fff" }}>{s.n}</span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{s.t}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{s.body}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              We&apos;re still upgrading the application and making sure things run smoothly. Pilot partners help us shape what comes next.
            </p>
          </div>
        </div>
      </Section>
      <Footer />
    </>
  );
}
