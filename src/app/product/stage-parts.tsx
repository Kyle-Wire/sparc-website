"use client";

import * as React from "react";

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
      <section className="stage-stack" style={{ padding: 0, borderBottom: "1px solid var(--line)" }}>
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
  accent,
  anchor,
  visual,
}: {
  index: number;
  num: string;
  kicker: string;
  title: string;
  lead: string;
  items: { k: string; v: string }[];
  accent: string;
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
        <span className="stage-num" style={{ background: accent }}>{num}</span>
        <div>
          <div className="kicker" style={{ color: accent }}>{kicker}</div>
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

/* ---------- Shared visual chrome ---------- */

function VCard({
  label,
  meta,
  accent,
  children,
}: {
  label: string;
  meta?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, borderTop: `2px solid ${accent}` }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="kicker">{label}</div>
        {meta && <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{meta}</span>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

/* ---------- 01 · IngestVisual ---------- */

export function IngestVisual() {
  const files = [
    { n: "lst_summer_2024.tif", k: "raster", c: "var(--purple)" },
    { n: "tracts_phl.shp", k: "vector", c: "var(--magenta)" },
    { n: "city_boundary.geojson", k: "boundary", c: "var(--pink)" },
    { n: "permits_2018-2024.parquet", k: "table", c: "var(--orange)" },
    { n: "project.yml", k: "manifest", c: "var(--gold)" },
  ];
  return (
    <VCard label="ingest · drop zone" meta="5 of 5 · ready" accent="var(--purple)">
      <div style={{ border: "1px dashed var(--line)", borderRadius: 6, padding: 14, background: "var(--paper)", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "70px minmax(0,1fr) 70px", gap: 10, alignItems: "center", fontSize: 12 }}>
              <span className="mono" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: f.c, color: "#fff", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.k}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.n}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--purple)", textAlign: "right" }}>✓ parsed</span>
            </div>
          ))}
        </div>
      </div>
      <dl className="dl">
        <dt>reproject</dt><dd className="mono">EPSG:4326 → EPSG:3857</dd>
        <dt>resample</dt><dd className="mono">bilinear · 30m grid</dd>
        <dt>clip to</dt><dd className="mono">city_boundary.geojson</dd>
      </dl>
    </VCard>
  );
}

/* ---------- 02 · CorrelogramVisual ---------- */

