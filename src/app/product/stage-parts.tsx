"use client";

import * as React from "react";
import {
  Em,
  Placeholder,
  PlaceholderPlot,
  PlaceholderSlider,
  PlaceholderTrack,
} from "@/components/system/placeholder";

/* ============================================================================
   Every visual below is a placeholder, and that is a decision rather than an
   accident of the current data situation.

   Before this pass, seven panels on this page rendered numbers that no run
   produced: a passing validation chi-squared, a Philadelphia scenario with a
   dollar budget and a tract count, an eight-chain architecture with an R-hat,
   a Moran's I with a p-value, elastic-net coefficients to two decimal places,
   and a planner brief recommending a canopy intervention the validation
   register records as not established. Two of them carried honest source
   comments saying exactly that. The comments were accurate and the panels
   still read as results, because VCard rendered its disclaimer at 10px muted
   mono -- the weakest register in the system, and visually identical to the
   decorative metadata sitting beside it.

   So the disclaimer is gone and the register replaced it. The rule is that a
   placeholder panel shows layout and never shows digits, the marker is
   data-placeholder, and `npm run check:placeholders` fails the build on a
   numeral inside one of these subtrees. See
   docs/design/placeholder-register.md and src/components/system/placeholder.tsx.

   If you have a real figure for one of these panels: it does not go in a
   placeholder. It goes in a panel whose numbers trace to
   sparc-resilience/docs/results/reconciliation.md, and it takes that panel's
   register, not this one.
   ========================================================================== */

/* ---------- StageStack: owns the rail-fill state ---------- */

type StageCtx = { register: (idx: number, open: boolean) => void; total: number };
const StageStackCtx = React.createContext<StageCtx | null>(null);

