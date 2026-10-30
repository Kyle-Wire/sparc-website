/**
 * The second half of the placeholder gate: the rendered one.
 *
 * Run: npm run build && npm run check:placeholders:rendered
 *
 * scripts/check-placeholders.mjs reads the source and is fast enough to run on
 * every commit, but it has one honest hole: a digit reached indirectly -- a
 * module-scope constant referenced inside the subtree by identifier -- is
 * invisible to it. This closes that hole by checking the property we actually
 * care about instead of a proxy for it: take the HTML Next.js prerendered,
 * find every [data-placeholder] subtree, strip the tags so that style and
 * geometry attributes disappear, and assert that the remaining text contains
 * no digit.
 *
 * That is the acceptance test stated as code: a placeholder panel shows
 * layout, it never shows digits, and this reads what a visitor reads.
 *
 * Limits, stated: it sees the first render only, so a numeral that appears
 * only after a click or an effect is not covered. Placeholder panels have no
 * business computing one, and the source gate catches the formatting calls
 * that would produce one.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const BUILD = join(ROOT, ".next", "server", "app");

if (!safeStat(BUILD)) {
  console.error("check:placeholders:rendered  skipped  ·  no build found at .next/server/app");
  console.error("Run `npm run build` first. In CI, order this step after the build.");
  process.exit(1);
}

function safeStat(p) {
  try { return statSync(p); } catch { return null; }
}

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = safeStat(p);
    if (!s) continue;
    if (s.isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

/** Find the balanced subtree of each element carrying data-placeholder.
 *  A small tag walker rather than a DOM: no dependency, and placeholder
 *  panels are plain divs. */
function placeholderSubtrees(html) {
  const found = [];
  const openTag = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = openTag.exec(html))) {
    const [full, tag, attrs] = m;
    if (!/\bdata-placeholder\b/.test(attrs)) continue;
    if (full.endsWith("/>")) { found.push({ start: m.index, end: openTag.lastIndex }); continue; }

    // Walk forward counting same-tag open/close pairs.
    let depth = 1;
    const walker = new RegExp(`</?${tag}\\b((?:"[^"]*"|'[^']*'|[^>"'])*)>`, "g");
    walker.lastIndex = openTag.lastIndex;
    let w;
    while ((w = walker.exec(html))) {
      if (w[0].startsWith("</")) depth--;
      else if (!w[0].endsWith("/>")) depth++;
      if (depth === 0) break;
    }
    found.push({ start: m.index, end: w ? walker.lastIndex : html.length });
  }
  return found;
}

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ", "&#x27;": "'" };

function visibleText(fragment) {
  return fragment
    // Script and style bodies are not read by a visitor.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    // Stripping tags takes every attribute with them: style, viewBox, d, cx.
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

const failures = [];
let panels = 0;
const pages = htmlFiles(BUILD);

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  for (const { start, end } of placeholderSubtrees(html)) {
    panels++;
    const text = visibleText(html.slice(start, end));
    const digits = text.match(/\S*[0-9]\S*/g);
    if (digits) {
      failures.push({
        page: relative(ROOT, file).split(sep).join("/"),
        tokens: [...new Set(digits)].slice(0, 8),
        context: text.slice(0, 160),
      });
    }
    if (!/\bPLACEHOLDER\b/.test(text)) {
      failures.push({
        page: relative(ROOT, file).split(sep).join("/"),
        tokens: ["(no PLACEHOLDER flag in the rendered header)"],
        context: text.slice(0, 160),
      });
    }
  }
}

if (!panels) {
  console.error("check:placeholders:rendered  FAILED  ·  found no [data-placeholder] subtree in any prerendered page.");
  console.error("Either the register is not rendering or the build is stale. A gate that finds nothing is not a passing gate.");
  process.exit(1);
}

if (!failures.length) {
  console.log(`check:placeholders:rendered  ok  ·  ${panels} rendered panels across ${pages.length} pages, no digits in any of them`);
  process.exit(0);
}

console.error(`check:placeholders:rendered  FAILED  ·  ${failures.length} panel(s) render a digit\n`);
console.error("A placeholder panel shows layout. It never shows digits. This is what a visitor sees.\n");
for (const f of failures) {
  console.error(`  ${f.page}`);
  console.error(`    digits: ${f.tokens.join("  ")}`);
  console.error(`    in: ${f.context}`);
}
console.error("\nSee docs/design/placeholder-register.md");
process.exit(1);