export function CorrelogramVisual() {
  // synthetic Moran's I curve: starts high, decays past ~1.4km
  const pts = Array.from({ length: 24 }, (_, i) => {
    const x = i / 23;
    const y = Math.max(-0.05, 0.78 * Math.exp(-Math.pow(x * 3, 1.4)) - x * 0.1);
    return { x, y };
  });
  const W = 360, H = 140;
  const px = (x: number) => 28 + x * (W - 36);
  const py = (y: number) => H - 14 - ((y + 0.1) / 0.95) * (H - 28);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(" ");
  const band = pts.map((p) => ({ x: p.x, y0: p.y - 0.06, y1: p.y + 0.06 }));
  const bandPath = [
    ...band.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p.x).toFixed(1)} ${py(p.y1).toFixed(1)}`),
    ...band.slice().reverse().map((p) => `L ${px(p.x).toFixed(1)} ${py(p.y0).toFixed(1)}`),
    "Z",
  ].join(" ");
  return (
    <VCard label="correlogram · spatial autocorrelation" meta="lag 0 → 5 km" accent="var(--magenta)">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <line x1="28" y1={py(0)} x2={W - 8} y2={py(0)} stroke="var(--line)" strokeDasharray="2 3" />
        <path d={bandPath} fill="var(--magenta)" opacity="0.15" />
        <path d={path} fill="none" stroke="var(--magenta)" strokeWidth="2" />
        {pts.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={py(p.y)} r="2.4" fill="var(--magenta)" />
        ))}
        <text x="6" y={py(0.7)} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">+0.7</text>
        <text x="6" y={py(0)} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">0.0</text>
        <text x={px(0)} y={H - 2} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">0 km</text>
        <text x={px(1) - 24} y={H - 2} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">5 km</text>
      </svg>
      <dl className="dl" style={{ marginTop: 8 }}>
        <dt>moran&apos;s I</dt><dd className="mono">0.74 · p &lt; 0.001</dd>
        <dt>geary&apos;s C</dt><dd className="mono">0.31</dd>
        <dt>range</dt><dd className="mono">≈ 1.4 km · isotropic</dd>
      </dl>
    </VCard>
  );
}

/* ---------- 03 · GwenVisual ---------- */

export function GwenVisual() {
  const vars = [
    { n: "pct_canopy", b: -0.62, kept: true },
    { n: "impervious_pct", b: 0.81, kept: true },
    { n: "bldg_height_p90", b: -0.18, kept: true },
    { n: "albedo_mean", b: -0.44, kept: true },
    { n: "median_income", b: -0.21, kept: true },
    { n: "road_density", b: 0.0, kept: false },
    { n: "elev_std", b: 0.0, kept: false },
    { n: "wind_z_mean", b: -0.27, kept: true },
  ];
  const max = 0.85;
  return (
    <VCard label="gwen · elastic-net selection" meta="α 0.7 · 14 of 38 retained" accent="var(--pink)">
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {vars.map((v, i) => {
          const w = (Math.abs(v.b) / max) * 100;
          const pos = v.b >= 0;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,130px) minmax(0,1fr) 50px", gap: 10, alignItems: "center", fontSize: 12, opacity: v.kept ? 1 : 0.45 }}>
              <span className="mono" style={{ fontSize: 11, textDecoration: v.kept ? "none" : "line-through" }}>{v.n}</span>
              <div style={{ position: "relative", height: 10, background: "var(--paper)", borderRadius: 2 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--line)" }} />
                {v.kept && (
                  <div style={{ position: "absolute", top: 1, bottom: 1, [pos ? "left" : "right"]: "50%", width: `${w / 2}%`, background: pos ? "var(--crimson)" : "var(--purple)", borderRadius: 1 } as React.CSSProperties} />
                )}
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--muted)", textAlign: "right" }}>
                {v.kept ? `${pos ? "+" : "−"}${Math.abs(v.b).toFixed(2)}` : "drop"}
              </span>
            </div>
          );
        })}
      </div>
      <dl className="dl" style={{ marginTop: 12 }}>
        <dt>kernel</dt><dd className="mono">adaptive bisquare · bw 1.2 km</dd>
        <dt>λ (cv)</dt><dd className="mono">0.038 · 5-fold</dd>
      </dl>
    </VCard>
  );
}

/* ---------- 04 · SparcVisual ---------- */

export function SparcVisual() {
  const W = 360, H = 130;
  const epochs = 40;
  const loss = Array.from({ length: epochs }, (_, i) => 1.0 * Math.exp(-i / 10) + 0.12 + Math.random() * 0.02);
  const chi = Array.from({ length: epochs }, (_, i) => 1.6 * Math.exp(-i / 14) + 0.85 + Math.random() * 0.03);
  const pathOf = (vals: number[], yMin: number, yMax: number) => {
    const px = (i: number) => 28 + (i / (epochs - 1)) * (W - 36);
    const py = (v: number) => H - 14 - ((v - yMin) / (yMax - yMin)) * (H - 28);
    return vals.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  };
  return (
    <VCard label="sparc · neural train" meta="GW3C · 8 chains · CUDA" accent="var(--crimson)">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <line x1="28" y1={H - 14} x2={W - 8} y2={H - 14} stroke="var(--line)" />
        <path d={pathOf(loss, 0.1, 1.2)} fill="none" stroke="var(--crimson)" strokeWidth="1.6" />
        <path d={pathOf(chi, 0.8, 2.5)} fill="none" stroke="var(--orange)" strokeWidth="1.6" strokeDasharray="3 2" />
        <text x="6" y="14" fontSize="9" fill="var(--crimson)" fontFamily="var(--font-mono)">loss</text>
        <text x="6" y="26" fontSize="9" fill="var(--orange)" fontFamily="var(--font-mono)">χ²</text>
        <text x={px(W, 0)} y={H - 2} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">epoch 0</text>
        <text x={W - 50} y={H - 2} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">40</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 1, marginTop: 8 }}>
        {Array.from({ length: 48 }).map((_, i) => {
          const r = Math.floor(i / 12), c = i % 12;
          const d = Math.hypot(r - 1.5, c - 5.5);
          const v = Math.max(0, 1 - d / 6);
          return <div key={i} style={{ aspectRatio: "1", background: `rgba(231,60,37,${v.toFixed(2)})`, borderRadius: 1 }} />;
        })}
      </div>
      <dl className="dl" style={{ marginTop: 8 }}>
        <dt>val χ²</dt><dd className="mono">0.93 · target &lt; 1.2 ✓</dd>
        <dt>σ̄</dt><dd className="mono">0.154</dd>
        <dt>physics</dt><dd className="mono" style={{ color: "var(--purple)" }}>monotone signs honored</dd>
      </dl>
    </VCard>
  );
}
function px(W: number, x: number) { return 28 + x * (W - 36); }

/* ---------- 05 · CausalVisual ---------- */

export function CausalVisual() {
  // tiny DAG layout
  const nodes = [
    { id: "canopy", x: 40, y: 30, c: "var(--purple)" },
    { id: "imperv", x: 40, y: 90, c: "var(--magenta)" },
    { id: "albedo", x: 150, y: 30, c: "var(--pink)" },
    { id: "wind", x: 150, y: 90, c: "var(--orange)" },
    { id: "AAT_z", x: 280, y: 60, c: "var(--crimson)" },
  ];
  const edges = [
    ["canopy", "albedo"], ["canopy", "AAT_z"],
    ["imperv", "albedo"], ["imperv", "AAT_z"],
    ["albedo", "AAT_z"], ["wind", "AAT_z"],
  ] as const;
  const find = (id: string) => nodes.find((n) => n.id === id)!;
  // posterior trace mock
  const trace = Array.from({ length: 60 }, (_, i) => 0.5 + 0.08 * Math.sin(i * 0.6) + (Math.random() - 0.5) * 0.04);
  const W = 340, H = 60;
  const path = trace.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (trace.length - 1) * W).toFixed(1)} ${(H - v * H).toFixed(1)}`).join(" ");
  return (
    <VCard label="causal · MC³ + NUTS" meta="412 sampled · R̂ 1.01" accent="var(--orange)">
      <div className="kicker" style={{ marginBottom: 6 }}>DAG · model space (MC³)</div>
      <svg viewBox="0 0 340 130" width="100%" style={{ display: "block", marginBottom: 10 }}>
        {edges.map(([a, b], i) => {
          const A = find(a), B = find(b);
          return <line key={i} x1={A.x + 18} y1={A.y} x2={B.x - 18} y2={B.y} stroke="var(--ink-2)" strokeWidth="1" markerEnd="url(#arr)" opacity="0.5" />;
        })}
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-2)" />
          </marker>
        </defs>
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="14" fill={n.c} />
            <text x={n.x} y={n.y + 26} fontSize="9" textAnchor="middle" fill="var(--ink-2)" fontFamily="var(--font-mono)">{n.id}</text>
          </g>
        ))}
      </svg>
      <div className="kicker" style={{ marginBottom: 6 }}>posterior trace · NUTS</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", border: "1px solid var(--line)", borderRadius: 4 }}>
        <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="var(--line)" strokeDasharray="2 3" />
        <path d={path} fill="none" stroke="var(--orange)" strokeWidth="1.2" />
      </svg>
      <dl className="dl" style={{ marginTop: 10 }}>
        <dt>edges accepted</dt><dd className="mono">41 of 56 · 3 in review</dd>
        <dt>chains</dt><dd className="mono">8 · 2k samples · warmup 1k</dd>
        <dt>R̂ max</dt><dd className="mono">1.01 ✓</dd>
      </dl>
    </VCard>
  );
}

