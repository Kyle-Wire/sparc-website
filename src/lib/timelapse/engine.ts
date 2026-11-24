// The hero time-lapse: a made-up neighbourhood on a floating slab, three days
// long, that goes through a flood, a hurricane, a heat wave, an earthquake that
// opens a sinkhole, a wildfire (smoke, embers, then ash drifting over town), a
// winter storm (snow, a frozen creek, a thaw) and a wind storm, then folds into the fluid cell of
// the SPARC Labs mark (public/brand/sparc-labs-mark.svg) and unfolds again.
//
// It is an illustration. No number in this file comes from a model, a place or
// a measurement, and the page says so beside it. The town, its creek and its
// forest are generated from a fixed seed, so every visitor sees the same one.
//
// Drawn with the 2D canvas, no libraries: about 600 ground tiles, 150 houses and
// 300 trees in true isometric (30 degree) projection, so the slab's box and the
// logo's cube are the same drawing at the end. Painter's order is diagonal
// (i + j), which is exact for a height field seen from this side.
//
// Performance: vertex heights live in typed arrays and nothing is allocated per
// frame except colour strings. Pixel ratio is capped at 2 and drops to 1 when
// frames run slow; small screens draw fewer particles. The caller stops the
// clock when the canvas is off screen or the tab is hidden.

export type SceneId = "unfold" | "flood" | "hurricane" | "night" | "heat" | "quake" | "fire" | "winter" | "wind" | "fold";

export interface Scene {
  id: SceneId;
  label: string;
  /** start and end, seconds into the loop */
  t0: number;
  t1: number;
  /** the moment drawn when motion is reduced */
  still: number;
}

/** The story is written in "story seconds" and played at SPEED (Kyle, 24 Nov: twice as fast). */
const SPEED = 2;
const STORY = 65.5;
export const LOOP = STORY / SPEED;

const STORY_SCENES: [SceneId, string, number, number, number][] = [
  ["unfold", "A neighbourhood wakes", 0, 6, 5.2],
  ["flood", "Flood", 6, 13.5, 10.4],
  ["hurricane", "Hurricane", 13.5, 20.5, 17],
  ["night", "Night", 20.5, 23, 21.8],
  ["heat", "Heat wave", 23, 30, 27.6],
  ["quake", "Earthquake and sinkhole", 30, 37, 35.6],
  ["fire", "Wildfire", 37, 44.5, 41.4],
  ["winter", "Winter storm", 44.5, 52.5, 50.2],
  ["wind", "Wind storm", 52.5, 59, 56.5],
  ["fold", "Into one cell", 59, 65.5, 64.1],
];

export const SCENES: Scene[] = STORY_SCENES.map(([id, label, a, b, st]) => ({ id, label, t0: a / SPEED, t1: b / SPEED, still: st / SPEED }));

export function sceneAt(t: number): number {
  const u = ((t % LOOP) + LOOP) % LOOP;
  for (let i = 0; i < SCENES.length; i++) if (u < SCENES[i].t1) return i;
  return SCENES.length - 1;
}

/* ---------------------------------------------------------------- helpers */

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 before a, ramps to 1 over [a, a + up], holds, ramps back to 0 over [b - down, b]. */
const env = (t: number, a: number, b: number, up: number, down: number) =>
  Math.min(smooth(a, a + up, t), 1 - smooth(b - down, b, t));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(seed: number) {
  const r = rng(seed);
  const P = new Float32Array(256);
  for (let i = 0; i < 256; i++) P[i] = r();
  const at = (x: number, y: number) => P[(((x * 57 + y * 131) % 256) + 256) % 256];
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v);
  };
}

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* ---------------------------------------------------------------- the town */

const N = 24; // tiles on a side
const T0 = 1.5; // soil thickness under the ground, in tiles
const STREET = (k: number) => k % 6 === 3;

type Use = "creek" | "bank" | "forest" | "road" | "yard" | "lot" | "plaza";

interface House {
  x0: number; y0: number; x1: number; y1: number;
  h: number; roof: number; gableX: boolean; flat: boolean;
  wall: RGB; top: RGB; lit: boolean; phase: number;
}
interface Tree { x: number; y: number; h: number; w: number; pine: boolean; phase: number; tone: number }

interface Town {
  use: Use[]; // per tile
  z: Float32Array; // per vertex, ground height above the slab top
  houses: (House | null)[]; // per tile
  trees: Tree[][]; // per tile
  creek: (x: number, y: number) => number; // distance to the creek's line
  hole: { cx: number; cy: number; R: number };
  lamps: [number, number][];
  /** for the back forest: how many tiles of fire front reach it (Infinity: never burns) */
  fireDelay: Float32Array;
}

