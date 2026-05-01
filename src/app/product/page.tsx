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
          accent="var(--purple)"
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
          accent="var(--magenta)"
          kicker="02 · correlogram"
          title="See how far your variables travel."
          lead="Before you fit anything, see the structure. SPARC computes Moran's I and Geary's C across lag distances and shows you where spatial autocorrelation falls off — the bandwidth that the rest of the pipeline will respect."
          items={[
            { k: "stats", v: "Moran's I · Geary's C · Getis-Ord G*" },
            { k: "lags", v: "isotropic + directional · permutation p-values" },
            { k: "bandwidth", v: "auto-selected from the elbow · overridable" },
            { k: "output", v: "feeds GWEN + SPARC kernel widths" },
          ]}
          visual={<CorrelogramVisual />}
        />

        <StageBlock
          index={2}
          num="03"
          anchor="gwen"
          accent="var(--pink)"
          kicker="03 · gwen"
          title="Geographically Weighted Elastic Net."
          lead="GWEN sweeps an elastic-net regression through every locale, shrinks the noise to zero, and tells you which variables actually matter where. The survivors carry signed coefficients into the neural stage — the rest get archived, not deleted."
          items={[
            { k: "model", v: "geographically weighted · elastic net · α tunable" },
            { k: "kernel", v: "adaptive bisquare · bandwidth from correlogram" },
            { k: "selection", v: "λ via 5-fold CV · stability across folds" },
            { k: "handoff", v: "retained variables + signs → SPARC + DAG" },
          ]}
          visual={<GwenVisual />}
        />

        <StageBlock
          index={3}
          num="04"
          anchor="sparc"
          accent="var(--crimson)"
          kicker="04 · sparc"
          title="Locally-weighted neural training."
          lead="SPARC's namesake stage: a geographically-weighted neural ensemble (GW3C) trained under monotone sign locks from GWEN. χ², σ, and physics constraints gate every checkpoint — if the model violates them, it doesn't advance."
          items={[
            { k: "architecture", v: "GW3C ensemble · 8 chains · per-locale heads" },
            { k: "training", v: "HMC warmup → NUTS · early-stop on χ² < 1.2" },
            { k: "constraints", v: "monotone signs · mass balance · physics class" },
            { k: "compute", v: "CUDA 11.8 · Apple MPS · CPU fallback" },
          ]}
          visual={<SparcVisual />}
        />

        <StageBlock
          index={4}
          num="05"
          anchor="causal"
          accent="var(--orange)"
          kicker="05 · causal analysis"
          title="MC³ over the DAG. NUTS over the posterior."
          lead="Causal structure isn't bolted on — it's sampled. MC³ explores the space of valid DAGs under your sign locks and physics classes; NUTS gives you a calibrated posterior over the surviving model. Every edge is auditable."
          items={[
            { k: "DAG search", v: "MC³ · cycle rejection · sign-locked priors" },
            { k: "posterior", v: "NUTS · 8 chains · 2k samples · R̂ ≤ 1.01" },
            { k: "review", v: "accept · reject · flip · constrain · annotate" },
            { k: "exports", v: "edge ledger · trace plots · counterfactual API" },
          ]}
          visual={<CausalVisual />}
        />

        <StageBlock
          index={5}
          num="06"
          anchor="simulation"
          accent="var(--amber)"
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
          accent="var(--gold)"
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
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 36 }}>
          {[
            { k: "philosophy · 01", t: "No black boxes.", b: "Every coefficient is interrogable. Every edge has a sign. Every prediction has a posterior." },
            { k: "philosophy · 02", t: "Physics, not vibes.", b: "Monotone constraints, mass balance, conservation laws — the model honors them or it doesn't run." },
            { k: "philosophy · 03", t: "Reproducible by default.", b: "project.yml is the source of truth. Every result is regenerable from a single command, 5 years from now." },
            { k: "philosophy · 04", t: "Your data stays yours.", b: "Ingest local. Train local. Nothing leaves your machine without your say-so. BYOK for the AI assist." },
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { k: "frontend", v: "Tauri 2.0 · React 18 · TypeScript", c: "var(--crimson)" },
            { k: "backend", v: "Python 3.12 · sidecar binary :8008", c: "var(--purple)" },
            { k: "model", v: "GW3C neural · 8-chain HMC", c: "var(--amber)" },
            { k: "geo stack", v: "GDAL · rasterio · GeoPandas", c: "var(--gold)" },
            { k: "compute", v: "CUDA 11.8 · MPS · CPU fallback", c: "var(--magenta)" },
            { k: "storage", v: "DuckDB · parquet · GeoTIFF", c: "var(--orange)" },
            { k: "ai assist", v: "Claude Sonnet 4.6 (BYOK)", c: "var(--pink)" },
            { k: "license", v: "AGPL · open core", c: "var(--red)" },
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