/* ---------- 06 · SimulationVisual ---------- */

export function SimulationVisual() {
  const [budget, setBudget] = React.useState(2.4);
  const equity = [
    { n: "heat vulnerability", on: true },
    { n: "median income", on: true },
    { n: "canopy access", on: true },
    { n: "asthma rate", on: false },
  ];
  return (
    <VCard label="simulation · scenario" meta="philadelphia · 2026" accent="var(--amber)">
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="kicker">budget constraint</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>${budget.toFixed(1)}M / $5.0M</span>
        </div>
        <input
          type="range" min={0.5} max={5} step={0.1} value={budget}
          onChange={(e) => setBudget(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--amber)" }}
          aria-label="budget"
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {equity.map((e, i) => (
          <span key={i} className="pill" style={{ background: e.on ? "var(--amber)" : "rgba(0,0,0,0.05)", color: e.on ? "#fff" : "var(--muted)" }}>
            {e.on ? "✓" : "○"} {e.n}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(20, 1fr)", gap: 1, marginBottom: 12 }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const v = Math.sin(i * 0.4 + budget) * Math.cos(i * 0.21) * 0.5 + 0.5;
          const stops = ["#602468", "#9e337d", "#e94d9b", "#e94461", "#e73c25", "#e76c25", "#e79024", "#f0b632", "#fbdd46"];
          const idx = Math.floor(v * (stops.length - 1));
          return <div key={i} style={{ aspectRatio: "1", background: stops[idx], opacity: 0.85 }} />;
        })}
      </div>
      <dl className="dl">
        <dt>Δ AAT_z mean</dt><dd className="mono">−{(0.12 + budget * 0.06).toFixed(2)} (σ 0.154)</dd>
        <dt>tracts improved</dt><dd className="mono">{Math.round(120 + budget * 30)} of 287</dd>
        <dt>budget check</dt><dd className="mono" style={{ color: "var(--purple)" }}>✓ within ${budget.toFixed(1)}M</dd>
      </dl>
    </VCard>
  );
}

/* ---------- 07 · ReportVisual ---------- */

export function ReportVisual() {
  const [tab, setTab] = React.useState<"technical" | "planner" | "public">("planner");
  const tabs: Array<{ k: typeof tab; label: string; c: string }> = [
    { k: "technical", label: "Technical", c: "var(--crimson)" },
    { k: "planner", label: "Planner", c: "var(--orange)" },
    { k: "public", label: "Public", c: "var(--gold)" },
  ];
  const previews = {
    technical: { title: "Methods & Posterior Diagnostics", body: "Geographically-weighted neural ensemble (GW3C). 8-chain NUTS, 2k samples post-warmup. R̂ ≤ 1.01. Validation χ² 0.93. Edge-level signs and physics constraints itemized in Appendix B. Reproducible from project.yml@a1b2c3d.", chips: ["χ² · σ · R̂", "DAG manifest", "code refs"] },
    planner: { title: "Adaptation Brief — District 7", body: "$2.4M canopy expansion across 218 priority tracts is projected to reduce mean afternoon air-temperature by 0.26 °C (σ 0.15). Highest-vulnerability tracts gain the most. Trade-offs and sensitivity tables on p. 4.", chips: ["maps", "tradeoff table", "equity overlay"] },
    public: { title: "What this means for your block", body: "Planting more trees on hot, paved blocks would cool them by about a quarter of a degree on summer afternoons. The neighborhoods that need it most would see the biggest change.", chips: ["plain language", "before/after", "FAQ"] },
  };
  const p = previews[tab];
  return (
    <VCard label="report · audience" meta="signed manifest · v0.4.2" accent="var(--gold)">
      <div style={{ display: "flex", gap: 4, marginBottom: 12, padding: 3, background: "var(--paper)", borderRadius: 5, border: "1px solid var(--line)" }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 3, border: "none", cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
              background: tab === t.k ? t.c : "transparent",
              color: tab === t.k ? "#fff" : "var(--ink-2)",
              transition: "background .15s, color .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ border: "1px solid var(--line)", borderRadius: 6, padding: 14, background: "var(--paper)", marginBottom: 12 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>preview · {tab}</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>{p.title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 10 }}>{p.body}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {p.chips.map((c, i) => <span key={i} className="pill">{c}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[".pdf", ".md", ".html", "manifest.json"].map((f, i) => (
          <span key={i} className="pill" style={{ background: "var(--ink)", color: "var(--paper)" }}>↓ {f}</span>
        ))}
      </div>
    </VCard>
  );
}
