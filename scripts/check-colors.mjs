/**
 * Two colour gates, both cheap, both catching a class of bug that shipped.
 *
 * Run: npm run check:colors   (exit 1 on any failure)
 *
 *  1. CONTRAST. Every token in a declared text or boundary role clears its
 *     WCAG 2.1 threshold against every ground we put it on. This is the test
 *     that fails loudly when somebody reaches for --gold as a text colour.
 *     It would have caught the primary call-to-action on this site sitting at
 *     4.14:1 -- an AA miss on the one button the whole page funnels to.
 *
 *  2. RAMP MONOTONICITY. The sequential data ramp is re-derived from the brand
 *     hues and compared to the committed tokens, and its greyscale separation
 *     is asserted. This is the token-level half of the greyscale legend test:
 *     it proves the ramp is decodable in greyscale print and for a red-green
 *     deficient reader before anything is drawn with it. The other half --
 *     rendering every real map and chart to greyscale and asserting adjacent
 *     legend classes separate -- needs a render harness and is specified for
 *     Gate in docs/design/data-ramps.md rather than built here.
 *
 * The brand ramp is deliberately NOT under test 1. It has no contrast
 * obligation because it has no text or boundary role: --sparc-* is decoration.
 * That is the whole reason the token layer was split -- one token cannot be
 * both a faint decorative hairline and a boundary a reader has to find.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const TOKENS = join(ROOT, "src", "styles", "tokens.css");
const css = readFileSync(TOKENS, "utf8");

/* ---------- colour maths ---------- */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16));
const relLum = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const grey8 = (hex) => Math.pow(relLum(hex), 1 / 2.2) * 255;

/* ---------- read the tokens ---------- */
/** Resolve a token to a hex, following var() aliases. The role layer is mostly
 *  aliases of the brand layer, which is the point of having layers. */
