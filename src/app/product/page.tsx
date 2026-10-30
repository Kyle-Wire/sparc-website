import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import {
  StageStack,
  StageBlock,
  IngestVisual,
  CorrelogramVisual,
  GwenVisual,
  SparcVisual,
  CausalVisual,
  SimulationVisual,
  ReportVisual,
} from "./stage-parts";

export default function ProductPage() {
  return (
    <>
      <Nav active="product" />
      <PageHero
        kicker="product · sparc desktop"
        title="Seven stages. Scroll the pipeline."
        lead="SPARC is a Tauri/React desktop app wrapped around one thing: a seven-stage neural pipeline with built-in causal inference. Bring your own data, watch each stage open as you scroll, and finish with a report shaped for who's reading it."
      />

      <StageStack>
        <StageBlock
          index={0}
          num="01"
          anchor="ingest"
          kicker="01 · ingestion"
          title="Bring your own data. Or build it in app."
          lead="Drop in rasters, shapefiles, GeoJSON boundaries, parquet tables, or a project.yml — SPARC reprojects, resamples, and clips them to your study area without ever phoning home. Pull in canopy, impervious, parcels, permits, and equity layers, then pin the whole thing to a single manifest."
          items={[
            { k: "formats", v: "GeoTIFF · Shapefile · GeoJSON · Parquet · CSV · NetCDF" },
            { k: "transforms", v: "reproject · resample · clip · rasterize · join" },
            { k: "boundaries", v: "tracts · blocks · districts · custom polygons" },
            { k: "manifest", v: "project.yml · sha-pinned · regenerable" },
          ]}
          visual={<IngestVisual />}
        />

        <StageBlock
          index={1}
          num="02"
          anchor="correlogram"
          kicker="02 · spatial structure"
          title="See how far your variables travel."
          lead="Before fitting any model, SPARC maps how tightly each variable clusters in space — measuring the distance at which two locations stop influencing each other. That range shapes every downstream step."
          items={[
            { k: "measures", v: "clustering strength · direction · distance scale" },
            { k: "tested at", v: "many distance intervals · with significance checks" },
            { k: "range", v: "auto-detected from the data · overridable" },
            { k: "feeds into", v: "model training · validation splits · scenario engine" },
          ]}
          visual={<CorrelogramVisual />}
        />

        <StageBlock
          index={2}
          num="03"
          anchor="gwen"
          kicker="03 · variable selection"
          title="Find what actually matters, where."
          lead="This stage sweeps a local statistical model across every location — stripping noise and identifying which variables carry a real signal in each neighborhood. Only the meaningful ones move forward, with their direction of effect preserved."
          items={[
            { k: "approach", v: "local regression · noise suppression · fully tunable" },
            { k: "neighborhood", v: "each location weighted by proximity to its neighbors" },
            { k: "selection", v: "cross-validated · tested for stability across runs" },
            { k: "passes forward", v: "meaningful variables + their effect directions" },
          ]}
          visual={<GwenVisual />}
        />

        <StageBlock
          index={3}
          num="04"
          anchor="sparc"
          kicker="04 · local learning"
          title="A model that fits your city, not the average city."
          lead="The core SPARC stage: a neural model trained at every location simultaneously, with effect directions locked to what the previous stage found and physics enforced at every checkpoint. If a result violates either, it doesn't advance."
          items={[
            { k: "structure", v: "8 independent model runs · per-location predictions" },
            { k: "training", v: "guided sampling · stops when fit is good enough" },
            { k: "guardrails", v: "effect directions locked · physical laws enforced" },
            { k: "runs on", v: "GPU · Apple Silicon · standard CPU" },
          ]}
          visual={<SparcVisual />}
        />

        <StageBlock
          index={4}
          num="05"
          anchor="causal"
          kicker="05 · causal analysis"
          title="Find what actually causes what — then test it."
          lead="Causal structure is explored, not assumed. SPARC searches the space of valid cause-and-effect maps that fit your data, then builds a probability distribution over which connections are most credible. Every link is auditable."
          items={[
            { k: "search", v: "explores all plausible cause-and-effect structures" },
            { k: "confidence", v: "8 runs · 2,000 samples each · convergence reported" },
            { k: "review", v: "accept · reject · flip · constrain · annotate" },
            { k: "exports", v: "connection log · confidence charts · what-if API" },
          ]}
          visual={<CausalVisual />}
        />

        <StageBlock
          index={5}
          num="06"
          anchor="simulation"
          kicker="06 · simulation"
          title="Scenarios with budgets and equity, not just sliders."
          lead="Push the model with real constraints. Set a dollar budget. Toggle equity layers — heat vulnerability, income, canopy access — as inputs the optimizer must honor. Get back a posterior raster, not a single number."
          items={[
            { k: "perturbations", v: "additive · multiplicative · masked · optimized" },
            { k: "constraints", v: "$ budgets · per-tract caps · equity floors" },
            { k: "outputs", v: "mean · σ · diff · counterfactual rasters" },
            { k: "compare", v: "side-by-side · paired t · drift map" },
          ]}
          visual={<SimulationVisual />}
        />

        <StageBlock
          index={6}
          num="07"
          anchor="report"
          kicker="07 · report"
          title="One pipeline. Three audiences."
          lead="The same run produces three reports: Technical (methods, posterior diagnostics, code refs), Planner (briefs, tradeoffs, equity overlays), and Public (plain-language, before/after, FAQ). Each one ships with a signed manifest so anyone can re-run it."
          items={[
            { k: "audiences", v: "Technical · Planner · Public" },
            { k: "formats", v: ".pdf · .md · .html · figures · manifest.json" },
            { k: "provenance", v: "project.yml hash · stage checksums · build id" },
            { k: "branding", v: "agency theme · logo · footer disclosures" },
          ]}
          visual={<ReportVisual />}
        />
      </StageStack>

      <section style={{ background: "var(--ink)", color: "var(--paper)", padding: "60px 0", borderBottom: "1px solid var(--ink)" }}>
        <div className="wrap grid-4" style={{ gap: 36 }}>
          {[
            { k: "philosophy · 01", t: "No black boxes.", b: "Every number has a source. Every effect has a direction. Every prediction comes with a confidence range." },
            { k: "philosophy · 02", t: "Physics, not vibes.", b: "The model must respect how heat, water, and air actually behave — or it doesn't run." },
            { k: "philosophy · 03", t: "Reproducible by default.", b: "Every project saves as a single file. Any result can be regenerated exactly, years from now, on any machine." },
            { k: "philosophy · 04", t: "Your data stays yours.", b: "Everything runs on your machine. Nothing is uploaded or shared without your explicit say-so." },
          ].map((p, i) => (
            <div key={i} style={{ borderTop: "1px solid rgba(245,239,228,0.3)", paddingTop: 24 }}>
              <div className="kicker" style={{ color: "rgba(245,239,228,0.5)" }}>{p.k}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "10px 0 12px", color: "var(--paper)" }}>{p.t}</h3>
              <p style={{ color: "rgba(245,239,228,0.75)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      <Section kicker="under the hood" title="What's actually running.">
        <div className="grid-4" style={{ gap: 14 }}>
          {[
            { k: "frontend", v: "Tauri 2.0 · React 18 · TypeScript", c: "var(--crimson)" },
            { k: "backend", v: "Python 3.12 · local background process", c: "var(--purple)" },
            { k: "model", v: "geographically-weighted neural · 8-run sampling", c: "var(--amber)" },
            { k: "geo stack", v: "GDAL · rasterio · GeoPandas", c: "var(--gold)" },
            { k: "compute", v: "CUDA 11.8 · MPS · CPU fallback", c: "var(--magenta)" },
            { k: "storage", v: "DuckDB · parquet · GeoTIFF", c: "var(--orange)" },
            { k: "ai assist", v: "Claude Sonnet 4.6 · bring your own key", c: "var(--pink)" },
            { k: "license", v: "proprietary · subscription", c: "var(--red)" },
          ].map((r, i) => (
            <div key={i} className="card" style={{ borderLeft: `2px solid ${r.c}` }}>
              <div className="kicker">{r.k}</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </Section>

      <section style={{ borderTop: "1px solid var(--line)", padding: "56px 0" }} className="grid-bg">
        <div className="wrap" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 16px" }}>Ready to run the pipeline?</h2>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Link href="/demo" className="btn btn-accent">Request access <span className="arrow">→</span></Link>
            <Link href="/domains" className="btn">Browse domains</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
