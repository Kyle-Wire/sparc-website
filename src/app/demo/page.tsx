"use client";

import * as React from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section, Kicker } from "@/components/marketing/page-shell";

const PROFESSIONS = [
  "Planner",
  "Researcher",
  "Engineer",
  "Government / Public sector",
  "Student",
  "Other",
];

const ORG_SIZES = [
  "1–5",
  "6–25",
  "26–100",
  "101–500",
  "500+",
];

const PILOT_STRUCTURE = [
  {
    n: "01",
    t: "Scope it together.",
    body: "You bring the spatial question — an existing proposal, a policy decision, a planning scenario under review. We map it to the model together: domain template, causal structure, scenario parameters. No off-the-shelf setup.",
  },
  {
    n: "02",
    t: "~6 months.",
    body: "Enough time to run a complete pipeline, validate outputs against your domain knowledge, iterate on the causal structure, and produce a final report. Timelines flex to your data availability and review cycles.",
  },
  {
    n: "03",
    t: "What you provide.",
    body: "Your spatial data: rasters, shapefiles, parcel records, permits, any existing layers. The scenarios you want to test — the interventions, zoning changes, or infrastructure investments currently on the table.",
  },
  {
    n: "04",
    t: "What you get.",
    body: "Scenario outputs with location-level confidence intervals, and the limits stated alongside them — including where the model is not validated for what you are asking. A record of the run: the configuration, the assumptions and the steps. A report formatted for your audience: planning committee, grant application, or capital plan.",
  },
];

// Step 03 used to read: "Build + template -- We send a build with the right
// template pre-loaded for your domain and help you get rolling." There is no
// build to send. The route we can actually offer is that we run the work and
// hand over the results, so that is what this now says.
const NEXT_STEPS = [
  { n: "01", t: "We review", body: "We read every request personally — usually within a few business days." },
  { n: "02", t: "30-min walkthrough", body: "If there's a fit, we schedule a short call to learn about your project and show you what the model does and where it stops." },
  { n: "03", t: "We scope the work", body: "There is nothing to download yet. If it fits, we agree a scope and run the study ourselves, and you get the results and the record behind them." },
];

function DemoForm() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [profession, setProfession] = React.useState("");
  const [useCase, setUseCase] = React.useState("");
  const [orgSize, setOrgSize] = React.useState("");
  const [teamSize, setTeamSize] = React.useState("");
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

      <div className="grid-2" style={{ gap: 14 }}>
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
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
            placeholder="Organization · team"
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
        placeholder="The decision you are trying to make, the area it covers, and the data you already hold…"
        maxLength={2000}
        style={{ resize: "vertical" }}
      />

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
  return <DemoForm />;
}

export default function DemoPage() {
  return (
    <>
      <Nav active="demo" />
      {/* The kicker said "pilot program . private beta" and the lead said we run
          pilots "with a small cohort of planning teams, researchers, and
          agencies". There is no cohort and there is no beta: there are three
          letters of intent and no signed engagement. Do not describe a cohort
          until one exists. */}
      <PageHero
        kicker="pilot program"
        title="Request access."
        lead="We are looking for a small number of planning teams, researchers and agencies to run structured pilots with. Tell us about your spatial question and we'll be in touch."
      />
      <Section>
        <div className="split-12-10" style={{ gap: 28, alignItems: "start" }}>
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
              We&apos;re still building the application. Pilot partners help us
              shape what comes next, and get the work done by us in the meantime.
            </p>
          </div>
        </div>
      </Section>

      <Section sunken kicker="structure · research pilot" title="What a pilot looks like.">
        <div className="grid-2" style={{ gap: 18 }}>
          {PILOT_STRUCTURE.map((p) => (
            <div key={p.n} className="card" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: 22 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 3, background: "var(--ink)", color: "#fff", height: "fit-content", letterSpacing: "0.1em" }}>{p.n}</span>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px" }}>{p.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{p.body}</p>
              </div>
            </div>
          ))}
        </div>
        {/* This closing line used to claim that "every project pins its
            dependencies and records a run manifest, so a result can be
            regenerated from the project file it came from". That is not true of
            the figure of record: the Providence run directory is gone and the
            company accepted that deliberately rather than regenerate it, and
            neither the flood nor the wind benchmark results are pinned to the
            commit that produced them. Retaining the run directory is now the
            rule for any future run of record, which is a forward commitment and
            must not be written as an existing property. */}
        <p style={{ marginTop: 24, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, borderTop: "1px dashed var(--rule)", paddingTop: 18 }}>
          Every pilot keeps its run directory, its configuration and its software
          versions, so the result can be traced to the run that produced it. Where
          an earlier result cannot be regenerated, we say so rather than imply
          otherwise — the methodology reports name those cases.
        </p>
      </Section>
      <Footer />
    </>
  );
}
