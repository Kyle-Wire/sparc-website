/**
 * The use-site colour gate.
 *
 * Run: npm run check:color-usage   (exit 1 on any violation)
 *
 * scripts/check-colors.mjs proves that the TOKENS are sound: --rule clears 3:1
 * on every ground, --crimson clears 4.5:1 under white text, the sequential ramp
 * is monotonic. It cannot see whether a component reached for the right one,
 * and that is where every failure in §5.2 of the design audit actually lived.
 * A correct token layer with a component pointing at the wrong token is exactly
 * as inaccessible as no token layer at all.
 *
 * So this is the other half, and it asserts three things.
 *
 *  1. var(--line) APPEARS NOWHERE OUTSIDE tokens.css.
 *     --line was one token with two contracts: a faint decorative hairline and
 *     the boundary of every input, button and data panel. It could not satisfy
 *     either, and it sat at 1.61:1 where a meaning-carrying boundary needs 3:1.
 *     The previous change split it into --hairline (no obligation) and --rule
 *     (>=3:1) and left --line referenceable so the existing uses did not have to
 *     be touched. That compromise is what this closes: all 47 use sites now name
 *     the contract they want, and the ambiguous token is unreachable. A reviewer
 *     reading `var(--hairline)` knows a decision was made; `var(--line)` only
 *     ever meant nobody had decided.
 *
 *  2. A DECORATION-ONLY HUE NEVER CARRIES TEXT OR A BOUNDARY.
 *     --pink, --red, --orange, --amber, --gold, --yellow and the --sparc-*
 *     layer have no contrast obligation because they have no text or boundary
 *     role: between 1.23:1 and 3.50:1 on paper, they are stripes and glows.
 *     They were being used as a 24px bold value colour, as the accent border of
 *     a card, and as 2-3px of the left edge of a control -- which is a boundary
 *     with a hole in it. --crimson, --purple, --magenta and --amber-ink are the
 *     warm hues that clear their thresholds, and they are what a component
 *     reaches for when it needs a hue that carries something.
 *
 *  3. THE BRAND RAMP STAYS WHERE IT IS DECLARED LEGAL.
 *     `--grad-ramp` is the nine-step purple-to-yellow gradient. It is brand
 *     furniture and it is not luminance-monotonic: four consecutive steps sit
 *     inside a 19-level band out of 256, so stages 02 through 05 were one
 *     colour in greyscale print and for a reader with red-green deficiency.
 *     tokens.css lists its legal uses -- the hero wordmark fill, the 4px strip
 *     under the nav, a radial glow -- and lists the illegal ones it was doing:
 *     the stage colour on the pipeline, the progress fill on the product rail,
 *     the accent of a panel. Each of those encoded an ordered quantity on a
 *     ramp that is not ordered.
 *
 *     That list was a comment. It is now the allowlist below, so "the brand
 *     ramp cannot encode severity" is a property of the build rather than of
 *     whoever reviews the next pull request. The two legal sites are the two
 *     that exist; a third one is a decision somebody has to write down here.
 *
 * There is deliberately no exemption list for the AA rules. Four surfaces are
 * frozen until the
 * direction answer lands -- the header and nav, the section openers, the 404
 * and the empty states -- but what is frozen there is the REGISTER: the type,
 * the ground, the voice, the elevation. Which token a 1px border points at is
 * not a register decision, and a gate with a hole in it shaped like the nav is
 * a gate that will be load-bearing for the wrong thing within a month.
 *
 * What it does not catch: a hue arriving through a token alias defined outside
 * tokens.css, a colour computed at runtime, and the ground a text colour lands
 * on -- check:colors tests every token against all four grounds, so the ratios
 * are known, but which ground a given element sits on is not statically
 * decidable here.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const TOKENS = join("src", "styles", "tokens.css");

/** Tokens with no contrast obligation, because they have no text or boundary
 *  role. Kept in step with DECORATION_ONLY in scripts/check-colors.mjs, which
 *  measures them; this one polices where they are allowed to appear. */