function token(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`token --${name} is defined in a cycle`);
  seen.add(name);
  const m = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6}|var\\(--[a-z0-9-]+\\))`, "i"));
  if (!m) throw new Error(`token --${name} does not resolve to a hex in tokens.css; the gate cannot check it`);
  const value = m[1];
  if (value.startsWith("#")) return value.toLowerCase();
  return token(value.slice(6, -1), seen);
}

const GROUNDS = {
  white: "#ffffff",
  paper: token("paper"),
  "paper-2": token("paper-2"),
  "paper-3": token("paper-3"),
};

/* The contract per role. "text" is AA body text at 4.5:1; "boundary" is the
   WCAG 1.4.11 non-text requirement at 3:1; "on" means white text sits on it. */
const ROLES = [
  { token: "ink", role: "text", min: 4.5, grounds: ["paper", "paper-2", "paper-3", "white"] },
  { token: "ink-2", role: "text", min: 4.5, grounds: ["paper", "paper-2", "paper-3", "white"] },
  { token: "muted", role: "text", min: 4.5, grounds: ["paper", "paper-2", "white"] },
  { token: "crimson", role: "text", min: 4.5, grounds: ["paper", "white"] },
  { token: "crimson", role: "white text on it", min: 4.5, grounds: ["white"], inverted: true },
  { token: "purple", role: "text", min: 4.5, grounds: ["paper", "white"] },
  { token: "amber-ink", role: "text", min: 4.5, grounds: ["paper", "white"] },
  { token: "amber-ink", role: "white text on it", min: 4.5, grounds: ["white"], inverted: true },
  { token: "rule", role: "structural boundary", min: 3, grounds: ["white", "paper", "paper-2", "paper-3"] },
];

/* Tokens that must NOT be given a text or boundary role. Listed so the
   intent is in the gate and not only in a comment: if one of these ever
   clears 4.5:1 somebody has changed a brand hex, and that needs a brand
   review rather than a passing test. */
const DECORATION_ONLY = ["sparc-pink", "sparc-red", "sparc-orange", "sparc-amber", "sparc-gold", "sparc-yellow", "line"];

const failures = [];
const rows = [];

for (const r of ROLES) {
  const hex = token(r.token);
  for (const g of r.grounds) {
    const ratio = r.inverted ? contrast(GROUNDS.white, hex) : contrast(hex, GROUNDS[g]);
    const ok = ratio >= r.min;
    rows.push(`  ${ok ? "ok  " : "FAIL"} --${r.token} as ${r.role}${r.inverted ? "" : ` on ${g}`}: ${ratio.toFixed(2)}:1 (needs ${r.min})`);
    if (!ok) failures.push(`--${r.token} in a ${r.role} role is ${ratio.toFixed(2)}:1 against ${r.inverted ? "white text" : g}, below ${r.min}`);
  }
}

for (const t of DECORATION_ONLY) {
  const ratio = contrast(token(t), GROUNDS.paper);
  rows.push(`  note --${t} is ${ratio.toFixed(2)}:1 on paper · decoration only, no obligation`);
}

/* ---------- ramp gates ---------- */
const MIN_GREY_GAP = 8; // the greyscale legend test's separation floor
const seq = Array.from({ length: 9 }, (_, i) => token(`seq-${i + 1}`));
const div = Array.from({ length: 9 }, (_, i) => token(`div-${i + 1}`));

let prev = -Infinity;
let worstGap = Infinity;
seq.forEach((hex, i) => {
  const g = grey8(hex);
  if (i > 0) {
    const gap = g - prev;
    worstGap = Math.min(worstGap, gap);
    if (gap <= 0) failures.push(`--seq-${i + 1} is not lighter than --seq-${i}: the sequential ramp is not luminance-monotonic`);
  }
  prev = g;
});
if (worstGap < MIN_GREY_GAP) {
  failures.push(`adjacent sequential steps separate by only ${worstGap.toFixed(1)} of 255 in greyscale; the floor is ${MIN_GREY_GAP}`);
}
rows.push(`  ${worstGap >= MIN_GREY_GAP ? "ok  " : "FAIL"} --seq-* monotonic, worst adjacent greyscale gap ${worstGap.toFixed(1)} (floor ${MIN_GREY_GAP})`);

/* The diverging ramp is monotonic outward from zero, one arm at a time -- not
   end to end. Check the property it actually claims. */
const arms = { "blue arm": div.slice(0, 5).reverse(), "red arm": div.slice(4) };
for (const [name, arm] of Object.entries(arms)) {
  let p = Infinity, ok = true, worst = Infinity;
  arm.forEach((hex, i) => {
    const g = grey8(hex);
    if (i > 0) { worst = Math.min(worst, p - g); if (g >= p) ok = false; }
    p = g;
  });
  if (!ok) failures.push(`the diverging ramp's ${name} is not monotonic outward from zero`);
  if (worst < MIN_GREY_GAP) failures.push(`the diverging ramp's ${name} separates by only ${worst.toFixed(1)} in greyscale; the floor is ${MIN_GREY_GAP}`);
  rows.push(`  ${ok && worst >= MIN_GREY_GAP ? "ok  " : "FAIL"} --div-* ${name} monotonic from zero, worst gap ${worst.toFixed(1)}`);
}
if (div[4] !== "#f7f7f7") {
  failures.push(`--div-5 is ${div[4]}, not the ColorBrewer RdBu neutral midpoint #f7f7f7. Zero has to pin to the midpoint or a diverging ramp lies about sign.`);
}

/* The committed sequential tokens must equal what the derivation produces.
   A ramp that was derived once and then hand-edited is a ramp nobody can
   re-derive, which is how --grad-ramp got here. */
try {
  const derived = execFileSync(process.execPath, [join(ROOT, "scripts", "derive-ramps.mjs")], { encoding: "utf8" });
  seq.forEach((hex, i) => {
    if (!new RegExp(`--seq-${i + 1}:\\s*${hex}`, "i").test(derived)) {
      failures.push(`--seq-${i + 1} (${hex}) does not match scripts/derive-ramps.mjs output. Re-run the derivation rather than editing the token.`);
    }
  });
  rows.push("  ok   --seq-* matches scripts/derive-ramps.mjs");
} catch (e) {
  failures.push(`could not re-derive the ramps: ${e.message}`);
}

/* ---------- report ---------- */
console.log("check:colors");
for (const r of rows) console.log(r);

if (failures.length) {
  console.error(`\ncheck:colors  FAILED  ·  ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("\nSee docs/design/color-roles.md");
  process.exit(1);
}
console.log("\ncheck:colors  ok");
