import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker, Section } from "@/components/marketing/page-shell";
import { Hero, PipelineFlow, PosteriorTrace, ScenarioCompare } from "@/components/marketing/landing-parts";

const PILLARS = [
  {
    kicker: "01 · the model",
    title: "A spatial neural model.",
    body: "SPARC learns how variables behave here vs. there. Instead of one global formula, every location gets its own little model — and they share what they learn.",
    tag: "local + spatial",
  },
  {
    kicker: "02 · causal, not correlational",
    title: "Knows why, not just what.",
    body: "You tell SPARC what causes what (or let it propose a structure). It respects direction and physics — so the relationships it finds aren't just patterns, they're explanations.",
    tag: "directed structure",
  },
  {
    kicker: "03 · simulate",
    title: "Try the change before you make it.",
    body: "Add canopy. Reduce impervious surface. SPARC shows you what would likely happen — and how confident it is, pixel by pixel.",
    tag: "with uncertainty",
  },
];

const TEMPLATES_PEEK = [
  { name: "UHI", sub: "Urban Heat Island", n: 24, c: "var(--crimson)" },
  { name: "Coastal", sub: "Erosion + sea level", n: 18, c: "var(--purple)" },
  { name: "Drought", sub: "Soil moisture · ET", n: 21, c: "var(--amber)" },
  { name: "Geotechnical", sub: "Bearing capacity", n: 16, c: "var(--gold)" },
  { name: "Groundwater", sub: "Aquifer drawdown", n: 19, c: "var(--magenta)" },
  { name: "Wildfire", sub: "Fuel · weather · ROS", n: 27, c: "var(--orange)" },
  { name: "Air Quality", sub: "PM₂.₅ + dispersion", n: 22, c: "var(--pink)" },
  { name: "Stormwater", sub: "Runoff · flooding", n: 17, c: "var(--red)" },
];

const STEPS = [
  { no: "01", k: "correlogram", title: "Explore", body: "Start with the data. SPARC maps how things vary across space and flags the patterns worth chasing." },
  { no: "02", k: "SPARC neural", title: "Learn", body: "Train local models everywhere at once. Each location gets coefficients that fit it, not the average." },
  { no: "03", k: "causal", title: "Reason", body: "Lay out what causes what. Accept SPARC's proposed structure, edit it, or write your own — physics constraints are first-class." },
  { no: "04", k: "simulate", title: "Adapt", body: "Compare scenarios on one map. Get pixel-wise uncertainty and a reproducible audit trail." },
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

      <section style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <Kicker dot dotColor="var(--purple)">live · interactive</Kicker>
              <h2 style={{ marginTop: 8 }}>The Pipeline.</h2>
            </div>
            <p className="lead">A simplified urban-heat run on Boston, MA. Every stage is reproducible from one <code className="mono">project.yml</code>.</p>
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
        kicker="private beta · 2 active domains · more on the roadmap"
        title="Domain-agnostic, not domain-naive."
        action={<Link href="/domains" className="btn">All domains <span className="arrow">→</span></Link>}
      >
        <div className="grid-4" style={{ gap: 14 }}>
          {TEMPLATES_PEEK.map((it) => (
            <div key={it.name} className="card" style={{ padding: 16, borderLeft: `2px solid ${it.c}` }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{it.name}</h4>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>n={it.n}</span>
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

      <section style={{ borderTop: "1px solid var(--line)" }} className="grid-bg">
        <div className="wrap" style={{ textAlign: "center", padding: "48px 0" }}>
          <Kicker dot dotColor="var(--accent)">pilot program · private beta</Kicker>
          <h2 style={{ fontSize: "var(--fs-h1)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.05, margin: "16px auto 18px", maxWidth: 800, textWrap: "balance" }}>
            We&apos;re still polishing the app.<br />Pilot with us.
          </h2>
          <p style={{ color: "var(--ink-2)", maxWidth: 580, margin: "0 auto 24px", fontSize: 16 }}>
            SPARC is in private beta. We&apos;re upgrading the application,
            smoothing rough edges, and partnering with planners and researchers
            on real projects. Tell us about your area of interest and we&apos;ll
            see if there&apos;s a fit.
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
