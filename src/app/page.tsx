import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker, Section } from "@/components/marketing/page-shell";
import { Hero, PipelineFlow, PosteriorTrace, ScenarioCompare } from "@/components/marketing/landing-parts";

const PILLARS = [
  {
    kicker: "01 · the model",
    title: "Learns the rules of your specific place.",
    body: "SPARC doesn't use one formula for an entire city. It fits local patterns — so the relationship between trees and temperature in a dense downtown is different from a leafy suburb.",
    tag: "local + adaptive",
  },
  {
    kicker: "02 · cause, not correlation",
    title: "Knows why, not just what.",
    body: "You tell SPARC what causes what — or let it propose. Either way, it tracks the direction of effects, not just patterns in the data. That's the difference between description and explanation.",
    tag: "causal reasoning",
  },
  {
    kicker: "03 · simulate",
    title: "Try the change before you make it.",
    body: "Add tree canopy. Resurface roads with lighter materials. SPARC shows what would likely happen — with an honest range of uncertainty, location by location.",
    tag: "with confidence bands",
  },
];

// The n= counts below are not traceable to anything in the engine repository and
// three of these names may not be templates at all. They are flagged for the
// per-program evidence pages that replace this section; do not cite them as a
// count of anything until someone has checked them against sparc/templates/.
const TEMPLATES_PEEK = [
  { name: "UHI", sub: "Urban Heat Island", c: "var(--crimson)" },
  { name: "Coastal", sub: "Erosion + sea level", c: "var(--purple)" },
  { name: "Drought", sub: "Soil moisture · evapotranspiration", c: "var(--amber)" },
  { name: "Geotechnical", sub: "Bearing capacity", c: "var(--gold)" },
  { name: "Groundwater", sub: "Aquifer drawdown", c: "var(--magenta)" },
  { name: "Wildfire", sub: "Fuel · weather · spread rate", c: "var(--orange)" },
  { name: "Air Quality", sub: "PM₂.₅ + dispersion", c: "var(--pink)" },
  { name: "Stormwater", sub: "Runoff · flooding", c: "var(--red)" },
];

const STEPS = [
  { no: "01", k: "spatial patterns", title: "Explore", body: "Start with the data. SPARC maps how things vary across space and flags the patterns worth chasing." },
  { no: "02", k: "local models", title: "Learn", body: "Fit models everywhere at once — each location gets relationships calibrated to it, not to a city-wide average." },
  { no: "03", k: "cause & effect", title: "Reason", body: "Lay out what causes what. Accept SPARC's proposed structure, edit it, or write your own — physics constraints are built in." },
  { no: "04", k: "scenarios", title: "Adapt", body: "Compare interventions on one map. Get location-by-location confidence ranges and a full reproducible record." },
];

export default function HomePage() {
  return (
    <>
      <Nav active="home" />
      <Hero />

      <Section kicker="what it does" title="Three ideas, one workflow." lead="A practical tool for spatial science. You can audit every step, question every coefficient, and put a confidence number next to every claim.">
        <div className="grid-3" style={{ gap: 18 }}>
          {PILLARS.map((it, i) => (
            <div key={i} className="card" style={{ padding: 24, position: "relative" }}>
              <div className="kicker">{it.kicker}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "10px 0 12px", textWrap: "pretty" }}>{it.title}</h3>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{it.body}</p>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                <span className="pill" style={{ background: "transparent", border: "1px solid var(--line)" }}>{it.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* This section used to be headed "live . interactive" and led with "A
          simplified urban-heat study on Boston, MA. Every step is tracked and can
          be reproduced exactly." There is no Boston run. The heat model is
          validated for Providence only, and the three panels below are drawings
          of the interface rather than output from any run. Do not attach a city
          or a reproducibility claim to them. */}
      <section style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <Kicker>illustration · not a run</Kicker>
              <h2 style={{ marginTop: 8 }}>The Pipeline.</h2>
            </div>
            <p className="lead">What the four stages look like in the application. These panels are drawn to show the interface, not produced by a model run — our validated results and their failure modes live in the methodology reports.</p>
          </div>
          <div className="split-14-10" style={{ gap: 18, alignItems: "stretch" }}>
            <PipelineFlow />
            <div className="col" style={{ gap: 18 }}>
              <PosteriorTrace />
              <ScenarioCompare />
            </div>
          </div>
        </div>
      </section>

      <Section
        kicker="in development"
        title="Domain-agnostic, not domain-naive."
        action={<Link href="/domains" className="btn">All domains <span className="arrow">→</span></Link>}
      >
        <div className="grid-4" style={{ gap: 14 }}>
          {TEMPLATES_PEEK.map((it) => (
            <div key={it.name} className="card" style={{ padding: 16, borderLeft: `2px solid ${it.c}` }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{it.name}</h4>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{it.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="how it works" title="Explore → Learn → Reason → Adapt." lead="Four steps, in plain language. The same flow whether you're studying heat in a city or moisture in a watershed.">
        <div className="steps-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          {STEPS.map((s, i) => (
            <div key={i} className="steps-cell" data-last={i === 3 ? "true" : undefined} style={{ padding: "26px 22px", borderRight: i < 3 ? "1px solid var(--line)" : "none", position: "relative" }}>
              <div className="row" style={{ alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "var(--ink)", color: "#fff" }}>{s.no}</span>
                <span className="kicker">{s.k}</span>
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 10px" }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* "private beta" was removed here on 2026-10-30. There are no beta
          partners. The same claim was taken off /domains on 29 Oct and this page
          was missed. Do not describe a beta cohort until there is one. */}
      <section style={{ borderTop: "1px solid var(--line)" }} className="grid-bg">
        <div className="wrap" style={{ textAlign: "center", padding: "48px 0" }}>
          <Kicker dot dotColor="var(--accent)">pilot program</Kicker>
          <h2 style={{ fontSize: "var(--fs-h1)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.05, margin: "16px auto 18px", maxWidth: 800, textWrap: "balance" }}>
            We&apos;re still building the app.<br />Pilot with us.
          </h2>
          <p style={{ color: "var(--ink-2)", maxWidth: 580, margin: "0 auto 24px", fontSize: 16 }}>
            There is nothing to download yet. We&apos;re building the
            application, and we&apos;d rather work with a small number of
            planners and researchers on real projects than ship something
            half-finished. Tell us about your area of interest and we&apos;ll see
            if there&apos;s a fit.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Link href="/demo" className="btn btn-accent">Request access <span className="arrow">→</span></Link>
            <Link href="/product" className="btn">Tour the pipeline</Link>
          </div>
        </div>
        <div style={{ borderTop: "1px dashed var(--line)" }}>
          <div className="wrap" style={{ padding: "18px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap", color: "var(--muted)", fontSize: 13 }}>
            <span>Building tools for places? <strong style={{ color: "var(--ink-2)" }}>We&apos;re talking to a small group of mission-aligned investors.</strong></span>
            <Link href={{ pathname: "/demo", query: { role: "investor" } }} className="mono" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", letterSpacing: "0.04em" }}>get in touch →</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
