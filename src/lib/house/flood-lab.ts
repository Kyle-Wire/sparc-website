/**
 * The flood what-if lab's answers, from either of two sources:
 *
 *  - engineSource: a buyer's own house. FloodSim's emulator and cascade code
 *    (loaded from the buyer's private files, never from this repo) and the
 *    house's emulator export (CHI tools/whatif/validate.mjs --export). This is
 *    the same arithmetic as CHI tools/whatif/page.html, ported line for line:
 *    the route (sure, or harder to call), the water level against the house,
 *    and the ±2σ ranges with the study's calibration factor k.
 *  - latticeSource: the public demo. Sample A's answers at fixed slider stops,
 *    made by scripts/house/make-sample-lattice.mjs from the same page. No
 *    geometry and no engine code.
 *
 * Everything here is in metres; the component turns it into inches and cm.
 */

export interface LabParam {
  key: string;
  title: string;
  group: "weather" | "you";
  min: number;
  max: number;
  log?: boolean;
  /** Fixed stops (the demo). Without them the slider is continuous. */
  stops?: number[];
  /** Where the slider starts. */
  start: number;
}

export interface Range {
  mid: number;
  lo: number;
  hi: number;
}

export interface LabAnswer {
  /** Water standing against the house, above today's ground (0 = dry). */
  wall: Range;
  /** Deepest water anywhere in the back yard, including a rain garden bowl. */
  rear: Range;
  /** Water standing on the lot's open ground at its deepest, added up, m³. */
  lot: Range;
  /** True when the router trusts the emulator here; false = harder to call. */
  sure: boolean;
  /** The worst ± on the lot at these settings, metres. */
  pm: number;
  /** Peak depth on each masked cell (buyer only, for the map). */
  depth?: Float32Array;
}

export interface LabStudy {
  runs: number;
  test: number;
  worstThrough: number;
  tol: number;
  features: { french_drain?: number; rain_garden?: number };
  /** The full model's own runs with nothing built: water against the house, low and high. */
  without: [number, number] | null;
  floodsim: string;
}

export interface LabSource {
  params: LabParam[];
  study: LabStudy;
  ask(values: number[]): LabAnswer;
  /** Map geometry, present only for the buyer's own house. */
  map?: { nx: number; ny: number; mask: number[]; walls: number[]; house: number[]; lot: number[] };
}

const TITLES: Record<string, { title: string; group: "weather" | "you"; start?: number }> = {
  ari: { title: "Storm", group: "weather", start: 10 },
  se: { title: "Ground before the rain", group: "weather", start: 0.55 },
  "design:1.media": { title: "French drain depth", group: "you" },
  "design:2.ponding": { title: "Rain garden bowl depth", group: "you" },
  "design:2.media": { title: "Rain garden soil depth", group: "you" },
};

/** How a slider's value reads to a homeowner (US units first). */
export function formatValue(key: string, v: number): string {
  const inch = (m: number) => m / 0.0254;
  if (key === "ari") return `${v < 10 ? (Math.round(v * 10) / 10).toString() : Math.round(v)}-year storm, 1 hour`;
  if (key === "se") return v < 0.35 ? "dry" : v < 0.6 ? "damp" : v < 0.8 ? "wet" : "soaked";
  if (key === "design:1.media") return `${inch(v).toFixed(0)} in of gravel`;
  if (key === "design:2.ponding") return `${inch(v).toFixed(1)} in deep`;
  if (key === "design:2.media") return `${inch(v).toFixed(0)} in of soil`;
  return v.toFixed(2);
}

/** Depth for people: inches first, with cm. "Dry" under half a millimetre. */
export function formatDepth(m: number): { big: string; small: string } {
  if (m < 0.0005) return { big: "Dry", small: "" };
  const inch = m / 0.0254;
  return { big: `${inch < 1 ? inch.toFixed(2) : inch.toFixed(1)} in`, small: `${(m * 100).toFixed(1)} cm` };
}

export const toUnit = (p: LabParam, v: number) =>
  p.log ? (Math.log(v) - Math.log(p.min)) / (Math.log(p.max) - Math.log(p.min)) : (v - p.min) / (p.max - p.min);
export const fromUnit = (p: LabParam, u: number) =>
  p.log ? Math.exp(Math.log(p.min) + u * (Math.log(p.max) - Math.log(p.min))) : p.min + u * (p.max - p.min);

// ---------------------------------------------------------------- the demo

export interface Lattice {
  keys: string[];
  stops: number[][];
  rows: number[][];
  without_mm: [number, number] | null;
  study: { runs: number; test: number; worst_through_mm: number; tol_mm: number; features_m2: LabStudy["features"]; floodsim: string };
}

export function latticeSource(L: Lattice): LabSource {
  const params: LabParam[] = L.keys.map((key, j) => {
    const t = TITLES[key] ?? { title: key, group: "you" as const };
    const stops = L.stops[j];
    const start = t.start !== undefined ? nearest(stops, t.start) : stops[Math.floor((stops.length - 1) / 2)];
    return { key, title: t.title, group: t.group, min: stops[0], max: stops[stops.length - 1], log: key === "ari", stops, start };
  });
  const strides = L.stops.map((_, j) => L.stops.slice(j + 1).reduce((a, s) => a * s.length, 1));
  const mm = (x: number) => x / 1000;
  return {
    params,
    study: {
      runs: L.study.runs,
      test: L.study.test,
      worstThrough: mm(L.study.worst_through_mm),
      tol: mm(L.study.tol_mm),
      features: L.study.features_m2,
      without: L.without_mm ? [mm(L.without_mm[0]), mm(L.without_mm[1])] : null,
      floodsim: L.study.floodsim,
    },
    ask(values) {
      const i = values.reduce((acc, v, j) => acc + L.stops[j].indexOf(nearest(L.stops[j], v)) * strides[j], 0);
      const r = L.rows[i];
      return {
        wall: { mid: mm(r[0]), lo: mm(r[1]), hi: mm(r[2]) },
        rear: { mid: mm(r[3]), lo: mm(r[4]), hi: mm(r[5]) },
        lot: { mid: r[6] / 10, lo: r[7] / 10, hi: r[8] / 10 },
        sure: r[9] === 1,
        pm: mm(r[10]),
      };
    },
  };
}