export function StageStack({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const total = items.length;
  const [openMap, setOpenMap] = React.useState<Record<number, boolean>>({});
  const register = React.useCallback((idx: number, open: boolean) => {
    setOpenMap((m) => (m[idx] === open ? m : { ...m, [idx]: open }));
  }, []);

  // highest index opened so far
  let highest = -1;
  for (let i = 0; i < total; i++) if (openMap[i]) highest = i;
  const fillPct = highest < 0 ? 0 : ((highest + 1) / total) * 100;

  return (
    <StageStackCtx.Provider value={{ register, total }}>
      <section className="stage-stack" style={{ padding: 0, borderBottom: "1px solid var(--hairline)" }}>
        <div className="wrap" style={{ position: "relative" }}>
          <div className="stage-rail" aria-hidden>
            <div className="stage-rail-fill" style={{ height: `${fillPct}%` }} />
          </div>
          <div style={{ paddingLeft: 24 }}>{children}</div>
        </div>
      </section>
    </StageStackCtx.Provider>
  );
}

/* ---------- StageBlock ---------- */

export function StageBlock({
  index,
  num,
  kicker,
  title,
  lead,
  items,
  anchor,
  visual,
}: {
  index: number;
  num: string;
  kicker: string;
  title: string;
  lead: string;
  items: { k: string; v: string }[];
  anchor: string;
  visual: React.ReactNode;
}) {
  const ctx = React.useContext(StageStackCtx);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  // open if hash matches on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${anchor}`) {
      // Reads window.location, which does not exist during SSR; doing this in render would hydrate differently.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      ctx?.register(index, true);
    }
  }, [anchor, ctx, index]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      ctx?.register(index, next);
      return next;
    });
  }

  return (
    <div
      ref={ref}
      id={anchor}
      className={`stage-block${open ? " open" : ""}`}
      style={{ scrollMarginTop: 80 }}
    >
      <button
        type="button"
        className="stage-head"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`${anchor}-body`}
      >
        {/* The badge no longer takes a per-stage accent. Stage index is an
            ordered quantity and the brand ramp is not ordered -- stages 02-05
            were one colour in greyscale and for a red-green deficient reader.
            The number and the position already carry identity, and the only
            thing colour adds here is state: open, from globals.css. */}
        <span className="stage-num">{num}</span>
        <div>
          <div className="kicker">{kicker}</div>
          <h2 className="stage-title">{title}</h2>
        </div>
        <span className="stage-chevron" aria-hidden>▾</span>
      </button>
      <div className="stage-body" id={`${anchor}-body`}>
        <div>
          <p className="stage-lead">{lead}</p>
          <dl className="dl">
            {items.map((it, i) => (
              <React.Fragment key={i}>
                <dt>{it.k}</dt>
                <dd>{it.v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
        <div className="fadeup">{visual}</div>
      </div>
    </div>
  );
}

/* ---------- Shared placeholder furniture ----------

   VCard is gone on purpose. It was the component that rendered a panel's
   `meta` slot at 10px mono --muted, right-aligned, which is how "sample
   output · illustrative" came to be indistinguishable from "philadelphia ·
   2026" two panels away. Keeping it around would mean keeping the register
   that failed. Panels that one day carry real numbers get a card primitive
   designed for that job, with the measurement unit in it. */

/** A text block with no text in it. Shows that prose goes here, says nothing. */
function PlaceholderLines({ widths }: { widths: string[] }) {
  return (
    <div aria-hidden style={{ display: "flex", flexDirection: "column", gap: 7, padding: "3px 0" }}>
      {widths.map((w, i) => (
        <span key={i} style={{ display: "block", height: 1, width: w, background: "var(--rule)", opacity: 0.55 }} />
      ))}
    </div>
  );
}

/** The em-dash row list that replaces every diagnostics table on this page. */
function EmptyDl({ keys }: { keys: string[] }) {
  return (
    <dl className="dl" style={{ marginTop: 10 }}>
      {keys.map((k) => (
        <React.Fragment key={k}>
          <dt>{k}</dt>
          <dd className="mono"><Em /></dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** Axis furniture for a plot with nothing in it: the frame reads, the ticks
 *  read as em dashes, and there is no curve, because a drawn curve crops into
 *  a result. */
function EmptyAxes({ rows }: { rows: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="row" style={{ gap: 14, fontSize: "var(--fs-label)" }}>
        {rows.map((r) => (
          <span key={r} className="row mono" style={{ gap: 5, color: "var(--fg-2)" }}>
            <span aria-hidden style={{ width: 10, height: 1, background: "var(--rule)" }} />
            {r}
          </span>
        ))}
      </div>
      <div className="row mono" style={{ justifyContent: "space-between", fontSize: "var(--fs-label)", color: "var(--fg-2)" }}>
        <Em />
        <Em />
      </div>
    </div>
  );
}

/* ---------- 01 · IngestVisual ---------- */

export function IngestVisual() {
  /* File names are format exemplars and carry no digits: the originals named
     a summer, a year range and a city, which is a study someone could believe
     had been run. */
  const files = [
    { n: "land_surface_temp.tif", k: "raster" },
    { n: "tracts.shp", k: "vector" },
    { n: "city_boundary.geojson", k: "boundary" },
    { n: "permits.parquet", k: "table" },
    { n: "project.yml", k: "manifest" },
  ];
  return (
    <Placeholder
      label="ingest · drop zone"
      note="This is the layout of the drop zone. No files have been ingested and no parse has run."
    >
      <div data-ph-surface style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f) => (
            <div key={f.n} style={{ display: "grid", gridTemplateColumns: "76px minmax(0,1fr) 44px", gap: 10, alignItems: "center", fontSize: "var(--fs-body)" }}>
              {/* Type badges were brand-hue fills under white text -- white on
                  gold is 1.84:1. They are outlined ink now: a format name is
                  not a quantity and never needed a colour. */}
              <span className="mono" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, border: "1px solid var(--rule)", color: "var(--fg-2)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.k}</span>
              <span className="mono" style={{ fontSize: "var(--fs-body)", color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.n}</span>
              <span className="mono" style={{ textAlign: "right" }}><Em /></span>
            </div>
          ))}
        </div>
      </div>
      <EmptyDl keys={["reproject", "resample", "clip to"]} />
    </Placeholder>
  );
}

/* ---------- 02 · CorrelogramVisual ---------- */

export function CorrelogramVisual() {
  return (
    <Placeholder
      label="correlogram · spatial autocorrelation"
      note="This is where a correlogram and its statistics appear. The plot area is empty because no correlogram has been computed for anything on this site."
    >
      <PlaceholderPlot
        height={140}
        ariaLabel="Empty plot area showing where a spatial autocorrelation curve would be drawn. No curve is shown because no correlogram has been computed."
      />
      <div style={{ marginTop: 8 }}>
        <EmptyAxes rows={["lag", "autocorrelation"]} />
      </div>
      <EmptyDl keys={["moran's I", "geary's C", "range"]} />
    </Placeholder>
  );
}

/* ---------- 03 · GwenVisual ---------- */

export function GwenVisual() {
  /* Variable names describe the heat domain's inputs. The originals carried a
     percentile in one name and, more importantly, a signed coefficient and a
     kept/dropped verdict per row -- a selection result, two decimal places,
     from no run. The rows are uniform now: the panel shows that selection has
     a table, not what the table said. */
  const vars = [
    "pct_canopy",
    "impervious_pct",
    "bldg_height_upper",
    "albedo_mean",
    "median_income",
    "road_density",
    "elev_std",
    "wind_z_mean",
  ];
  return (
    <Placeholder
      label="gwen · variable selection"
      note="This is the layout of the selection table: one row per candidate variable, with its coefficient and whether it was retained. No selection has been run."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {vars.map((n) => (
          <div key={n} style={{ display: "grid", gridTemplateColumns: "minmax(0,130px) minmax(0,1fr) 44px", gap: 10, alignItems: "center", fontSize: "var(--fs-body)" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{n}</span>
            <PlaceholderTrack />
            <span className="mono" style={{ fontSize: "var(--fs-label)", textAlign: "right" }}><Em /></span>
          </div>
        ))}
      </div>
      <EmptyDl keys={["kernel", "bandwidth", "regularisation"]} />
    </Placeholder>
  );
}

/* ---------- 04 · SparcVisual ---------- */

export function SparcVisual() {
  return (
    <Placeholder
      label="sparc · training"
      note="This is where training curves and validation diagnostics appear. Nothing has trained: the curves here were generated from a decay function and a random term, and the diagnostic beside them was a passing score from no run."
    >
      <PlaceholderPlot
        height={130}
        ariaLabel="Empty plot area showing where training loss and a validation diagnostic would be drawn against epoch. No curves are shown because no training run exists."
      />
      <div style={{ marginTop: 8 }}>
        <EmptyAxes rows={["loss", "validation"]} />
      </div>
      {/* The residual raster was a per-cell alpha ramp computed from distance
          to the grid centre. A field of data colour is a result whether or not
          it has a number on it, so it is hatched. */}
      <div className="ph-plot" style={{ height: 44, marginTop: 10 }} role="img" aria-label="Empty raster area showing where a per-location residual map would be drawn." />
      <EmptyDl keys={["validation", "mean sigma", "physics constraints"]} />
    </Placeholder>
  );
}

/* ---------- 05 · CausalVisual ---------- */

export function CausalVisual() {
  /* The graph is kept because a DAG over named domain variables is structure
     rather than a finding -- it shows what the stage operates on. The node
     fills were brand hues, so they are outlined; the posterior trace below it
     was a sine wave with noise and is hatched. */
  const nodes = [
    { id: "canopy", x: 40, y: 30 },
    { id: "imperv", x: 40, y: 90 },
    { id: "albedo", x: 150, y: 30 },
    { id: "wind", x: 150, y: 90 },
    { id: "temp", x: 280, y: 60 },
  ];
  const edges = [
    ["canopy", "albedo"], ["canopy", "temp"],
    ["imperv", "albedo"], ["imperv", "temp"],
    ["albedo", "temp"], ["wind", "temp"],
  ] as const;
  const find = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <Placeholder
      label="causal · model space"
      note="The graph shows which variables this stage reasons over, drawn to illustrate the layout. No structure search has run, no edge here has been accepted or rejected, and the convergence statistics are empty for the same reason."
    >
      <div className="kicker" style={{ marginBottom: 6 }}>candidate structure</div>
      <svg viewBox="0 0 340 130" width="100%" style={{ display: "block", marginBottom: 10 }} role="img" aria-label="A diagram of five named variables connected by arrows, drawn to show the shape of a causal graph. It is not a result of a structure search.">
        {edges.map(([a, b], i) => {
          const A = find(a), B = find(b);
          return <line key={i} x1={A.x + 18} y1={A.y} x2={B.x - 18} y2={B.y} stroke="var(--rule)" strokeWidth="1" markerEnd="url(#arr)" />;
        })}
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--rule)" />
          </marker>
        </defs>
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="14" fill="var(--bg-elevated)" stroke="var(--rule)" />
            <text x={n.x} y={n.y + 26} fontSize="9" textAnchor="middle" fill="var(--fg-2)" fontFamily="var(--font-mono)">{n.id}</text>
          </g>
        ))}
      </svg>
      <div className="kicker" style={{ marginBottom: 6 }}>posterior trace</div>
      <PlaceholderPlot
        height={60}
        ariaLabel="Empty plot area showing where a posterior trace would be drawn. No chain has been sampled."
      />
      <EmptyDl keys={["edges accepted", "chains", "convergence"]} />
    </Placeholder>
  );
}

/* ---------- 06 · SimulationVisual ---------- */

export function SimulationVisual() {
  /* The scenario card named a city and a year, put a live dollar budget on a
     slider, and recomputed a temperature delta and a tract count from the
     slider position -- an interactive result from no model. The city and the
     year are gone with the digits: a named place on a scenario card is a study
     someone can believe we ran. */
  const equity = ["heat vulnerability", "median income", "canopy access", "asthma rate"];
  return (
    <Placeholder
      label="simulation · scenario"
      note="This is the layout of the scenario panel: a budget constraint, the equity layers an optimiser must honour, and the resulting change raster. No scenario has been run for any place."
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="kicker">budget constraint</span>
          <span className="mono" style={{ fontSize: "var(--fs-body)", fontWeight: 700 }}><Em /></span>
        </div>
        <PlaceholderSlider />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {/* The tick and circle glyphs encoded which layers were switched on,
            which is a configuration of a run that does not exist. */}
        {equity.map((e) => (
          <span key={e} className="pill" style={{ background: "transparent", border: "1px solid var(--rule)", color: "var(--fg-2)" }}>{e}</span>
        ))}
      </div>
      <div className="ph-plot" style={{ height: 64, marginBottom: 2 }} role="img" aria-label="Empty raster area showing where the per-location change under a scenario would be drawn." />
      <EmptyDl keys={["mean change", "tracts improved", "budget check"]} />
    </Placeholder>
  );
}

/* ---------- 07 · ReportVisual ---------- */

export function ReportVisual() {
  const [tab, setTab] = React.useState<"technical" | "planner" | "public">("technical");
  const tabs: Array<{ k: typeof tab; label: string }> = [
    { k: "technical", label: "Technical" },
    { k: "planner", label: "Planner" },
    { k: "public", label: "Public" },
  ];
  /* The three preview bodies are gone, not em-dashed. Em-dashing the numerals
     in the planner brief would have left "canopy expansion ... is projected to
     reduce mean afternoon air-temperature by —", which still crops into a
     claim -- and canopy cooling is the one intervention the validation
     register records as not established. The acceptance test for this register
     is that no crop reads as a result, so the body renders as the skeleton of
     a document. What the three audiences actually get is already stated in the
     copy beside this panel, which is where a feature description belongs.
     Proposed replacement sentences are with the CFO; do not write prose in
     here without them. */
  const skeleton: Record<typeof tab, { title: string; chips: string[] }> = {
    technical: { title: "Methods and diagnostics", chips: ["diagnostics", "DAG manifest", "code refs"] },
    planner: { title: "Adaptation brief", chips: ["maps", "tradeoff table", "equity overlay"] },
    public: { title: "What this means locally", chips: ["plain language", "before / after", "FAQ"] },
  };
  const p = skeleton[tab];
  return (
    <Placeholder
      label="report · audience"
      note="This is the layout of the report view: one tab per audience, each with its own sections. The document bodies are empty because no run has produced a report."
    >
      {/* Active-tab fills were crimson, orange and gold under white text.
          White on gold is 1.84:1, which is below every threshold there is. The
          selected tab is ink now, and selection is also carried by
          aria-selected rather than by colour alone. */}
      <div role="tablist" aria-label="Report audience" data-ph-surface style={{ display: "flex", gap: 4, marginBottom: 12, padding: 3, borderStyle: "solid" }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            role="tab"
            aria-selected={tab === t.k}
            onClick={() => setTab(t.k)}
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 3, cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
              background: tab === t.k ? "var(--fg)" : "transparent",
              color: tab === t.k ? "var(--paper)" : "var(--fg-2)",
              border: tab === t.k ? "1px solid var(--fg)" : "1px solid transparent",
              transition: "background .15s, color .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div data-ph-surface style={{ padding: 14, marginBottom: 12 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>document body</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{p.title}</div>
        <PlaceholderLines widths={["100%", "96%", "99%", "72%"]} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {p.chips.map((c) => <span key={c} className="pill" style={{ background: "transparent", border: "1px solid var(--rule)", color: "var(--fg-2)" }}>{c}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[".pdf", ".md", ".html", "manifest.json"].map((f) => (
          <span key={f} className="pill" style={{ background: "transparent", border: "1px solid var(--rule)", color: "var(--fg-2)" }}>{f}</span>
        ))}
      </div>
    </Placeholder>
  );
}