const DECORATIVE = [
  "line", "pink", "red", "orange", "amber", "gold", "yellow",
  "sparc-pink", "sparc-red", "sparc-orange", "sparc-amber", "sparc-gold",
  "sparc-yellow", "sparc-crimson",
];

/** CSS and React properties in which a colour carries meaning: it is either
 *  read as text or it is a boundary a reader has to find. */
const CARRYING = [
  "color", "border", "border-top", "border-right", "border-bottom", "border-left",
  "border-color", "outline", "outline-color", "text-decoration-color", "caret-color",
  "borderColor", "borderTop", "borderRight", "borderBottom", "borderLeft",
  "outlineColor", "textDecorationColor", "caretColor", "stroke", "fill",
];

/**
 * Where the brand ramp is allowed to appear, and why. Decoration, both of them:
 * nothing is lost if a reader cannot resolve either, which is the test for
 * whether a brand hue is being used legally.
 *
 * Adding an entry here is the decision. Reaching for `--grad-ramp` in a
 * component without adding one is the mistake that put a non-monotonic
 * nine-step gradient on a severity scale.
 */
const RAMP_SITES = [
  {
    file: "src/components/marketing/landing-parts.tsx",
    why: "the hero wordmark fill, clipped to the headline text. Decoration, and legal.",
  },
  {
    file: "src/styles/globals.css",
    why: ".ramp-strip -- the 4px strip under the nav. Decoration, and legal.",
  },
];

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

/** Blank comment bodies while keeping the line count, so that a comment
 *  explaining a token is not itself a use of it. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}

const violations = [];
const decorativeRe = new RegExp(`var\\(\\s*--(${DECORATIVE.join("|")})\\s*\\)`);
const carryingRe = new RegExp(`(${CARRYING.join("|")})\\s*:`, "i");

for (const file of files(SRC)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (rel === TOKENS.split(sep).join("/")) continue;
  const lines = stripComments(readFileSync(file, "utf8")).split(/\r?\n/);

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;

    /* 1 · the ambiguous token */
    if (/var\(\s*--line\s*\)/.test(line)) {
      violations.push({
        at,
        msg: "uses var(--line). That token has two contracts and satisfies neither. Name the one you want: --hairline for a faint division with no contrast obligation, --rule for a boundary a reader has to find.",
      });
      return;
    }

    /* 3 · the brand ramp, only where it is declared legal */
    if (/var\(\s*--grad-ramp\s*\)/.test(line) && !RAMP_SITES.some((s) => s.file === rel)) {
      violations.push({
        at,
        msg: "reaches for --grad-ramp. It is brand furniture and it is not luminance-monotonic -- four of its nine steps sit inside a 19-level band out of 256, so it cannot encode an ordered quantity. If this use is genuinely decoration, add it to RAMP_SITES in scripts/check-color-usage.mjs with a reason. If it is encoding a quantity, --seq-* is the sequential ramp and --div-* the diverging one.",
      });
      return;
    }

    /* 2 · a decoration-only hue in a position that carries meaning */
    const hue = line.match(decorativeRe);
    if (!hue) return;
    if (!carryingRe.test(line)) return; // a background, a stripe, a gradient: fine
    violations.push({
      at,
      msg: `puts --${hue[1]} in a text or boundary position. It is decoration only -- between 1.23:1 and 3.50:1 on paper -- and a reader cannot resolve it. --crimson, --purple, --magenta and --amber-ink are the warm hues that clear their thresholds.`,
    });
  });
}

if (!violations.length) {
  console.log("check:color-usage  ok  ·  --line unreachable, no decorative hue carrying text or a boundary");
  console.log(`  --grad-ramp confined to ${RAMP_SITES.length} declared decorative site(s):`);
  for (const s of RAMP_SITES) console.log(`    ${s.file}  ·  ${s.why}`);
  process.exit(0);
}

console.error(`check:color-usage  FAILED  ·  ${violations.length} problem(s)\n`);
console.error("Brand colour never encodes data, and a boundary a reader has to find clears 3:1.\n");
for (const v of violations) {
  console.error(`  ${v.at}`);
  console.error(`    ${v.msg}`);
}
console.error("\nSee docs/design/color-roles.md");
process.exit(1);
