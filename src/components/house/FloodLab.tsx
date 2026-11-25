"use client";

import * as React from "react";
import {
  engineSource,
  formatDepth,
  formatValue,
  fromUnit,
  latticeSource,
  toUnit,
  type LabAnswer,
  type LabParam,
  type LabSource,
  type Lattice,
  type WhatIfModel,
} from "@/lib/house/flood-lab";
import { readPlan, writePlan } from "@/lib/house/plan";

type Props =
  | { lattice: Lattice; files?: undefined; planKey: string; sample: true }
  | { lattice?: undefined; files: { engine: string; model: string }; planKey: string; sample: false };

/**
 * The flood what-if lab. Moves the sliders of one house's own emulator study
 * (CHI D46/D51) and answers at once. The demo reads Sample A's answers at
 * fixed stops; a buyer's own house loads the engine and the emulator from
 * their private files and also draws the map of the 80 m around the house.
 */
export function FloodLab(props: Props) {
  const [source, setSource] = React.useState<LabSource | null>(() => (props.lattice ? latticeSource(props.lattice) : null));
  const [failed, setFailed] = React.useState<string | null>(null);
  const files = props.files;

  React.useEffect(() => {
    if (!files) return;
    let gone = false;
    (async () => {
      try {
        const fs = await loadEngine(files.engine);
        const res = await fetch(files.model, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`model ${res.status}`);
        const model = (await res.json()) as WhatIfModel;
        if (!gone) setSource(engineSource(fs, model));
      } catch (e) {
        if (!gone) setFailed(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      gone = true;
    };
  }, [files]);

  if (failed)
    return (
      <div className="hx-card" role="alert">
        <h3>The lab could not load just now.</h3>
        <p>Nothing about your report has changed. Refresh in a minute; if it keeps failing, reply to your delivery email.</p>
      </div>
    );
  if (!source) return <div className="hx-card" aria-busy="true">Loading your house’s flood model…</div>;
  return <Lab source={source} planKey={props.planKey} sample={props.sample} />;
}

function Lab({ source, planKey, sample }: { source: LabSource; planKey: string; sample: boolean }) {
  const P = source.params;
  const [values, setValues] = React.useState<number[]>(() => P.map((p) => p.start));
  const [saved, setSaved] = React.useState<string | null>(null);
  const answer = React.useMemo(() => source.ask(values), [source, values]);
  const smallest = React.useMemo(
    () => source.ask(values.map((v, j) => (P[j].group === "you" ? P[j].min : v))),
    [source, values, P],
  );
  const set = (j: number, v: number) => {
    setSaved(null);
    setValues((old) => old.map((x, i) => (i === j ? v : x)));
  };
  const S = source.study;
  const your = sample ? "the" : "your";
  const storm = `${formatValue("ari", values[P.findIndex((p) => p.key === "ari")] ?? 10)}, ${formatValue("se", values[P.findIndex((p) => p.key === "se")] ?? 0.5)} ground`;
  const val = (key: string) => {
    const j = P.findIndex((p) => p.key === key);
    return j >= 0 ? formatValue(key, values[j]) : "";
  };
  const fix = `French drain (${val("design:1.media")}) and rain garden (${val("design:2.ponding")} bowl, ${val("design:2.media")})`;

  const save = () => {
    const items = readPlan(planKey);
    const item = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      hazard: "flood" as const,
      fix,
      storm,
      wall: answer.wall.mid,
      without: S.without,
    };
    setSaved(writePlan(planKey, [item, ...items]) ? "Saved to your plan." : "Your browser would not save it here.");
  };

  return (
    <div className="hx">
      <div className="hx-lab">
        <div className="hx-card">
          {(["weather", "you"] as const).map((g) => (
            <div key={g}>
              <div className="hx-group">{g === "weather" ? "1 · The storm" : "2 · What you build"}</div>
              {P.map((p, j) =>
                p.group === g ? <Slider key={p.key} p={p} v={values[j]} onChange={(v) => set(j, v)} id={`s${j}`} /> : null,
              )}
            </div>
          ))}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <button type="button" className="btn btn-accent" onClick={save}>
              Save to my plan
            </button>
            <button type="button" className="btn" onClick={() => setValues(P.map((p) => p.start))}>
              Reset
            </button>
          </div>
          {saved && (
            <p role="status" style={{ marginTop: 10, fontSize: 13.5 }}>
              {saved}
            </p>
          )}
        </div>

        <div className="hx" style={{ gap: 12 }}>
          <div className="hx-reads">
            <Read
              title="Against the house"
              r={answer.wall}
              text={`How high water stands against the walls, above the ground as it is today, in a ${storm}.`}
            />
            <Read title="In the back yard" r={answer.rear} text="The deepest water anywhere in the yard, including any rain garden bowl you dig." />
            <div className="hx-card hx-read">
              <div className="kicker">On the lot</div>
              <div className="v">{Math.round(answer.lot.mid * 264)} gal</div>
              <div className="r">
                range {Math.round(answer.lot.lo * 264)}–{Math.round(answer.lot.hi * 264)} gal
              </div>
              <div className="c">Water standing on the lot’s open ground at its deepest, added up.</div>
            </div>
          </div>

          <div className="hx-sure" data-sure={answer.sure}>
            {answer.sure ? (
              <>
                <b>Sure of this answer: within ±{formatDepth(answer.pm).big} on {your} lot.</b>
                At {S.test} settings it never trained on, the worst answer this lab gave was {formatDepth(S.worstThrough).big} off the full model.
              </>
            ) : (
              <>
                <b>Harder to call here: ±{formatDepth(answer.pm).big} on {your} lot.</b>
                That is wider than the ±{formatDepth(S.tol).big} this lab promises.{" "}
                {sample
                  ? "On your own house, we run the full flood model at settings like this overnight and email you the answer."
                  : "We run the full flood model at these settings overnight and email you the answer. Five checks a month are included."}
              </>
            )}
          </div>

          <Compare answer={answer} smallest={smallest} without={S.without} />

          {source.map && answer.depth ? (
            <FloodMap map={source.map} depth={answer.depth} />
          ) : (
            <div className="hx-demo-note">
              {sample
                ? "A sample never shows where its house is, so the map is left out here. Your own lab draws the deepest water across the 80 m around your house, with your lot outlined."
                : "This study has no map."}
            </div>
          )}
        </div>
      </div>

      <div className="hx-about">
        <div>
          <h4>What the fixes are</h4>
          <p>
            A French drain: a gravel trench
            {S.features.french_drain ? ` of about ${Math.round(S.features.french_drain * 10.764)} sq ft` : ""} along the back wall, piped to the
            sewer. A rain garden: the rest of the yard
            {S.features.rain_garden ? ` (about ${Math.round(S.features.rain_garden * 10.764)} sq ft)` : ""}, dug out and planted. Both
            replace the paving.
          </p>
        </div>
        <div>
          <h4>How it works</h4>
          <p>
            We ran the full flood model of the streets around {your} house {S.runs} times on our GPU, across every slider, and trained a
            small model of {your} yard on those runs. It answers in under a millisecond, and it says when it isn’t sure.
          </p>
        </div>
        <div>
          <h4>What it does not tell you</h4>
          <p>
            Cost, permits, and whether the soil drains well enough are for a contractor to check on site. The storms are one-hour
            cloudbursts; rivers and long soaking rains are in the report itself.
          </p>
        </div>
      </div>
      <p className="mono" style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
        Alder (FloodSim {S.floodsim}) · per-house emulator study · NOAA Atlas 14 · {sample ? "Sample A" : "your house"}
      </p>
    </div>
  );
}

function Slider({ p, v, onChange, id }: { p: LabParam; v: number; onChange: (v: number) => void; id: string }) {
  if (p.stops) {
    const i = Math.max(0, p.stops.indexOf(v));
    return (
      <div className="hx-slider">
        <label htmlFor={id}>
          {p.title}
          <output htmlFor={id}>{formatValue(p.key, v)}</output>
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={p.stops.length - 1}
          step={1}
          value={i}
          aria-valuetext={formatValue(p.key, v)}
          onChange={(e) => onChange(p.stops![Number(e.target.value)])}
        />
        <div className="ends">
          <span>{ends(p.key, p.min, "lo")}</span>
          <span>{ends(p.key, p.max, "hi")}</span>
        </div>
      </div>
    );
  }
  const u = toUnit(p, v);
  return (
    <div className="hx-slider">
      <label htmlFor={id}>
        {p.title}
        <output htmlFor={id}>{formatValue(p.key, v)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={1000}
        value={Math.round(u * 1000)}
        aria-valuetext={formatValue(p.key, v)}
        onChange={(e) => onChange(fromUnit(p, Number(e.target.value) / 1000))}
      />
      <div className="ends">
        <span>{ends(p.key, p.min, "lo")}</span>
        <span>{ends(p.key, p.max, "hi")}</span>
      </div>
    </div>
  );
}

function ends(key: string, v: number, side: "lo" | "hi"): string {
  if (key === "ari") return side === "lo" ? "2-year" : "100-year";
  if (key === "se") return side === "lo" ? "dry" : "soaked";
  return formatValue(key, v);
}

function Read({ title, r, text }: { title: string; r: LabAnswer["wall"]; text: string }) {
  const d = formatDepth(r.mid);
  const dry = r.hi < 0.0005;
  return (
    <div className="hx-card hx-read">
      <div className="kicker">{title}</div>
      <div className="v" style={{ color: dry ? "var(--wind)" : undefined }}>
        {dry ? "Dry" : d.big}
        {!dry && d.small && <small>{d.small}</small>}
      </div>
      <div className="r">{dry ? "no water in its range" : `range ${formatDepth(r.lo).big}–${formatDepth(r.hi).big}`}</div>
      <div className="c">{text}</div>
    </div>
  );
}

/** Three bars a non-expert can read: nothing built, smallest fixes, your fixes. */
function Compare({ answer, smallest, without }: { answer: LabAnswer; smallest: LabAnswer; without: [number, number] | null }) {
  const rows: { label: string; mid: number; lo: number; hi: number; note: string }[] = [];
  if (without)
    rows.push({ label: "Nothing built", mid: without[1], lo: without[0], hi: without[1], note: "the full model's own runs at this house, every storm size" });
  rows.push({ label: "Smallest fixes", mid: smallest.wall.mid, lo: smallest.wall.lo, hi: smallest.wall.hi, note: "this storm" });
  rows.push({ label: "Your fixes", mid: answer.wall.mid, lo: answer.wall.lo, hi: answer.wall.hi, note: "this storm" });
  const top = Math.max(0.05, ...rows.map((r) => r.hi)) * 1.1;
  const pct = (x: number) => `${Math.min(100, (100 * x) / top)}%`;
  return (
    <div className="hx-card">
      <div className="kicker">Water against the house, compared</div>
      <div className="hx-cmp">
        {rows.map((r) => (
          <div className="row" key={r.label}>
            <span>
              <b>{r.label}</b>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.note}</div>
            </span>
            <span className="barwrap" aria-hidden>
              <i style={{ width: pct(r.mid) }} />
              <s style={{ left: pct(r.lo), width: `calc(${pct(r.hi)} - ${pct(r.lo)})` }} />
            </span>
            <span className="num">{formatDepth(r.mid).big}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Dark bar: the answer. Light band: its range.</p>
    </div>
  );
}

const WATER = ["#e3f0f4", "#b9dce7", "#7fbcd2", "#3d93b3", "#16779a", "#0a4a61"];
const BANDS = [0.005, 0.02, 0.05, 0.1, 0.15, 0.3, Infinity];
const BLAB = ["¼–¾", "¾–2", "2–4", "4–6", "6–12", "12+"];

function FloodMap({ map, depth }: { map: NonNullable<LabSource["map"]>; depth: Float32Array }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const { nx, ny } = map;
    const sc = Math.floor(640 / nx);
    cv.width = nx * sc;
    cv.height = ny * sc;
    const full = new Float32Array(nx * ny);
    map.mask.forEach((k, m) => (full[k] = depth[m]));
    const wall = new Uint8Array(nx * ny), home = new Uint8Array(nx * ny), lot = new Uint8Array(nx * ny);
    for (const k of map.walls) wall[k] = 1;
    for (const k of map.house) home[k] = 1;
    for (const k of map.lot) lot[k] = 1;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, cv.width, cv.height);
    for (let k = 0; k < nx * ny; k++) {
      const i = k % nx, j = (k - i) / nx;
      let c: string | null = null;
      if (home[k]) c = "#2b2327";
      else if (wall[k]) c = "#d9d4c8";
      else for (let b = 0; b < WATER.length; b++) if (full[k] >= BANDS[b] && full[k] < BANDS[b + 1]) c = WATER[b];
      if (c) {
        g.fillStyle = c;
        g.fillRect(i * sc, j * sc, sc, sc);
      }
    }
    g.strokeStyle = "#cc331f";
    g.lineWidth = 2;
    g.beginPath();
    const inLot = (ii: number, jj: number) => ii >= 0 && jj >= 0 && ii < nx && jj < ny && (lot[jj * nx + ii] || home[jj * nx + ii]);
    for (let k = 0; k < nx * ny; k++) {
      if (!lot[k] && !home[k]) continue;
      const i = k % nx, j = (k - i) / nx, x = i * sc, y = j * sc;
      if (!inLot(i, j - 1)) { g.moveTo(x, y); g.lineTo(x + sc, y); }
      if (!inLot(i, j + 1)) { g.moveTo(x, y + sc); g.lineTo(x + sc, y + sc); }
      if (!inLot(i - 1, j)) { g.moveTo(x, y); g.lineTo(x, y + sc); }
      if (!inLot(i + 1, j)) { g.moveTo(x + sc, y); g.lineTo(x + sc, y + sc); }
    }
    g.stroke();
    g.fillStyle = "#1a1416";
    g.fillRect(12, cv.height - 18, Math.round(30 / 3.281) * sc, 3);
    g.font = "11px ui-monospace, monospace";
    g.fillText("30 ft", 12, cv.height - 24);
    g.textAlign = "center";
    g.fillText("N ↑", cv.width - 20, 20);
  }, [map, depth]);
  return (
    <div className="hx-card">
      <div className="kicker">Deepest water during the storm, the 80 m around your house</div>
      <canvas ref={ref} className="hx-canvas" aria-label="Map of the deepest water around your house for these settings" />
      <div className="hx-legend">
        {WATER.map((c, b) => (
          <span key={c}>
            <i style={{ background: c }} />
            {BLAB[b]}
          </span>
        ))}
        <span>in deep</span>
        <span>
          <i style={{ background: "#2b2327" }} />
          your house
        </span>
        <span>
          <i style={{ background: "#d9d4c8" }} />
          other buildings
        </span>
        <span>
          <i style={{ border: "2px solid #cc331f", background: "transparent" }} />
          your lot
        </span>
      </div>
    </div>
  );
}

/** Load the house's engine script once (served same-origin by /api/house/[id]/whatif/engine). */
function loadEngine(src: string): Promise<Parameters<typeof engineSource>[0]> {
  const w = window as unknown as { __SPARC_FS?: Parameters<typeof engineSource>[0] };
  if (w.__SPARC_FS) return Promise.resolve(w.__SPARC_FS);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => (w.__SPARC_FS ? resolve(w.__SPARC_FS) : reject(new Error("engine did not load")));
    s.onerror = () => reject(new Error("engine did not load"));
    document.head.appendChild(s);
  });
}
