"use client";

import * as React from "react";
import Link from "next/link";
import { Kicker } from "@/components/marketing/page-shell";
import { Em, Placeholder } from "@/components/system/placeholder";
import { TAGLINE_SHORT, BRAND_LONG, VERSION } from "@/lib/brand";

// This panel is an illustration of the interface. It previously opened
// "boston-heat.project" and ticked seven successful stages. There is no Boston
// run and there never was: the heat model is validated for Providence only. Do
// not name a city here, and do not name a project file that implies a completed
// study. The header says "illustration" for the same reason.
const BOOT_LINES = [
  { t: 80, text: "▸ sparc open <your-project>", kind: "cmd" },
  { t: 220, text: "  loading your data ·················· ok", kind: "ok" },
  { t: 360, text: "  reading spatial patterns ··········· ok", kind: "ok" },
  { t: 480, text: "  learning local relationships ······· ok", kind: "ok" },
  { t: 620, text: "  mapping causes and effects ········· ok", kind: "ok" },
  { t: 760, text: "  checking model confidence ·········· ok", kind: "ok" },
  { t: 900, text: "  scenario engine ready ·············· ok", kind: "ok" },
  { t: 1020, text: "▸ ready", kind: "ready" },
];

function TerminalSplash() {
  const [shown, setShown] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const timers = BOOT_LINES.map((l, i) => setTimeout(() => setShown(i + 1), l.t * 1.5));
    const p = setInterval(() => setProgress((v) => Math.min(100, v + 2.2)), 50);
    return () => { timers.forEach(clearTimeout); clearInterval(p); };
  }, []);
  return (
    <div style={{
      background: "#0e0a0c", color: "#f5efe4", borderRadius: 10,
      border: "1px solid var(--ink)", padding: "14px 18px 18px",
      fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7,
      position: "relative", overflow: "hidden",
      boxShadow: "0 24px 60px -20px rgba(26,20,22,0.35)",
      height: 360, display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #2a2227", marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, letterSpacing: "0.12em", color: "#8a7d72", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--crimson)" }} /> sparc · interface illustration
        </span>
        <span style={{ fontSize: 10, color: "#8a7d72", letterSpacing: "0.1em" }}>{VERSION} · {String(Math.floor(progress)).padStart(3, "0")}%</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {BOOT_LINES.slice(0, shown).map((l, i) => (
          <div key={i} className="fadeup" style={{
            color: l.kind === "cmd" ? "#fbdd46" : l.kind === "ready" ? "#e73c25" : "#d8d0c2",
            fontWeight: l.kind === "ready" ? 700 : 400, whiteSpace: "pre",
          }}>
            {l.text}
            {l.kind === "ok" && <span style={{ color: "#9e337d", marginLeft: 8 }}>✓</span>}
          </div>
        ))}
        {shown < BOOT_LINES.length && (
          <div style={{ color: "#f0b632" }}>
            ▸ <span style={{ background: "#f5efe4", color: "#0e0a0c", padding: "0 1px", animation: "blink 1s steps(2) infinite" }}>&nbsp;</span>
          </div>
        )}
      </div>
      <div style={{ marginTop: 14, height: 3, background: "#2a2227", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "linear-gradient(90deg, var(--crimson), var(--amber), var(--gold))",
          transition: "width .12s linear",
        }} />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section style={{ padding: "60px 0 80px", borderBottom: "1px solid var(--line)", position: "relative", overflow: "hidden" }} className="grid-bg">
      <div aria-hidden style={{
        position: "absolute", right: -200, top: -200, width: 700, height: 700,
        background: "radial-gradient(circle, rgba(231,60,37,0.08), transparent 60%)",
        pointerEvents: "none",
      }} />
      <div className="wrap split-105-95" style={{ alignItems: "center" }}>
        <div>
          <Kicker dot dotColor="var(--accent)">{TAGLINE_SHORT.toLowerCase()}</Kicker>
          <h1 style={{ fontSize: "var(--fs-hero)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.0, margin: "18px 0 22px", textWrap: "balance" }}>
            <span style={{
              backgroundImage: "var(--grad-ramp)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "rampShift 12s ease-in-out infinite",
            }}>Understand. Simulate. Adapt.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-2)", maxWidth: 560, lineHeight: 1.5, margin: "0 0 28px" }}>
            Spatial causal models for planners working on real places. SPARC
            ({BRAND_LONG}) learns how local variables connect, then simulates
            how a place might change under different decisions.
          </p>
          <div className="row" style={{ gap: 10, marginBottom: 8 }}>
            <Link href="/demo" className="btn btn-accent">Request access <span className="arrow">→</span></Link>
            <Link href="/product" className="btn">See the pipeline</Link>
          </div>
        </div>
        <TerminalSplash />
      </div>
    </section>
  );
}

// Not imported by any page, so this has never been public. It is kept only
// because the comment below is worth keeping with it. Every figure must match
// sparc-resilience/docs/results/reconciliation.md, which is the register and is
// enforced in that repo's CI. It previously carried R2 0.56 and a canopy effect
// of -0.24 degF; the register moved to 0.55 and -0.19 on 29 Oct and this was
// left stale. Do not reinstate the earlier 0.90-0.94 R2 values, the "z-unit"
// effects, or any city we have not run. Providence is the validated site, and
// the canopy effect is registered not_established: the model's figure is the
// same size as what the pipeline reports when no canopy effect is simulated at
// all, so it must not be quoted as a result.
export function ProofStrip() {
  const items = [
    { kicker: "canopy cooling · providence", value: "not established", sub: "+10 pp canopy · not distinguishable from zero", color: "var(--muted)" },
    { kicker: "impervious · providence", value: "−0.40 °F", sub: "−10 pp impervious · model and causal estimate agree", color: "var(--crimson)" },
    { kicker: "model fit · unseen neighbourhoods", value: "R² 0.55", sub: "2 km blocks held out · the honest number", color: "var(--purple)" },
    /* --amber-ink, not --amber: this 2px rule is the only thing framing the
       tile, so it is a boundary that carries meaning, and --amber sits at
       2.27:1 on paper. The darkened variant holds the hue at 4.75:1. */
    { kicker: "error vs. best baseline", value: "1.15 °F", sub: "RMSE · gradient boosting 1.37 °F", color: "var(--amber-ink)" },
  ];
  return (
    <section className="compact" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="wrap">
        <div className="grid-4">
          {items.map((it, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${it.color}`, paddingLeft: 16 }}>
              <div className="kicker">{it.kicker}</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 2px", fontFeatureSettings: "'tnum'" }}>{it.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }} className="mono">{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PipelineFlow() {
  const [stage, setStage] = React.useState(3);
  React.useEffect(() => {
    const iv = setInterval(() => setStage((s) => (s + 1) % 7), 2200);
    return () => clearInterval(iv);
  }, []);
  /* The stage badges used to be seven steps of the brand ramp under white
     text. Two of those pairs are unreadable -- white on --gold is 1.84:1 and
     white on --amber 2.50:1 -- and the ramp was encoding stage index, which is
     an ordered quantity on a ramp whose middle four steps sit inside a 19-level
     band out of 256. Stage identity is the number and the row position, both of
     which survive greyscale and neither of which needed a hue. Colour is left
     with the one job it is good at here: marking which row is shown. */
  const stages = [
    { n: "00", k: "Load Data", note: "maps · boundaries · data layers" },
    { n: "01", k: "Explore", note: "how variables cluster in space" },
    { n: "02", k: "Learn", note: "local models · one per location" },
    { n: "03", k: "Reason", note: "map causes and effects" },
    { n: "04", k: "Confidence", note: "repeated runs · uncertainty ranges" },
    { n: "05", k: "Simulate", note: "what-if scenarios · tradeoffs" },
    { n: "06", k: "Report", note: "audit trail · pdf · shareable" },
  ];
  return (
    <div className="card" style={{ padding: 0 }}>
      {/* The stage cycles on a setInterval. Nothing is running. The pill said
          "running . stage 0X" next to a pulsing live dot, which asserted a
          computation in progress; it now says "illustration" and the dot is
          gone. Do not reinstate a live indicator over a timer. */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="kicker">pipeline · 7 stages</div>
        <span className="pill">illustration · stage {String(stage).padStart(2, "0")}</span>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {stages.map((s, i) => {
          const status = i < stage ? "done" : i === stage ? "live" : "queued";
          return (
            <button key={i} onClick={() => setStage(i)} className="pipeline-row" style={{
              display: "grid", gridTemplateColumns: "44px 130px 1fr 90px", gap: 10, alignItems: "center",
              padding: "10px 12px", borderRadius: 5, cursor: "pointer", textAlign: "left",
              fontFamily: "inherit",
              background: i === stage ? "var(--paper)" : "transparent",
              border: i === stage ? "1px dashed var(--line)" : "1px solid transparent",
              transition: "all .15s",
            }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "3px 6px", borderRadius: 3, background: i === stage ? "var(--accent)" : "var(--fg)", color: "var(--paper)", textAlign: "center" }}>{s.n}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.k}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{s.note}</span>
              <span className="mono" style={{ fontSize: 10, color: status === "done" ? "var(--purple)" : status === "live" ? "var(--crimson)" : "var(--muted)", textAlign: "right" }}>
                {status === "done" ? "✓ step" : status === "live" ? "▸ shown" : "later"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PosteriorTrace() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setT((v) => v + 1), 80);
    return () => clearInterval(iv);
  }, []);
  // Four procedurally generated sine curves. These are not samples from any
  // posterior and no chain is running. The header said "live . 8 chains", which
  // contradicted this code and its own four-entry legend below. Do not put a
  // count or a live indicator on a drawing.
  const chains = [0, 1, 2, 3].map((c) => {
    const seed = c * 13 + 7;
    const amp = 0.18 + c * 0.07;
    const freq = 0.45 + c * 0.18;
    const drift = 0.08 + c * 0.05;
    const offset = -0.4 + c * 0.28;
    const pts: [number, number][] = [];
    for (let i = 0; i < 80; i++) {
      const x = i / 79;
      const noise = Math.sin((i + seed + t * 0.4) * freq) * amp
                  + Math.sin((i * 0.3 + seed) * 1.2 + c) * drift
                  + Math.cos((i * 0.17 + c * 2.1 + t * 0.22) * 0.9) * (amp * 0.4);
      pts.push([x, offset + noise]);
    }
    return pts;
  });
  /* Four legend swatches, so these are meaning-carrying non-text and owe 3:1.
     --amber was 2.27 and is replaced by its darkened variant; the other three
     already cleared. The curves are categorical, not ordered, so this is not a
     ramp and must not become one. */
  const chainColors = ["var(--crimson)", "var(--purple)", "var(--amber-ink)", "var(--magenta)"];
  const chainStrokes = [1.6, 1.1, 1.8, 1.3];
  const chainOpacities = [0.95, 0.7, 0.85, 0.6];
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="kicker">posterior trace</div>
        <span className="pill">illustration · not sampled data</span>
      </div>
      <div style={{ padding: 16 }}>
        <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none" role="img" aria-label="Illustration of what a posterior trace plot looks like. The curves are drawn, not sampled.">
          {chains.map((pts, c) => (
            <polyline key={c}
              points={pts.map(([x, y]) => `${x * 400},${80 + y * 60}`).join(" ")}
              fill="none" stroke={chainColors[c]} strokeWidth={chainStrokes[c]} opacity={chainOpacities[c]} />
          ))}
        </svg>
        <div className="row" style={{ gap: 16, marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
          {chainColors.map((c, i) => (
            <span key={i} className="row mono" style={{ gap: 5 }}>
              <span style={{ width: 8, height: 2, background: c }} /> trace {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Brought into the shared placeholder register. The interim treatment on this
   panel was right about the rule -- every numeral is an em dash at the same
   metrics, and the header label is at label weight rather than 10px muted
   mono -- and it was a second treatment, which is the one thing a register
   cannot have. It now renders through <Placeholder>, so it carries the same
   hatch and the same data-placeholder marker as the seven /product panels and
   it is covered by the same CI check. The word in the header is PLACEHOLDER
   because there is one vocabulary for this, not two.

   For the record, since the comment is worth keeping with the panel: this
   previously rendered +10.6 degC, +8.9 degC, sigma 0.38, -1.7 degC and
   0.71 -> 0.18 at 24px bold while its disclaimer rendered at 10px in muted
   mono. There is no Boston run and no scenario run of any city on this site.
   Do not put digits back in this panel. */
export function ScenarioCompare() {
  return (
    <Placeholder
      label="adaptation scenario"
      note="This panel shows where a baseline, a scenario and the difference between them go. It has never held a result."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {["Baseline", "+ canopy scenario"].map((label) => (
          <div key={label} data-ph-surface style={{ padding: "10px 12px" }}>
            <div className="kicker" style={{ fontSize: 9 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--fg-2)", margin: "4px 0 2px" }}>
              <Em />
            </div>
            <div className="mono" style={{ fontSize: "var(--fs-label)", color: "var(--fg-2)" }}><Em prefix="± " /></div>
          </div>
        ))}
        <div style={{ gridColumn: "1 / -1", padding: "8px 0 2px", borderTop: "1px dotted var(--rule)", display: "flex", justifyContent: "space-between" }}>
          <span className="kicker">Δ predicted mean</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}><Em /></span>
        </div>
      </div>
    </Placeholder>
  );
}
