/**
 * Make the public demo's flood lab table from a what-if page (Climate Home
 * Inspection tools/whatif/page.mjs, D46/D51). Run on a machine that has the page:
 *
 *   node scripts/house/make-sample-lattice.mjs <what-if.html> src/lib/house/sample-flood-lattice.json
 *
 * The page carries the house's own emulator (FloodSim src/emulator.js and
 * src/cascade.js, copied whole). This script opens it in headless Chromium and
 * asks it every combination of the slider stops below, using the same
 * functions the page uses (route, the level against the house, the ranges).
 * Only the answers are written, as whole millimetres: no geometry, no engine
 * code. That is what lets the public demo show a sample house's lab without
 * putting FloodSim's code or the house's surroundings in this public repo.
 * A signed-in buyer's lab runs the real engine from their private files instead.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

// Playwright is not a dependency of the site: use whichever install the machine has.
const { chromium } = createRequire(import.meta.url)("playwright");

const [page, out] = process.argv.slice(2);
if (!page || !out) {
  console.error("usage: node scripts/house/make-sample-lattice.mjs <what-if.html> <out.json>");
  process.exit(2);
}

// Slider stops, in each parameter's own units.
const STOPS = {
  ari: [2, 5, 10, 25, 50, 100],
  se: [0.15, 0.35, 0.55, 0.75, 0.95],
  "design:1.media": [0.1, 0.4, 0.8, 1.2],
  "design:2.ponding": [0.02, 0.1, 0.2, 0.3],
  "design:2.media": [0.1, 0.35, 0.6, 0.9],
};

const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(pathToFileURL(page).href);
const result = await tab.evaluate((STOPS) => {
  /* global FS */
  const W = window.WHATIF;
  const b64 = (s) => { const bin = atob(s), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Float32Array(u8.buffer); };
  const em = FS.deserialize(W.em, Object.fromEntries(Object.entries(W.blobs).map(([k, v]) => [k, b64(v)])));
  const coef = W.ground.coef.map(b64), M = coef[0].length, P = W.params, D = P.length;
  const ground = (u) => { const z = new Float32Array(M); for (let m = 0; m < M; m++) { let v = coef[0][m]; for (let j = 0; j < D; j++) v += coef[j + 1][m] * u[j]; z[m] = v; } return z; };
  const tol = { depth: W.tol, scalars: { wallPeak: W.tol } };
  const ask = (u) => FS.route(em, u, { zm: ground(u), region: W.region, tol, k: W.k, maxGap: W.maxGap, ell: W.ell });
  const band = (s) => { const r = 2 * W.k * s.sd; return { mid: Math.max(0, s.mean), lo: Math.max(0, s.mean - r), hi: Math.max(0, s.mean + r) }; };
  const today = W.today ? b64(W.today) : null;
  const level = (a) => { if (!today) return null; let v = 0, lo = 0, hi = 0;
    for (const m of W.besideHouse) { if (a.depth[m] <= 0.005 && a.wse[m] + 2 * W.k * a.depthSd[m] - today[m] <= 0) continue;
      const r = 2 * W.k * a.depthSd[m], x = a.wse[m] - today[m];
      if (a.depth[m] > 0.005) v = Math.max(v, x); lo = Math.max(lo, a.depth[m] > 0.005 ? x - r : 0); hi = Math.max(hi, x + r); }
    return { mid: Math.max(0, v), lo: Math.max(0, Math.min(lo, v)), hi: Math.max(0, hi, v) }; };
  const mm = (x) => Math.round(x * 1000);
  const keys = P.map((p) => p.key), stops = keys.map((k) => STOPS[k]);
  const rows = [];
  const idx = new Array(D).fill(0);
  for (;;) {
    const u = idx.map((i, j) => FS.toUnit(P[j], stops[j][i]));
    const ro = ask(u), a = ro.answer, sc = a.scalars;
    const wall = level(a) ?? band(sc.wallPeak), rear = band(sc.rearPeak), vol = band(sc.lotSum);
    rows.push([mm(wall.mid), mm(wall.lo), mm(wall.hi), mm(rear.mid), mm(rear.lo), mm(rear.hi),
      Math.round(vol.mid * 10), Math.round(vol.lo * 10), Math.round(vol.hi * 10), ro.route === "emulator" ? 1 : 0, mm(ro.worstSd2)]);
    let j = D - 1; while (j >= 0 && ++idx[j] === stops[j].length) { idx[j] = 0; j--; } if (j < 0) break;
  }
  const without = (W.result.levelWithout || []).map((b) => b.level).filter(Number.isFinite).sort((x, y) => x - y);
  const r = W.result;
  return {
    keys, stops,
    columns: ["wall_mm", "wall_lo_mm", "wall_hi_mm", "rear_mm", "rear_lo_mm", "rear_hi_mm", "lot_dm3x100", "lot_lo", "lot_hi", "sure", "pm_mm"],
    rows,
    without_mm: without.length ? [mm(without[0]), mm(without.at(-1))] : null,
    study: { runs: r.runs.train + r.runs.holdout + r.runs.test + r.runs.low + r.runs.none, test: r.runs.test,
      worst_through_mm: mm(r.rules.noBadAnswer.worstLetThrough), tol_mm: mm(W.tol), features_m2: W.features_m2 ?? {},
      floodsim: (r.floodsim?.commit || W.floodsim?.commit || []).join(", ") },
  };
}, STOPS);
await browser.close();
result.source = "Sample A (PHL-POC-001) what-if study, Climate Home Inspection D46/D48/D51; answers only";
writeFileSync(out, JSON.stringify(result) + "\n");
console.log(`wrote ${result.rows.length} answers to ${out}`);