export function nearest(stops: number[], v: number): number {
  return stops.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), stops[0]);
}

// ---------------------------------------------------------------- a buyer's house

/* The engine's own types are FloodSim's; only the calls used here are named. */
interface FSApi {
  deserialize(em: unknown, blobs: Record<string, Float32Array>): unknown;
  route(em: unknown, u: number[], opt: unknown): {
    route: string;
    worstSd2: number;
    answer: { depth: Float32Array; depthSd: Float32Array; wse: Float32Array; scalars: Record<string, { mean: number; sd: number }> };
  };
  toUnit(p: unknown, v: number): number;
  fromUnit(p: unknown, u: number): number;
}

/* The emulator export (CHI validate.mjs --export); only the fields read here. */
export interface WhatIfModel {
  params: { key: string; label: string; min: number; max: number; log?: boolean; who: string }[];
  em: unknown;
  blobs: Record<string, string>;
  ground: { coef: string[] };
  region: unknown;
  tol: number;
  k: number;
  maxGap: number;
  ell: number[];
  today?: string;
  besideHouse: number[];
  nx: number;
  ny: number;
  mask: number[];
  walls: number[];
  house: number[];
  sets: { lot: number[] };
  features_m2?: LabStudy["features"];
  result: {
    runs: { train: number; holdout: number; test: number; low: number; none: number };
    rules: { noBadAnswer: { worstLetThrough: number } };
    levelWithout?: { level: number }[];
    floodsim?: { commit?: string[] };
  };
  floodsim?: { commit?: string[] };
}

const b64 = (s: string) => {
  const bin = atob(s), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Float32Array(u8.buffer);
};

export function engineSource(FS: FSApi, W: WhatIfModel): LabSource {
  const em = FS.deserialize(W.em, Object.fromEntries(Object.entries(W.blobs).map(([k, v]) => [k, b64(v)])));
  const coef = W.ground.coef.map(b64), M = coef[0].length, D = W.params.length;
  const ground = (u: number[]) => {
    const z = new Float32Array(M);
    for (let m = 0; m < M; m++) { let v = coef[0][m]; for (let j = 0; j < D; j++) v += coef[j + 1][m] * u[j]; z[m] = v; }
    return z;
  };
  const tol = { depth: W.tol, scalars: { wallPeak: W.tol } };
  const band = (s: { mean: number; sd: number }): Range => {
    const r = 2 * W.k * s.sd;
    return { mid: Math.max(0, s.mean), lo: Math.max(0, s.mean - r), hi: Math.max(0, s.mean + r) };
  };
  const today = W.today ? b64(W.today) : null;
  const params: LabParam[] = W.params.map((p) => {
    const t = TITLES[p.key] ?? { title: p.label, group: p.who === "you" ? ("you" as const) : ("weather" as const) };
    const start = Math.min(p.max, Math.max(p.min, t.start ?? (p.min + p.max) / 2));
    return { key: p.key, title: t.title, group: t.group, min: p.min, max: p.max, log: p.log, start };
  });
  const without = (W.result.levelWithout ?? []).map((b) => b.level).filter(Number.isFinite).sort((a, b) => a - b);
  return {
    params,
    study: {
      runs: W.result.runs.train + W.result.runs.holdout + W.result.runs.test + W.result.runs.low + W.result.runs.none,
      test: W.result.runs.test,
      worstThrough: W.result.rules.noBadAnswer.worstLetThrough,
      tol: W.tol,
      features: W.features_m2 ?? {},
      without: without.length ? [without[0], without[without.length - 1]] : null,
      floodsim: (W.result.floodsim?.commit ?? W.floodsim?.commit ?? []).join(", "),
    },
    map: { nx: W.nx, ny: W.ny, mask: W.mask, walls: W.walls, house: W.house, lot: W.sets.lot },
    ask(values) {
      const u = values.map((v, j) => FS.toUnit(W.params[j], v));
      const ro = FS.route(em, u, { zm: ground(u), region: W.region, tol, k: W.k, maxGap: W.maxGap, ell: W.ell });
      const a = ro.answer, sc = a.scalars;
      let wall: Range = band(sc.wallPeak);
      if (today) {
        let v = 0, lo = 0, hi = 0;
        for (const m of W.besideHouse) {
          if (a.depth[m] <= 0.005 && a.wse[m] + 2 * W.k * a.depthSd[m] - today[m] <= 0) continue;
          const r = 2 * W.k * a.depthSd[m], x = a.wse[m] - today[m];
          if (a.depth[m] > 0.005) v = Math.max(v, x);
          lo = Math.max(lo, a.depth[m] > 0.005 ? x - r : 0);
          hi = Math.max(hi, x + r);
        }
        wall = { mid: Math.max(0, v), lo: Math.max(0, Math.min(lo, v)), hi: Math.max(0, hi, v) };
      }
      return { wall, rear: band(sc.rearPeak), lot: band(sc.lotSum), sure: ro.route === "emulator", pm: ro.worstSd2, depth: a.depth };
    },
  };
}