function buildTown(): Town {
  const r = rng(1899);
  const n1 = valueNoise(7), n2 = valueNoise(11);
  const creekY = (x: number) => 15.2 + 2.2 * Math.sin(x / 4.1) + 0.8 * Math.sin(x / 1.7 + 1);
  const creek = (x: number, y: number) => Math.abs(y - creekY(x));
  const forestness = (x: number, y: number) =>
    0.65 * smooth(13, 21, x - y * 0.25 + 6 * (n1(x / 4, y / 4) - 0.5)) + 0.6 * smooth(19.5, 23, y) + 0.5 * smooth(4, 0, x) * smooth(9, 3, y);

  const use: Use[] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = i + 0.5, y = j + 0.5, d = creek(x, y);
      let u: Use;
      if (d < 0.9) u = "creek";
      else if (d < 1.9) u = "bank";
      else if (forestness(x, y) > 0.55) u = "forest";
      else if (STREET(i) || STREET(j)) u = "road";
      else u = "lot";
      use.push(u);
    }
  // a small square where two streets cross, the future sinkhole
  const hole = { cx: 9.5, cy: 9.5, R: 1.5 };

  const z = new Float32Array((N + 1) * (N + 1));
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++) {
      const d = creek(i, j);
      const valley = 0.85 * smooth(0, 7, d); // the town slopes gently down to the creek
      const hills = 2.0 * smooth(12, 24, i - j * 0.3) * smooth(0, 10, d) + 1.2 * smooth(18, 24, j) + 0.9 * smooth(6, 0, i) * smooth(8, 2, j);
      const wobble = 0.35 * (n2(i / 3, j / 3) - 0.5);
      let h = valley + hills + wobble;
      if (d < 1.2) h -= 0.55 * smooth(1.2, 0.2, d); // the channel
      z[j * (N + 1) + i] = Math.max(0.05, h + 0.3);
    }
  // flatten the town's streets a little so houses sit level
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = use[j * N + i];
      if (u !== "road" && u !== "lot") continue;
      const k = [j * (N + 1) + i, j * (N + 1) + i + 1, (j + 1) * (N + 1) + i, (j + 1) * (N + 1) + i + 1];
      const m = (z[k[0]] + z[k[1]] + z[k[2]] + z[k[3]]) / 4;
      for (const q of k) z[q] = lerp(z[q], m, 0.6);
    }

  const walls: RGB[] = [hex("#c8b9a6"), hex("#b9785f"), hex("#d9cdb8"), hex("#a8604a"), hex("#cfc6b7"), hex("#9c8b7b")];
  const roofs: RGB[] = [hex("#5a4a44"), hex("#6d4a3d"), hex("#4b4f57"), hex("#7a5a43"), hex("#3f4650")];
  const houses: (House | null)[] = new Array(N * N).fill(null);
  const trees: Tree[][] = Array.from({ length: N * N }, () => []);
  const lamps: [number, number][] = [];

  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = use[j * N + i], k = j * N + i;
      if (u === "lot") {
        const onRoad = (a: number, b: number) => a >= 0 && b >= 0 && a < N && b < N && use[b * N + a] === "road";
        const front = onRoad(i - 1, j) || onRoad(i + 1, j) || onRoad(i, j - 1) || onRoad(i, j + 1);
        const tall = i > 6 && i < 12 && j > 3 && j < 9 && r() < 0.6; // a small main street
        if (front && r() < 0.92) {
          const gableX = onRoad(i, j - 1) || onRoad(i, j + 1);
          houses[k] = {
            x0: i + 0.08, y0: j + 0.08, x1: i + 0.92, y1: j + 0.92,
            h: tall ? 1.4 + r() * 1.3 : 0.55 + r() * 0.45,
            roof: tall ? 0 : 0.32, gableX, flat: tall,
            wall: walls[Math.floor(r() * walls.length)], top: roofs[Math.floor(r() * roofs.length)],
            lit: r() < 0.55, phase: r() * 6.28,
          };
        } else {
          use[k] = "yard";
          const nt = 1 + Math.floor(r() * 2);
          for (let q = 0; q < nt; q++)
            trees[k].push({ x: i + 0.25 + r() * 0.5, y: j + 0.25 + r() * 0.5, h: 0.7 + r() * 0.5, w: 0.34 + r() * 0.12, pine: false, phase: r() * 6.28, tone: r() });
        }
      } else if (u === "forest") {
        const nt = 2 + Math.floor(r() * 2);
        for (let q = 0; q < nt; q++)
          trees[k].push({ x: i + 0.15 + r() * 0.7, y: j + 0.15 + r() * 0.7, h: 1.0 + r() * 0.9, w: 0.3 + r() * 0.12, pine: r() < 0.7, phase: r() * 6.28, tone: r() });
        trees[k].sort((a, b) => a.x + a.y - (b.x + b.y));
      } else if (u === "bank" && r() < 0.35) {
        trees[k].push({ x: i + 0.5, y: j + 0.5, h: 0.8 + r() * 0.4, w: 0.36, pine: false, phase: r() * 6.28, tone: r() });
      } else if (u === "road" && STREET(i) && STREET(j)) {
        if (Math.hypot(i + 0.5 - hole.cx, j + 0.5 - hole.cy) > 2.5) lamps.push([i + 0.5, j + 0.5]);
      }
    }
  // a paved square around the crossing at (9, 9), where the ground gives way
  for (let j = 7; j <= 12; j++)
    for (let i = 7; i <= 12; i++) {
      const k = j * N + i;
      if (Math.hypot(i + 0.5 - hole.cx, j + 0.5 - hole.cy) > 2.3 || use[k] === "creek") continue;
      use[k] = "plaza";
      houses[k] = null;
      trees[k] = [];
    }
  // the wildfire starts at the back corner of the forest and runs through it, never into town
  const fireDelay = new Float32Array(N * N).fill(Infinity);
  const nf = valueNoise(23);
  for (let j = 0; j < 19; j++)
    for (let i = 10; i < N; i++)
      if (use[j * N + i] === "forest") fireDelay[j * N + i] = Math.hypot(i - 22.5, j - 1.5) * 0.9 + 3 * nf(i / 2.5, j / 2.5);
  return { use, z, houses, trees, creek, hole, lamps, fireDelay };
}

/* ---------------------------------------------------------------- engine */

interface Particle { x: number; y: number; z: number; vx: number; vy: number; trail: Float32Array; n: number; life: number }

export interface EngineOptions {
  /** called when the scene under the clock changes */
  onScene?: (index: number) => void;
}

const BASE: Record<Use, RGB> = {
  creek: hex("#5d7a70"),
  bank: hex("#86a565"),
  forest: hex("#5b7c48"),
  road: hex("#8f8b84"),
  yard: hex("#8fb066"),
  lot: hex("#94ad6d"),
  plaza: hex("#a29d94"),
};
const SNOW: RGB = hex("#f4f7fa");
const SOIL: RGB[] = [hex("#6b4a2e"), hex("#563a24"), hex("#43301f")];

export class Timelapse {
  private ctx: CanvasRenderingContext2D;
  private town = buildTown();
  private W = 0;
  private H = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private t = 0;
  private last = 0;
  private slow = 0;
  private scene = -1;
  private small = false;
  private burning = new Float32Array(800);
  private nBurning = 0;
  private prevT = 0;
  private stepDt = 0.016;
  // per-vertex working buffers
  private vz = new Float32Array((N + 1) * (N + 1));
  private px = new Float32Array((N + 1) * (N + 1));
  private py = new Float32Array((N + 1) * (N + 1));
  private rain: Float32Array;
  private streaks: Particle[] = [];
  private stars: Float32Array;

