/**
 * The gate for tabular-lining numerals.
 *
 *   Tabular-lining numerals everywhere a number can change.
 *
 * Run: npm run check:numerals   (exit 1 on any violation)
 *
 * The rule is the first item in the common design layer, and it holds in every
 * direction the board can still choose, so it is worth a gate rather than a
 * convention. Proportional figures mean a column of readings does not line up
 * and a value that updates shifts the glyphs around it -- on a surface whose
 * argument is "check this figure", a number that appears to move is a defect.
 *
 * What it asserts
 * ---------------
 *  1. THE ROOT DECLARATION EXISTS. One declaration, on html/body, so that a
 *     number arriving tomorrow in a component nobody thought to tag is tabular
 *     by default. The previous arrangement was three components that each
 *     remembered, which is three places to forget.
 *
 *  2. FORM CONTROLS ARE COVERED. The UA stylesheet applies the `font` shorthand
 *     to inputs, buttons and selects, and that shorthand resets
 *     font-variant-numeric -- so without an explicit rule, a quantity typed
 *     into a field is the one place on the site with proportional figures.
 *
 *  3. NOBODY USES font-feature-settings. It is the low-level property: it
 *     overrides font-variant-numeric and takes an opaque tag list, so a
 *     component reaching for one unrelated OpenType feature silently drops
 *     tabular figures and nothing says so. Two of these existed before this
 *     gate -- one in the placeholder register's own numeral slot, which is the
 *     single place the property could do the most damage.
 *
 *  4. NOTHING OPTS OUT SILENTLY. proportional-nums and oldstyle-nums are
 *     forbidden. If a surface ever needs them, it needs a reviewed exception
 *     and a reason in this file, not a line of CSS in a component.
 *
 * What it does not catch: a figure rendered in an iframe, a canvas, or an SVG
 * <text> with its own font stack, and the email templates -- which are a
 * separate surface with a separate renderer, and where most clients ignore
 * font-variant-numeric entirely.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const GLOBALS = join(SRC, "styles", "globals.css");

/** Emails render in somebody else's engine. Excluded, and said out loud rather
 *  than silently skipped. */
const EXEMPT = [join("src", "emails")];

const DECLARATION = /font-variant-numeric\s*:\s*tabular-nums\s+lining-nums/;

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];
const css = readFileSync(GLOBALS, "utf8");

/* 1 · the root declaration. Read the html/body block specifically: a
   declaration on some other selector is not a site-wide default. */
const rootBlock = css.match(/html,\s*body\s*\{([\s\S]*?)\n\}/);
if (!rootBlock || !DECLARATION.test(rootBlock[1])) {
  violations.push({
    at: "src/styles/globals.css",
    msg: "the html, body rule does not declare `font-variant-numeric: tabular-nums lining-nums`. Tabular figures have to be the site's default, or the next number to arrive is proportional and nobody notices.",
  });
}

/* 2 · form controls, which do not inherit it. */
const controlBlock = css.match(/input,\s*button,\s*select,\s*textarea[^{]*\{([\s\S]*?)\n\}/);
if (!controlBlock || !/font-variant-numeric\s*:/.test(controlBlock[1])) {
  violations.push({
    at: "src/styles/globals.css",
    msg: "no rule gives input, button, select and textarea their numerals back. The UA `font` shorthand resets font-variant-numeric, so a quantity in a field would be the one proportional number on the site.",
  });
}

/* 3 and 4 · nobody overrides it, and nobody opts out quietly. */
for (const file of files(SRC)) {
  const rel = relative(ROOT, file);
  if (EXEMPT.some((e) => rel.startsWith(e))) continue;
  /* A comment explaining why a property is banned is not a use of it, and
     these comments run to several lines -- so blank the comment bodies while
     keeping the line count, rather than stripping per line. */
  const text = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
  const lines = text.split(/\r?\n/);
  lines.forEach((code, i) => {
    if (/font-?[Ff]eature-?[Ss]ettings\s*[:=]/.test(code)) {
      violations.push({
        at: `${rel.split(sep).join("/")}:${i + 1}`,
        msg: "uses font-feature-settings. It overrides font-variant-numeric with an opaque tag list, so it drops tabular figures without saying so. Use font-variant-numeric.",
      });
    }
    if (/proportional-nums|oldstyle-nums/.test(code)) {
      violations.push({
        at: `${rel.split(sep).join("/")}:${i + 1}`,
        msg: "opts out of tabular-lining figures. If a surface genuinely needs proportional or old-style numerals, that is a reviewed exception with a reason in scripts/check-numerals.mjs.",
      });
    }
  });
}

if (!violations.length) {
  console.log("check:numerals  ok  ·  tabular-lining declared at the root, form controls covered, no overrides");
  process.exit(0);
}

console.error(`check:numerals  FAILED  ·  ${violations.length} problem(s)\n`);
console.error("Tabular-lining numerals everywhere a number can change.\n");
for (const v of violations) {
  console.error(`  ${v.at}`);
  console.error(`    ${v.msg}`);
}
console.error("\nSee docs/design/type-scale.md");
process.exit(1);
