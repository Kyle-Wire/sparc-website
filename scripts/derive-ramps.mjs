/**
 * Derives the sequential data ramp and prints both data ramps as a token block.
 *
 * Why this is a script and not nine hand-picked hexes: the one property the
 * sequential ramp has to have is that it is luminance-monotonic, and that is a
 * property you either prove or you don't have. `--grad-ramp` looks like a ramp
 * and is not one -- four of its nine steps land inside a 19-level band out of
 * 256, so stages 02-05 of the pipeline were one colour in greyscale print and
 * for a red-green-deficient reader. The brand ramp was picked by eye, which is
 * exactly how that happens.
 *
 * Method: keep the brand ramp's hue at each step (so the ramp still reads as
 * ours), then solve HSL lightness so that each step hits an evenly spaced
 * target on the 8-bit greyscale. Hue is the thing a brand cares about;
 * lightness is the thing a reader decodes. The brand keeps the first and the
 * ramp earns the second.
 *
 * Run: node scripts/derive-ramps.mjs
 * The emitted block is pasted into src/styles/tokens.css. Re-run it if a brand
 * hue ever changes; src/styles/__ramp-check__ is not a thing, the gate is
 * scripts/check-ramps.mjs, which re-derives and compares.
 */

const BRAND = {
  purple: "#602468",
  magenta: "#9e337d",
  pink: "#e94d9b",
  red: "#e94461",
  crimson: "#e73c25",
  orange: "#e76c25",
  amber: "#e79024",
  gold: "#f0b632",
  yellow: "#fbdd46",
};

/* Evenly spaced 8-bit greyscale targets. The gap between adjacent steps (25)
   is what the greyscale legend test asserts; see docs/design/data-ramps.md. */
const GREY_TARGETS = [32, 57, 82, 107, 132, 157, 182, 207, 232];

/* ColorBrewer RdBu, 9-class, adopted verbatim. Not derived, not adjusted:
   FloodSim (app/map.html, rgb(33,102,172) -> rgb(178,24,43)) and
   insar_pipeline (figures.py, cmap="RdBu" with TwoSlopeNorm(0, -lim, lim))
   independently landed on it for signed change. Index 4 is the neutral
   midpoint and zero pins to it. */
const RDBU_9 = [
  "#2166ac", "#4393c3", "#92c5de", "#d1e5f0",
  "#f7f7f7",
  "#fddbc7", "#f4a582", "#d6604d", "#b2182b",
];

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hexToRgb = (h) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
const rgbToHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const relLum = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map((v) => toLinear(v / 255));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const grey8 = (rgb) => Math.pow(relLum(rgb), 1 / 2.2) * 255;
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hp) % 6];
  return seg.map((v) => (v + m) * 255);
}

/* Solve lightness for a target 8-bit grey, holding hue and saturation.
   Lightness is monotonic in luminance, so a bisection always converges. */
function solveForGrey(hue, sat, targetGrey) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const g = grey8(hslToRgb([hue, sat, mid]));
    if (g < targetGrey) lo = mid; else hi = mid;
  }
  return hslToRgb([hue, sat, (lo + hi) / 2]);
}

const names = Object.keys(BRAND);
const sequential = names.map((name, i) => {
  const [h, s] = rgbToHsl(hexToRgb(BRAND[name]));
  /* Saturation is held at the brand step's own value, floored so the dark end
     does not go muddy and ceilinged so the light end stays printable. */
  const sat = Math.min(0.78, Math.max(0.42, s));
  const rgb = solveForGrey(h, sat, GREY_TARGETS[i]);
  return { name, hue: h, hex: rgbToHex(rgb), rgb };
});

const PAPER = hexToRgb("#f7f4ee");

console.log("/* sequential: derived from the brand hues, monotonic by construction */");
let prev = -Infinity, monotonic = true, minGap = Infinity;
for (const [i, step] of sequential.entries()) {
  const g = grey8(step.rgb);
  if (i > 0) { minGap = Math.min(minGap, g - prev); if (g <= prev) monotonic = false; }
  console.log(
    `  --seq-${i + 1}: ${step.hex};`.padEnd(24),
    `/* was ${step.name} ${BRAND[step.name]} · hue ${step.hue.toFixed(0)}° · grey8 ${g.toFixed(0)} · ${contrast(step.rgb, PAPER).toFixed(2)}:1 on paper */`
  );
  prev = g;
}
console.log(`\nmonotonic: ${monotonic}   min adjacent grey8 gap: ${minGap.toFixed(1)}`);

console.log("\n/* diverging: ColorBrewer RdBu 9-class, verbatim; zero pins to --div-5 */");
RDBU_9.forEach((hex, i) => {
  const rgb = hexToRgb(hex);
  console.log(
    `  --div-${i + 1}: ${hex};`.padEnd(24),
    `/* grey8 ${grey8(rgb).toFixed(0)} · ${contrast(rgb, PAPER).toFixed(2)}:1 on paper${i === 4 ? " · ZERO" : ""} */`
  );
});

/* The diverging ramp is deliberately NOT monotonic end to end -- it is
   monotonic outward from the midpoint, one arm at a time. Report both arms so
   the property that is claimed is the property that is checked. */
const armGaps = (arm) => arm.map((h) => grey8(hexToRgb(h)));
const left = armGaps(RDBU_9.slice(0, 5)).reverse();  // midpoint outward to blue
const right = armGaps(RDBU_9.slice(4));              // midpoint outward to red
const descending = (a) => a.every((v, i) => i === 0 || v < a[i - 1]);
console.log(`\nleft arm monotonic from zero:  ${descending(left)}  [${left.map((v) => v.toFixed(0)).join(" > ")}]`);
console.log(`right arm monotonic from zero: ${descending(right)}  [${right.map((v) => v.toFixed(0)).join(" > ")}]`);