  constructor(private canvas: HTMLCanvasElement, private opts: EngineOptions = {}) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("no 2D canvas");
    this.ctx = ctx;
    const r = rng(42);
    this.rain = new Float32Array(260 * 3);
    for (let i = 0; i < this.rain.length; i++) this.rain[i] = r();
    this.stars = new Float32Array(90 * 3);
    for (let i = 0; i < this.stars.length; i++) this.stars[i] = r();
    for (let i = 0; i < 70; i++) {
      this.streaks.push({ x: r() * N, y: r() * N, z: 0, vx: 0, vy: 0, trail: new Float32Array(24), n: 0, life: r() });
    }
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.W = Math.max(1, rect.width);
    this.H = Math.max(1, rect.height);
    this.small = this.W < 520;
    this.dpr = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, this.slow > 2 ? 1 : 2);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.draw(this.t);
  }

  get time() {
    return this.t;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    let acc = 0, frames = 0;
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      // small screens draw at about 30 frames a second
      if (this.small && now - this.last < 30) {
        this.raf = requestAnimationFrame(tick);
        return;
      }
      this.last = now;
      this.t = (this.t + dt) % LOOP;
      const t0 = performance.now();
      this.draw(this.t);
      acc += performance.now() - t0;
      if (++frames === 40) {
        // a slow device gets a lighter canvas
        if (acc / frames > 14 && this.dpr > 1) {
          this.slow = 3;
          this.resize();
        }
        acc = 0;
        frames = 0;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Jump to a moment and draw it once (used for stills and for scrubbing). */
  setTime(t: number) {
    this.t = ((t % LOOP) + LOOP) % LOOP;
    this.draw(this.t);
  }

  destroy() {
    this.stop();
  }

  /* ------------------------------------------------------------ the clock */

  private state(t: number) {
    // hour of the day: two days in one loop
    const keys: [number, number][] = [
      [0, 5.0], [6, 8.5], [13.5, 13.5], [20.5, 20.6], [23, 30.4], [30, 36.6], [37, 38.0], [44.5, 44.0], [46.5, 55.0], [52.5, 58.5], [59, 64.6], [65.5, 77.0],
    ];
    let hour = 5;
    for (let k = 1; k < keys.length; k++)
      if (t <= keys[k][0]) {
        const [a, ha] = keys[k - 1], [b, hb] = keys[k];
        hour = lerp(ha, hb, (t - a) / (b - a));
        break;
      }
    hour %= 24;
    const sunUp = Math.sin((Math.PI * (hour - 6)) / 12); // 1 at noon, below 0 at night
    const day = smooth(-0.12, 0.3, sunUp);
    const golden = clamp(1 - Math.abs(sunUp - 0.12) / 0.3) * (sunUp > -0.15 ? 1 : 0);

    const flood = env(t, 6, 13.5, 1.2, 1.5);
    const hurricane = env(t, 13.5, 20.5, 1.3, 1.6);
    const heat = env(t, 23.6, 30, 2.2, 1.2);
    const quake = env(t, 31, 34.2, 0.15, 1.6);
    const wind = env(t, 52.5, 59, 1.2, 1.6);
    const fire = env(t, 37.4, 44.8, 0.6, 1.4); // flames and smoke
    const burn = t > 37.6 && t < 65.5 ? (t - 37.6) * 2.1 : -99; // how far the fire front has run, in tiles
    const ash = env(t, 39, 46, 1.5, 2);
    const snowfall = env(t, 44.8, 50.5, 1.2, 1.5);
    const snow = env(t, 45, 53.2, 3, 2.4); // lying snow and ice, then the thaw
    const overcast = Math.max(flood, hurricane * 1.1, wind * 0.55, snowfall * 0.85, fire * 0.35);
    const rain = Math.max(env(t, 7, 12, 1, 1.8), hurricane * smooth(14.2, 15.4, t));
    // water: the creek rises in the flood and again under the hurricane
    const water = 0.22 + 0.85 * env(t, 7.4, 13.6, 3.2, 2.6) + 0.6 * env(t, 15, 20.5, 2.2, 2.2);
    const hole = smooth(32.2, 35, t) * (1 - smooth(59.5, 61.5, t)); // the hole stays until the fold
    // fold: 1 at the very start and end of the loop
    const fold = Math.max(1 - smooth(0.4, 4.2, t), smooth(59.3, 62.7, t));
    const gust = wind + hurricane * 1.3 + snowfall * 0.25 + fire * 0.2;
    const windDir = hurricane > wind ? 2.4 + t * 0.6 : fire > 0 ? 2.6 : 0.25; // radians in the ground plane
    return { hour, sunUp, day, golden, flood, hurricane, heat, quake, wind, fire, burn, ash, snowfall, snow, overcast, rain, water, hole, fold, gust, windDir };
  }

  /* ------------------------------------------------------------ drawing */

  private draw(rt: number) {
    const t = rt * SPEED; // story seconds
    const ctx = this.ctx, W = this.W, H = this.H, T = this.town;
    const s = this.state(t);
    this.stepDt = clamp(t - this.prevT, 0, 0.1);
    this.prevT = t;
    const idx = sceneAt(rt);
    if (idx !== this.scene) {
      this.scene = idx;
      this.opts.onScene?.(idx);
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* ---- sky */
    const night: RGB = hex("#0d1324"), dawn: RGB = hex("#e9a072"), dayTop: RGB = hex("#8fbde0"), dayLow: RGB = hex("#d9ecf6");
    const grey: RGB = hex("#7b828c"), hot: RGB = hex("#f3c98b");
    let top = mix(night, dayTop, s.day), low = mix(hex("#1a2440"), dayLow, s.day);
    low = mix(low, dawn, s.golden * 0.75);
    top = mix(top, hex("#6f6f9c"), s.golden * 0.3);
    top = mix(top, mix(hex("#2b313b"), grey, s.day), s.overcast * 0.75);
    low = mix(low, mix(hex("#353b45"), hex("#a3a9b0"), s.day), s.overcast * 0.75);
    low = mix(low, hot, s.heat * 0.55 * s.day);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgb(top));
    sky.addColorStop(1, rgb(low));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // stars and moon at night, the sun by day, on one arc behind the town
    const nightA = (1 - s.day) * (1 - s.overcast * 0.85);
    if (nightA > 0.02) {
      for (let i = 0; i < this.stars.length; i += 3) {
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + i);
        ctx.fillStyle = `rgba(245,245,244,${(nightA * tw * (0.35 + this.stars[i + 2] * 0.6)).toFixed(3)})`;
        ctx.fillRect(this.stars[i] * W, this.stars[i + 1] * H * 0.55, 1.4, 1.4);
      }
    }
    const arc = (hourAngle: number) => {
      const a = Math.PI * hourAngle; // 0 = east horizon, 1 = west horizon
      return [W * (0.08 + 0.84 * a / Math.PI), H * (0.62 - 0.5 * Math.sin(a))] as const;
    };
    const sunPhase = (s.hour - 5.5) / 13;
    if (sunPhase > -0.05 && sunPhase < 1.05 && s.day > 0.02) {
      const [x, y] = arc(clamp(sunPhase));
      const r0 = Math.min(W, H) * (0.045 + s.heat * 0.02);
      const a = (1 - s.overcast * 0.8) * smooth(0.02, 0.3, s.day);
      const glow = ctx.createRadialGradient(x, y, r0 * 0.4, x, y, r0 * (4 + s.heat * 3));
      glow.addColorStop(0, `rgba(255,236,190,${(0.55 * a).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255,236,190,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,${Math.round(lerp(196, 244, s.day))},${Math.round(lerp(120, 214, s.day))},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, r0, 0, Math.PI * 2);
      ctx.fill();
    }
    const moonPhase = (((s.hour - 18 + 24) % 24) / 12.5);
    if (moonPhase < 1.02) {
      const [x, y] = arc(clamp(moonPhase));
      const r0 = Math.min(W, H) * 0.035, a = (1 - s.day) * (1 - s.overcast * 0.7);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r0, 0, Math.PI * 2);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(x, y, r0, 0, Math.PI * 2);
      ctx.moveTo(x + r0 * 1.35, y - r0 * 0.2);
      ctx.arc(x + r0 * 0.45, y - r0 * 0.2, r0 * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236,232,220,${a.toFixed(3)})`;
      ctx.fill("evenodd");
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /* ---- projection: the slab, then the cube */
    const m = s.fold, mE = m * m * (3 - 2 * m);
    const C = Math.cos(Math.PI / 6), Sn = 0.5;
    // world size on screen: the slab fills the frame, the cube sits in the middle
    const uSlab = Math.min((W * 0.94) / (2 * N * C), (H * 0.94) / (N + T0 + 3));
    const uCube = Math.min((H * 0.6) / (2 * N), (W * 0.7) / (2 * N * C));
    const u = lerp(uSlab, uCube, mE);
    const zScale = 1;
    const topZ = lerp(T0 + 3, N, mE);
    const cy = H / 2 - (N * u - topZ * u) / 2 - mE * H * 0.06;
    const cx = W / 2;
    // earthquake: the whole slab shakes
    const shake = s.quake * (this.small ? 2.2 : 3.4);
    const ox = cx + Math.sin(t * 47) * shake + Math.sin(t * 31) * shake * 0.6;
    const oy = cy + Math.cos(t * 39) * shake * 0.5;
    const thick = lerp(T0, N, mE); // the slab's box grows into a cube
    const P = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * C * u, oy + (x + y) * Sn * u - z * u * zScale];

    /* ---- ground heights this frame */
    const hole = T.hole;
    const sheet = (i: number, j: number) =>
      N * 0.55 + N * 0.1 * Math.sin(i / N * 5.2 + 0.6 + t * 0.4 * m) * Math.cos(j / N * 3.4 - 0.4) + N * 0.07 * Math.sin((i + j) / N * 4 - 1);
    for (let j = 0; j <= N; j++)
      for (let i = 0; i <= N; i++) {
        const k = j * (N + 1) + i;
        let z = T.z[k];
        if (s.hole > 0) {
          const dx = i - hole.cx, dy = j - hole.cy, th = Math.atan2(dy, dx);
          const R = hole.R * (1 + 0.22 * Math.sin(th * 3 + 1) + 0.12 * Math.sin(th * 5));
          const d = Math.hypot(dx, dy);
          z -= s.hole * 2.0 * smooth(R + 0.4, R - 0.6, d);
        }
        z = lerp(thick + z, sheet(i, j), mE);
        this.vz[k] = z;
        const [x, y] = P(i, j, z);
        this.px[k] = x;
        this.py[k] = y;
      }

    /* ---- light */
    const amb: RGB = mix(mix(hex("#6f80b8"), hex("#ffd9b8"), s.golden * 0.6), [255, 255, 255], s.day);
    const ambK = lerp(0.72, 1, s.day) * (1 - s.overcast * 0.28 * s.day);
    const sunAz = Math.PI * clamp((s.hour - 6) / 12) + Math.PI * 0.75; // east to west
    const Lx = Math.cos(sunAz), Ly = Math.sin(sunAz), Lz = 0.6 + 0.6 * Math.max(0, s.sunUp);
    const Ln = Math.hypot(Lx, Ly, Lz);
    const dirK = s.day * (1 - s.overcast * 0.7);
    const warm = s.heat * s.day;
    const shadeCol = (c: RGB, n: number) => {
      // n: 0..1 how much the face looks at the sun
      const k = ambK * (0.62 + 0.5 * dirK * n);
      let r = c[0] * k * amb[0] / 255, g = c[1] * k * amb[1] / 255, b = c[2] * k * amb[2] / 255;
      if (warm > 0) {
        r = lerp(r, r * 1.18 + 18, warm);
        g = lerp(g, g * 1.0 + 4, warm);
        b = lerp(b, b * 0.82, warm);
      }
      return rgb([r, g, b]);
    };
    const faceL = 0.25 + 0.75 * Math.max(0, (-Lx * 0 + Ly * 1 + Lz * 0.2) / Ln); // faces looking down the +y axis
    const faceR = 0.25 + 0.75 * Math.max(0, (Lx * 1 + Lz * 0.2) / Ln); // faces looking down the +x axis

    /* ---- the slab's soil, cut faces at the front */
    const soilA = 1 - smooth(0.15, 0.6, m);
    if (soilA > 0.01) {
      ctx.globalAlpha = soilA;
      for (let layer = 0; layer < 3; layer++) {
        const zb = (thick * (3 - layer - 1)) / 3, zt = (thick * (3 - layer)) / 3;
        const topOf = (z: number, ground: number) => (layer === 0 ? ground : z);
        // left face along y = N
        ctx.beginPath();
        let [x, y] = P(0, N, zb);
        ctx.moveTo(x, y);
        [x, y] = P(N, N, zb);
        ctx.lineTo(x, y);
        for (let i = N; i >= 0; i--) {
          const k = N * (N + 1) + i;
          [x, y] = layer === 0 ? [this.px[k], this.py[k]] : P(i, N, topOf(zt, 0));
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = shadeCol(SOIL[layer], faceL * 0.9);
        ctx.fill();
        // right face along x = N
        ctx.beginPath();
        [x, y] = P(N, 0, zb);
        ctx.moveTo(x, y);
        [x, y] = P(N, N, zb);
        ctx.lineTo(x, y);
        for (let j = N; j >= 0; j--) {
          const k = j * (N + 1) + N;
          [x, y] = layer === 0 ? [this.px[k], this.py[k]] : P(N, j, zt);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = shadeCol(SOIL[layer], faceR * 0.75);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* ---- the cube's back edges, behind the sheet */
    const cubeA = smooth(0.35, 0.85, m);
    const edge = (a: [number, number, number], b: [number, number, number], w: number, dash = false) => {
      const [x0, y0] = P(...a), [x1, y1] = P(...b);
      ctx.setLineDash(dash ? [3, 3] : []);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };
    if (cubeA > 0.01) {
      ctx.strokeStyle = `rgba(245,245,244,${(cubeA * 0.22).toFixed(3)})`;
      edge([0, 0, 0], [N, 0, 0], 1, true);
      edge([0, 0, 0], [0, N, 0], 1, true);
      edge([0, 0, 0], [0, 0, N], 1, true);
    }

    /* ---- tiles, water and everything on them, back to front */
    const groundA = 1 - smooth(0.25, 0.75, m);
    const objA = 1 - smooth(0.1, 0.45, m);
    const objH = 1 - smooth(0.05, 0.5, m);
    const W1 = N + 1;
    const waterLevel = s.water;
    this.nBurning = 0;
    const rainSheen = s.rain;
    for (let d = 0; d <= 2 * N - 2; d++) {
      for (let j = Math.max(0, d - N + 1); j <= Math.min(N - 1, d); j++) {
        const i = d - j, k = j * N + i;
        const a = j * W1 + i, b = a + 1, c = a + W1 + 1, e = a + W1;
        const use = T.use[k];
        if (groundA > 0.01) {
          // slope shading from the four corners
          const dzx = (this.vz[b] + this.vz[c] - this.vz[a] - this.vz[e]) / 2;
          const dzy = (this.vz[e] + this.vz[c] - this.vz[a] - this.vz[b]) / 2;
          const nx = -dzx, ny = -dzy, nz = 1, nl = Math.hypot(nx, ny, nz);
          const lam = Math.max(0, (nx * Lx + ny * Ly + nz * Lz) / (nl * Ln));
          let base = BASE[use];
          const sunk = s.hole > 0 && mE < 0.5 ? thick + T.z[a] - this.vz[a] : 0;
          const deep = sunk > 0.25;
          if (deep) base = mix(hex("#9a7550"), SOIL[1], clamp(sunk / 2.2));
          if (use === "road" && rainSheen > 0) base = mix(base, hex("#6f7680"), rainSheen * 0.6);
          if (s.heat > 0 && (use === "yard" || use === "lot" || use === "bank")) base = mix(base, hex("#b7a565"), s.heat * 0.45);
          const fb = s.burn - T.fireDelay[k]; // > 0 once the fire front has reached this tile
          if (fb > 2.2) base = mix(base, hex("#55504a"), 0.85 * smooth(2.2, 4, fb)); // ash
          if (s.snow > 0) base = mix(base, use === "creek" ? hex("#cfe2ea") : SNOW, s.snow * (use === "road" ? 0.55 : use === "creek" ? 0.75 : 0.9));
          ctx.globalAlpha = groundA;
          ctx.fillStyle = shadeCol(base, lam);
          ctx.beginPath();
          ctx.moveTo(this.px[a], this.py[a]);
          ctx.lineTo(this.px[b], this.py[b]);
          ctx.lineTo(this.px[c], this.py[c]);
          ctx.lineTo(this.px[e], this.py[e]);
          ctx.closePath();
          ctx.fill();
          if (fb > 0 && fb < 4.2 && mE < 0.5) {
            // the burning floor glows through the smoke, day or night
            const fl = 0.55 + 0.45 * Math.sin(t * 13 + i * 1.7 + j * 2.3);
            ctx.fillStyle = `rgba(255,${Math.round(90 + 70 * fl)},30,${(0.8 * Math.sin((Math.PI * fb) / 4.2) * groundA).toFixed(3)})`;
            ctx.fill();
            if (this.nBurning < 400) {
              this.burning[this.nBurning * 2] = i + 0.5;
              this.burning[this.nBurning * 2 + 1] = j + 0.5;
              this.nBurning++;
            }
          }
          // street lines
          if (use === "road" && mE < 0.3) {
            ctx.strokeStyle = shadeCol(hex("#b9b4aa"), 0.6);
            ctx.lineWidth = Math.max(0.5, u * 0.05);
            ctx.beginPath();
            if (STREET(i) && !STREET(j)) {
              const [x0, y0] = P(i + 0.5, j, thick + T.z[a]), [x1, y1] = P(i + 0.5, j + 1, thick + T.z[e]);
              ctx.moveTo(x0, y0);
              ctx.lineTo(x1, y1);
            } else if (STREET(j) && !STREET(i)) {
              const [x0, y0] = P(i, j + 0.5, thick + T.z[a]), [x1, y1] = P(i + 1, j + 0.5, thick + T.z[b]);
              ctx.moveTo(x0, y0);
              ctx.lineTo(x1, y1);
            }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          // water: a flat sheet wherever the ground is below the level
          const lo = Math.min(this.vz[a], this.vz[b], this.vz[c], this.vz[e]) - thick;
          if (lo < waterLevel && mE < 0.4 && !(s.hole > 0.1 && Math.hypot(i + 0.5 - T.hole.cx, j + 0.5 - T.hole.cy) < T.hole.R + 0.9)) {
            const zw = thick + waterLevel;
            const depth = clamp((waterLevel - lo) / 0.8);
            const [x0, y0] = P(i, j, zw), [x1, y1] = P(i + 1, j, zw), [x2, y2] = P(i + 1, j + 1, zw), [x3, y3] = P(i, j + 1, zw);
            const wc = mix(mix(hex("#4f86a6"), hex("#2f5f7f"), depth), hex("#d8e8ef"), s.snow * 0.8);
            const glint = 0.1 * Math.sin(t * 3 + i * 0.9 + j * 0.7);
            ctx.fillStyle = shadeCol(wc, 0.55 + glint);
            ctx.globalAlpha = (0.55 + 0.35 * depth) * groundA;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        // objects stand on the tile
        if (objA > 0.01) {
          ctx.globalAlpha = objA;
          const h = T.houses[k];
          if (h) this.house(h, s, t, P, thick + T.z[a], objH, shadeCol, faceL, faceR, u);
          const fbT = s.burn - T.fireDelay[k];
          for (const tr of T.trees[k]) this.tree(tr, s, t, P, thick + this.groundAt(tr.x, tr.y), objH, shadeCol, u, fbT);
          ctx.globalAlpha = 1;
        }
      }
    }

    /* ---- the sheet's grid and outline as the slab becomes the cell */
    if (m > 0.2) {
      const gA = smooth(0.2, 0.7, m);
      ctx.strokeStyle = `rgba(245,245,244,${(gA * 0.8).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const step = 4;
      for (let q = step; q < N; q += step) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const k = q * W1 + i;
          if (i === 0) ctx.moveTo(this.px[k], this.py[k]);
          else ctx.lineTo(this.px[k], this.py[k]);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let j = 0; j <= N; j++) {
          const k = j * W1 + q;
          if (j === 0) ctx.moveTo(this.px[k], this.py[k]);
          else ctx.lineTo(this.px[k], this.py[k]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(245,245,244,${gA.toFixed(3)})`;
      ctx.lineWidth = Math.max(1.5, u * 0.12);
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= N; i++) ctx[i ? "lineTo" : "moveTo"](this.px[i], this.py[i]);
      for (let j = 0; j <= N; j++) ctx.lineTo(this.px[j * W1 + N], this.py[j * W1 + N]);
      for (let i = N; i >= 0; i--) ctx.lineTo(this.px[N * W1 + i], this.py[N * W1 + i]);
      for (let j = N; j >= 0; j--) ctx.lineTo(this.px[j * W1], this.py[j * W1]);
      ctx.closePath();
      ctx.stroke();
    }

    /* ---- weather, over the town */
    if (mE < 0.6) {
      if (s.hurricane > 0.01) this.hurricaneBands(s, t, P, u);
      if (s.gust > 0.05) this.windStreaks(s, t, P, u, thick);
      if (s.heat > 0.05) this.shimmer(s, t, P, u, thick);
      if (s.rain > 0.02) this.rainfall(s, t);
      if (s.fire > 0.02 && this.nBurning > 0) this.smoke(s, t, P, u, thick);
      if (s.ash > 0.02) this.flakes(t, s.ash, "ash");
      if (s.snowfall > 0.02) this.flakes(t, s.snowfall, "snow");
      if (s.quake > 0.02 || s.hole > 0.02) this.quakeDust(s, t, P, u, thick);
    }

    /* ---- the cube's front edges and the name */
    if (cubeA > 0.01) {
      ctx.strokeStyle = `rgba(245,245,244,${cubeA.toFixed(3)})`;
      ctx.lineCap = "round";
      const w = Math.max(2, u * 0.32);
      // outer hexagon
      edge([N, 0, 0], [N, N, 0], w);
      edge([0, N, 0], [N, N, 0], w);
      edge([N, 0, 0], [N, 0, N], w);
      edge([0, N, 0], [0, N, N], w);
      edge([0, 0, N], [N, 0, N], w);
      edge([0, 0, N], [0, N, N], w);
      // the near corner
      edge([N, N, 0], [N, N, N], w);
      edge([N, 0, N], [N, N, N], w);
      edge([0, N, N], [N, N, N], w);
      ctx.lineCap = "butt";
      const nameA = smooth(0.85, 1, m);
      if (nameA > 0.01) {
        const [, yb] = P(N, N, 0);
        const fs = Math.max(14, Math.min(W, H) * 0.06);
        ctx.fillStyle = `rgba(245,245,244,${nameA.toFixed(3)})`;
        ctx.font = `700 ${fs}px Inter, "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("SPARC Labs", W / 2, Math.min(H - fs * 1.4, yb + fs * 0.7));
      }
    }
    ctx.setLineDash([]);
  }

  private groundAt(x: number, y: number) {
    const i = Math.min(N - 1, Math.max(0, Math.floor(x))), j = Math.min(N - 1, Math.max(0, Math.floor(y)));
    const fx = x - i, fy = y - j, W1 = N + 1, z = this.town.z;
    const a = z[j * W1 + i], b = z[j * W1 + i + 1], c = z[(j + 1) * W1 + i + 1], e = z[(j + 1) * W1 + i];
    return lerp(lerp(a, b, fx), lerp(e, c, fx), fy);
  }

  private house(
    h: House, s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number],
    zb: number, k: number, shade: (c: RGB, n: number) => string, faceL: number, faceR: number, u: number,
  ) {
    const ctx = this.ctx;
    const ht = h.h * k, rf = h.roof * k;
    if (ht < 0.02) return;
    // a quake rocks the tall ones
    const rock = s.quake * Math.sin(t * 34 + h.phase) * 0.05 * (h.flat ? 2 : 1);
    const zt = zb + ht;
    const Q = (x: number, y: number, z: number) => {
      const lift = (z - zb) / Math.max(ht, 0.01);
      return P(x + rock * lift, y + rock * lift * 0.4, z);
    };
    const poly = (pts: [number, number][], fill: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let q = 1; q < pts.length; q++) ctx.lineTo(pts[q][0], pts[q][1]);
      ctx.closePath();
      ctx.fill();
    };
    const { x0, y0, x1, y1 } = h;
    poly([Q(x0, y1, zb), Q(x1, y1, zb), Q(x1, y1, zt), Q(x0, y1, zt)], shade(h.wall, faceL));
    poly([Q(x1, y0, zb), Q(x1, y1, zb), Q(x1, y1, zt), Q(x1, y0, zt)], shade(h.wall, faceR * 0.85));
    let roofC = s.heat > 0 ? mix(h.top, hex("#c4583a"), s.heat * 0.35) : h.top;
    if (s.snow > 0) roofC = mix(roofC, SNOW, s.snow * 0.92);
    if (h.flat || rf < 0.02) {
      poly([Q(x0, y0, zt), Q(x1, y0, zt), Q(x1, y1, zt), Q(x0, y1, zt)], shade(mix(roofC, hex("#9a9a96"), 0.5), 0.9));
    } else if (h.gableX) {
      const ym = (y0 + y1) / 2, zr = zt + rf;
      poly([Q(x0, y0, zt), Q(x1, y0, zt), Q(x1, ym, zr), Q(x0, ym, zr)], shade(roofC, 0.35));
      poly([Q(x0, ym, zr), Q(x1, ym, zr), Q(x1, y1, zt), Q(x0, y1, zt)], shade(roofC, faceL));
      poly([Q(x1, y0, zt), Q(x1, y1, zt), Q(x1, ym, zr)], shade(h.wall, faceR * 0.85));
    } else {
      const xm = (x0 + x1) / 2, zr = zt + rf;
      poly([Q(x0, y0, zt), Q(xm, y0, zr), Q(xm, y1, zr), Q(x0, y1, zt)], shade(roofC, 0.35));
      poly([Q(x0, y1, zt), Q(xm, y1, zr), Q(x1, y1, zt)], shade(h.wall, faceL));
      poly([Q(xm, y0, zr), Q(x1, y0, zt), Q(x1, y1, zt), Q(xm, y1, zr)], shade(roofC, faceR));
    }
    // windows light up after dark
    const glow = (1 - s.day) * (h.lit ? 1 : 0.15);
    if (glow > 0.05 && u > 6) {
      ctx.fillStyle = `rgba(255,206,120,${(glow * 0.9).toFixed(3)})`;
      const rows = h.flat ? Math.max(1, Math.floor(ht / 0.45)) : 1;
      for (let r = 0; r < rows; r++) {
        const zz = zb + ht * ((r + 0.45) / (rows + 0.2));
        for (const f of [0.3, 0.7]) {
          const [wx, wy] = Q(lerp(x0, x1, f), y1, zz);
          ctx.fillRect(wx - u * 0.07, wy - u * 0.1, u * 0.14, u * 0.16);
          if (h.flat) {
            const [vx, vy] = Q(x1, lerp(y0, y1, f), zz);
            ctx.fillRect(vx - u * 0.07, vy - u * 0.1, u * 0.14, u * 0.16);
          }
        }
      }
    }
  }

  private tree(
    tr: Tree, s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number],
    zb: number, k: number, shadeIn: (c: RGB, n: number) => string, u: number, fb = -1,
  ) {
    const ctx = this.ctx;
    const burning = fb > 0.15 && fb < 3.8, burnt = fb >= 3.8;
    const fl = 0.5 + 0.5 * Math.sin(t * 17 + tr.phase * 3);
    const shade = burning
      ? (_c: RGB, n: number) => rgb(mix(hex("#ff5a1f"), hex("#ffd45a"), clamp(fl * 0.6 + n * 0.4)))
      : burnt
        ? (_c: RGB, n: number) => shadeIn(hex("#2c2623"), n)
        : shadeIn;
    const h = tr.h * k * (burnt ? 0.8 : 1);
    if (h < 0.03) return;
    // trees bend with the wind: a steady lean plus gusts
    const g = s.gust;
    const sway = g * (0.18 + 0.12 * Math.sin(t * 5.5 + tr.phase)) + 0.02 * Math.sin(t * 1.3 + tr.phase);
    const bx = Math.cos(s.windDir) * sway, by = Math.sin(s.windDir) * sway;
    const [x0, y0] = P(tr.x, tr.y, zb);
    const [xt, yt] = P(tr.x + bx * h, tr.y + by * h, zb + h);
    const [xm, ym] = P(tr.x + bx * h * 0.25, tr.y + by * h * 0.25, zb + h * 0.28);
    ctx.strokeStyle = shade(hex("#5a4632"), 0.5);
    ctx.lineWidth = Math.max(1, u * 0.06);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xm, ym);
    ctx.stroke();
    let leaf: RGB = tr.pine ? mix(hex("#2f5a3a"), hex("#3c6b3f"), tr.tone) : mix(hex("#4f7d3a"), hex("#6f9a45"), tr.tone);
    if (s.heat > 0) leaf = mix(leaf, hex("#9a8a3e"), s.heat * 0.4 * (tr.pine ? 0.4 : 1));
    if (s.snow > 0) leaf = mix(leaf, SNOW, s.snow * 0.6);
    const w = tr.w * u * (tr.pine ? 1 : 1.25) * (burnt ? 0.55 : burning ? 0.9 + 0.2 * fl : 1);
    if (tr.pine) {
      // two stacked cones, split light and shade
      for (const [f0, f1, ww] of [[0.2, 0.75, 1], [0.48, 1, 0.72]] as const) {
        const [ax, ay] = [lerp(xm, xt, f0), lerp(ym, yt, f0)], [tx, ty] = [lerp(xm, xt, f1), lerp(ym, yt, f1)];
        ctx.fillStyle = shade(leaf, 0.9);
        ctx.beginPath();
        ctx.moveTo(ax - w * ww, ay);
        ctx.lineTo(tx, ty);
        ctx.lineTo(ax, ay + w * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade(leaf, 0.25);
        ctx.beginPath();
        ctx.moveTo(ax + w * ww, ay);
        ctx.lineTo(tx, ty);
        ctx.lineTo(ax, ay + w * 0.25);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // a faceted crown: a hexagon split down the middle
      const cxm = lerp(xm, xt, 0.62), cym = lerp(ym, yt, 0.62), r = w;
      ctx.fillStyle = shade(leaf, 0.9);
      ctx.beginPath();
      ctx.moveTo(cxm, cym - r * 1.05);
      ctx.lineTo(cxm - r, cym - r * 0.45);
      ctx.lineTo(cxm - r * 0.9, cym + r * 0.5);
      ctx.lineTo(cxm, cym + r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(leaf, 0.3);
      ctx.beginPath();
      ctx.moveTo(cxm, cym - r * 1.05);
      ctx.lineTo(cxm + r, cym - r * 0.45);
      ctx.lineTo(cxm + r * 0.9, cym + r * 0.5);
      ctx.lineTo(cxm, cym + r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }

  private smokeSprite: HTMLCanvasElement | null = null;
  private smoke(s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number], u: number, thick: number) {
    const ctx = this.ctx;
    if (!this.smokeSprite) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, "rgba(92,84,78,0.85)");
      grad.addColorStop(0.55, "rgba(110,102,96,0.4)");
      grad.addColorStop(1, "rgba(120,112,104,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      this.smokeSprite = c;
    }
    const n = this.nBurning, puffs = this.small ? 26 : 48;
    const dx = Math.cos(s.windDir), dy = Math.sin(s.windDir);
    for (let q = 0; q < puffs; q++) {
      const src = (q * 7) % n;
      const x0 = this.burning[src * 2], y0 = this.burning[src * 2 + 1];
      const life = (t * 0.45 + this.rain[q * 3]) % 1;
      const rise = life * 7;
      const x = x0 + dx * rise * 0.8, y = y0 + dy * rise * 0.8;
      const [sx, sy] = P(x, y, thick + this.groundAt(Math.min(N, Math.max(0, x0)), Math.min(N, Math.max(0, y0))) + 1 + rise);
      const size = u * (0.8 + life * 2.6);
      ctx.globalAlpha = s.fire * 0.5 * Math.sin(Math.PI * life);
      ctx.drawImage(this.smokeSprite, sx - size, sy - size, size * 2, size * 2);
    }
    // embers lifting off the flames
    ctx.globalAlpha = 1;
    for (let q = 0; q < (this.small ? 24 : 50); q++) {
      const src = (q * 13) % n;
      const life = (t * 0.9 + this.rain[q * 3 + 1]) % 1;
      const x = this.burning[src * 2] + dx * life * 2 + Math.sin(q + t * 4) * 0.3, y = this.burning[src * 2 + 1] + dy * life * 2;
      const [sx, sy] = P(x, y, thick + 1.2 + life * 4);
      ctx.fillStyle = `rgba(255,${150 + (q % 4) * 25},60,${(s.fire * (1 - life)).toFixed(3)})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  /** Falling snow, or the ash that drifts over town after the fire: small squares, no rain streaks. */
  private flakes(t: number, amount: number, kind: "snow" | "ash") {
    const ctx = this.ctx, W = this.W, H = this.H;
    const n = Math.floor((this.small ? 90 : 180) * amount);
    ctx.fillStyle = kind === "snow" ? "rgba(250,252,255,0.9)" : "rgba(120,114,108,0.75)";
    for (let q = 0; q < n; q++) {
      const a = this.rain[q * 3], b = this.rain[q * 3 + 1], c = this.rain[q * 3 + 2];
      const sp = kind === "snow" ? 0.12 + c * 0.1 : 0.06 + c * 0.05;
      const y = ((b + t * sp) % 1) * (H + 20) - 10;
      const x = (((a + Math.sin(t * 0.8 + q) * 0.015 + (kind === "ash" ? t * 0.01 : 0)) % 1) + 1) % 1 * W;
      const r = kind === "snow" ? 1.5 + c * 1.6 : 1.2 + c * 1.4;
      ctx.globalAlpha = kind === "snow" ? 0.6 + 0.4 * c : amount;
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 1;
  }

  private rainfall(s: ReturnType<Timelapse["state"]>, t: number) {
    const ctx = this.ctx, W = this.W, H = this.H;
    const n = Math.floor((this.small ? 120 : 260) * s.rain);
    const slant = 0.25 + s.hurricane * 0.9;
    ctx.strokeStyle = `rgba(214,226,238,${(0.25 + 0.3 * s.rain).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let q = 0; q < n; q++) {
      const a = this.rain[q * 3], b = this.rain[q * 3 + 1], c = this.rain[q * 3 + 2];
      const sp = 0.9 + c * 0.6;
      const y = ((b + t * sp * 1.3) % 1) * (H + 40) - 20;
      const x = ((a + t * 0.12 * slant) % 1) * (W + 60) - 30 + y * slant * 0.3;
      const len = 8 + c * 10;
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * slant * 0.5, y - len);
    }
    ctx.stroke();
  }

  private hurricaneBands(s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number], u: number) {
    const ctx = this.ctx;
    // the eye tracks across the town, the bands turn counter-clockwise
    const prog = smooth(13.5, 20.5, t);
    const ex = lerp(-6, N + 8, prog), ey = lerp(N * 0.2, N * 0.7, prog);
    const [cx, cy] = P(ex, ey, N * 0.55);
    const rot = -t * 0.8;
    const puff = this.cloudSprite();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.5); // a flat disc of cloud seen at this angle
    const arms = 3, per = this.small ? 14 : 22;
    for (let arm = 0; arm < arms; arm++) {
      for (let q = 0; q < per; q++) {
        const th = (q / per) * Math.PI * 1.9;
        const r = u * 2.2 * Math.exp(0.5 * th);
        const a = rot + (arm * Math.PI * 2) / arms + th;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        const size = u * (1.6 + q * 0.32);
        ctx.globalAlpha = s.hurricane * 0.55 * (1 - q / per * 0.55);
        ctx.drawImage(puff, x - size, y - size, size * 2, size * 2);
      }
    }
    // the eye wall: a tight ring of cloud
    for (let q = 0; q < 16; q++) {
      const a = rot * 1.6 + (q / 16) * Math.PI * 2, r = u * 2.4;
      ctx.globalAlpha = s.hurricane * 0.5;
      ctx.drawImage(puff, Math.cos(a) * r - u * 1.4, Math.sin(a) * r - u * 1.4, u * 2.8, u * 2.8);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private puff: HTMLCanvasElement | null = null;
  private cloudSprite() {
    if (this.puff) return this.puff;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, "rgba(232,236,240,0.9)");
    grad.addColorStop(0.5, "rgba(206,212,220,0.45)");
    grad.addColorStop(1, "rgba(190,198,208,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    this.puff = c;
    return c;
  }

  private windStreaks(s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number], u: number, thick: number) {
    const ctx = this.ctx;
    const n = Math.floor((this.small ? 36 : 70) * clamp(s.gust));
    const swirl = s.hurricane > s.wind;
    ctx.lineWidth = Math.max(1.2, u * 0.12);
    ctx.lineCap = "round";
    const dt = this.stepDt;
    for (let q = 0; q < n; q++) {
      const p = this.streaks[q];
      // the wind: steady from the west, bending over the hills; round the eye in a hurricane
      let vx: number, vy: number;
      if (swirl) {
        const prog = smooth(13.5, 20.5, t);
        const ex = lerp(-6, N + 8, prog), ey = lerp(N * 0.2, N * 0.7, prog);
        const dx = p.x - ex, dy = p.y - ey, r = Math.hypot(dx, dy) + 2;
        vx = (dy / r) * 9 + dx / r * -1.5;
        vy = (-dx / r) * 9 + dy / r * -1.5;
      } else {
        vx = 8 + 3 * Math.sin(p.y * 0.5 + t);
        vy = 2.2 * Math.sin(p.x * 0.35 + t * 1.7 + q);
      }
      p.x += vx * dt * (0.7 + s.gust * 0.6);
      p.y += vy * dt * (0.7 + s.gust * 0.6);
      p.life += dt * 0.5;
      if (p.x < -1 || p.y < -1 || p.x > N + 1 || p.y > N + 1 || p.life > 1) {
        p.x = swirl ? Math.random() * N : -0.5 + Math.random() * 3;
        p.y = Math.random() * N;
        p.life = 0;
        p.n = 0;
      }
      // trail
      const tr = p.trail;
      if (p.n < 12) p.n++;
      for (let k = tr.length - 2; k >= 2; k -= 2) {
        tr[k] = tr[k - 2];
        tr[k + 1] = tr[k - 1];
      }
      const z = thick + this.groundAt(Math.min(N, Math.max(0, p.x)), Math.min(N, Math.max(0, p.y))) + 1.3 + 0.4 * Math.sin(q);
      const [sx, sy] = P(p.x, p.y, z);
      tr[0] = sx;
      tr[1] = sy;
      if (p.n < 3) continue;
      const fade = Math.sin(Math.PI * clamp(p.life)) * clamp(s.gust);
      ctx.strokeStyle = `rgba(244,247,248,${((swirl ? 0.45 : 0.8) * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(tr[0], tr[1]);
      for (let k = 2; k < p.n * 2; k += 2) ctx.lineTo(tr[k], tr[k + 1]);
      ctx.stroke();
      // a leaf now and then
      if (q % 3 === 0 && !swirl) {
        ctx.fillStyle = `rgba(150,170,80,${fade.toFixed(3)})`;
        const a = t * 9 + q;
        ctx.save();
        ctx.translate(sx, sy + u * 0.6);
        ctx.rotate(a);
        ctx.fillRect(-u * 0.12, -u * 0.05, u * 0.24, u * 0.1);
        ctx.restore();
      }
    }
    ctx.lineCap = "butt";
  }

  private shimmer(s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number], u: number, thick: number) {
    const ctx = this.ctx;
    const n = this.small ? 18 : 34;
    ctx.lineWidth = Math.max(1, u * 0.08);
    for (let q = 0; q < n; q++) {
      const a = this.rain[q * 3], b = this.rain[q * 3 + 1];
      const x = 3 + a * (N - 6), y = 2 + b * (N - 8);
      const life = (t * 0.6 + a * 7) % 1;
      const z0 = thick + this.groundAt(x, y) + 0.2 + life * 2.2;
      ctx.strokeStyle = `rgba(255,214,150,${(s.heat * 0.4 * Math.sin(Math.PI * life)).toFixed(3)})`;
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) {
        const zz = z0 + k * 0.18;
        const [sx, sy] = P(x + 0.12 * Math.sin(k * 1.4 + t * 6 + q), y, zz);
        if (k === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  }

  private quakeDust(s: ReturnType<Timelapse["state"]>, t: number, P: (x: number, y: number, z: number) => [number, number], u: number, thick: number) {
    const ctx = this.ctx, hole = this.town.hole;
    // cracks running out from the hole along the streets
    const grow = s.hole;
    if (grow > 0.05) {
      ctx.strokeStyle = `rgba(40,28,20,${(0.75 * Math.min(1, grow * 2)).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, u * 0.06);
      for (let c = 0; c < 6; c++) {
        const th = c * 1.05 + 0.3;
        ctx.beginPath();
        let x = hole.cx + Math.cos(th) * hole.R, y = hole.cy + Math.sin(th) * hole.R;
        let [sx, sy] = P(x, y, thick + this.groundAt(x, y));
        ctx.moveTo(sx, sy);
        for (let k = 1; k <= 4; k++) {
          x += Math.cos(th + Math.sin(k * 2.1 + c) * 0.5) * 0.55 * grow;
          y += Math.sin(th + Math.sin(k * 2.1 + c) * 0.5) * 0.55 * grow;
          [sx, sy] = P(x, y, thick + this.groundAt(x, y));
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }
    // dust thrown up as the ground drops
    const dust = s.quake * grow;
    if (dust > 0.02) {
      for (let q = 0; q < 14; q++) {
        const a = this.rain[q * 3] * Math.PI * 2, life = (t * 0.7 + this.rain[q * 3 + 1]) % 1;
        const x = hole.cx + Math.cos(a) * hole.R * 0.8, y = hole.cy + Math.sin(a) * hole.R * 0.8;
        const [sx, sy] = P(x, y, thick + 0.3 + life * 1.6);
        ctx.fillStyle = `rgba(190,170,140,${(dust * 0.35 * (1 - life)).toFixed(3)})`;
        const r = u * (0.3 + life * 0.6);
        ctx.fillRect(sx - r, sy - r * 0.6, r * 2, r * 1.2);
      }
    }
  }
}

function rgb(c: RGB) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}
