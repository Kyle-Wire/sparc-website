/**
 * The gate for the measurement unit.
 *
 *   Four slots, never fewer. A slot with no value renders an em dash.
 *
 * Run: npm run check:measurements   (exit 1 on any violation)
 *
 * TypeScript already makes an omitted slot a compile error, and that is the
 * first line of defence. This file exists for the three things the type system
 * cannot say:
 *
 *  1. A SPREAD DEFEATS THE TYPES AT REVIEW TIME, NOT AT BUILD TIME.
 *     <Measurement {...row} /> typechecks and tells a reviewer nothing about
 *     whether four slots are present at the call site. The slots have to be
 *     visible in the markup, because "which of these four did we not have" is
 *     the question a reader of this code is always asking.
 *
 *  2. THE VERDICT MUST BE WORDS.
 *     Slot 3 is the slot nobody else does and the only one that survives
 *     greyscale, a screen reader and a photocopy. A verdict of "✓" or "—" or a
 *     bare ratio puts the reading back into a channel that does not survive any
 *     of those, so a verdict literal has to contain letters.
 *
 *  3. THE BOUNDARY RULE, MECHANISED.
 *       Personality may touch anything that is not a measurement. The moment a
 *       number appears, the measurement unit governs and the personality stops
 *       at the panel border.
 *     The human form of this is the crop test: crop any panel containing a
 *     number, and the crop must contain no display face, no stepped shadow and
 *     no brand hue carrying meaning. The mechanical half is cheaper and still
 *     worth having -- no rule that styles the unit may set a shadow or reach
 *     for the brand ramp, and the primitive may not grow a prop that colours a
 *     reading. An API that can colour a verdict is the API through which the
 *     brand ramp becomes a severity scale, which is the measured failure in
 *     docs/design/data-ramps.md.
 *
 * What it does not catch, so nobody trusts it further than it goes: a brand hue
 * reaching the unit through a token alias defined elsewhere, or a shadow
 * applied by a parent. The crop test is still the acceptance test; this is the
 * part of it that can fail a build.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const PRIMITIVE = join("src", "components", "system", "measurement.tsx");
const STYLES = join(ROOT, "src", "styles", "globals.css");

const REGISTER_COMPONENT = "Measurement";

/** The four slots, plus the subject. Every one of them required at every call
 *  site: `of` because a number with no subject is not a reading, and the other
 *  four because that is the rule. */
const REQUIRED_PROPS = ["of", "value", "interval", "verdict", "support"];

/** Props this component must never grow. Each one is a way to put the reading
 *  back into colour, which is slot 3's job and colour's redundant channel. */
const FORBIDDEN_PROPS = /^(tone|severity|status|accent|colour|color|variant|level|band|fill)$/i;

/** Brand furniture. Legal on a page opener, illegal inside a reading. */
const BRAND = /--(sparc-[a-z]+|grad-ramp|pink|red|orange|amber|gold|yellow|magenta|purple)\b/;

function tsxFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsxFiles(p));
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const violations = [];
let unitCount = 0;

function where(sf, node) {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return `${relative(ROOT, sf.fileName).split(sep).join("/")}:${line + 1}:${character + 1}`;
}

for (const file of tsxFiles(SRC)) {
  const rel = relative(ROOT, file);
  const isPrimitive = rel === PRIMITIVE;
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

  const openingName = (n) =>
    ts.isJsxElement(n) ? n.openingElement.tagName.getText(sf)
    : ts.isJsxSelfClosingElement(n) ? n.tagName.getText(sf)
    : null;

  const attrsOf = (n) =>
    ts.isJsxElement(n) ? n.openingElement.attributes
    : ts.isJsxSelfClosingElement(n) ? n.attributes
    : null;

  const visit = (node) => {
    /* Only the primitive writes the marker, for the same reason only
       placeholder.tsx writes data-placeholder: if the attribute can be
       hand-rolled then the visual register and this gate drift apart, and a
       gate that can be bypassed by copying a div is decorative. */
    if (!isPrimitive && ts.isJsxAttribute(node) && node.name.getText(sf) === "data-measurement") {
      violations.push({
        at: where(sf, node),
        msg: `writes data-measurement directly. Use <${REGISTER_COMPONENT}> from ${PRIMITIVE.split(sep).join("/")} -- the four slots and the marker have to arrive together.`,
      });
    }

    const name = openingName(node);
    if (name === REGISTER_COMPONENT) {
      unitCount++;
      const attrs = attrsOf(node);
      const props = attrs?.properties ?? [];
      const named = new Map();

      for (const p of props) {
        if (ts.isJsxSpreadAttribute(p)) {
          violations.push({
            at: where(sf, p),
            msg: "spreads its props. The four slots have to be visible in the markup: a spread typechecks and still leaves a reviewer unable to see which slot we did not have.",
          });
          continue;
        }
        if (!ts.isJsxAttribute(p)) continue;
        const pname = p.name.getText(sf);
        named.set(pname, p);
        if (FORBIDDEN_PROPS.test(pname)) {
          violations.push({
            at: where(sf, p),
            msg: `passes "${pname}". A measurement unit has no colour axis: slot 3 carries the reading in words and colour is only ever redundant to it.`,
          });
        }
      }

      for (const req of REQUIRED_PROPS) {
        if (!named.has(req)) {
          violations.push({
            at: where(sf, node),
            msg: `omits "${req}". Four slots, never fewer -- pass null to state that we do not have it, which renders an em dash.`,
          });
        }
      }

      /* Slot 3 has to be words. Only checkable where it is a literal; a
         computed verdict is the record's own vocabulary and not ours. */
      const verdict = named.get("verdict");
      if (verdict && ts.isJsxAttribute(verdict) && verdict.initializer) {
        const init = ts.isJsxExpression(verdict.initializer)
          ? verdict.initializer.expression
          : verdict.initializer;
        if (init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) {
          if (!/[A-Za-z]{3}/.test(init.text)) {
            violations.push({
              at: where(sf, verdict),
              msg: `verdict "${init.text}" is not a phrase. Slot 3 is the reading in words -- a glyph or a bare figure does not survive greyscale, a screen reader or a photocopy.`,
            });
          }
        }
      }
    }
    node.forEachChild(visit);
  };
  visit(sf);

  /* The primitive itself: no brand hue, no elevation. The boundary rule says
     the personality stops at the panel border, and this is inside it. */
  if (isPrimitive) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    if (BRAND.test(code)) {
      violations.push({
        at: rel.split(sep).join("/"),
        msg: `references a brand token (${code.match(BRAND)[0]}). The measurement unit is plain: brand colour never encodes data.`,
      });
    }
    if (/box-?[Ss]hadow|text-?[Ss]hadow/.test(code)) {
      violations.push({
        at: rel.split(sep).join("/"),
        msg: "sets a shadow. Stepped elevation is Register C's and it stops at the panel border.",
      });
    }
    for (const m of code.matchAll(/\b(tone|severity|status|accent|colour|color|variant)\s*[?]?\s*:/g)) {
      const { line } = sf.getLineAndCharacterOfPosition(m.index);
      violations.push({
        at: `${rel.split(sep).join("/")}:${line + 1}`,
        msg: `declares a "${m[1]}" prop. There is no colour axis on a reading, and an API that can express one is an API somebody will use.`,
      });
    }
  }
}

/* ---- The stylesheet half of the boundary rule ---- */
const css = readFileSync(STYLES, "utf8");
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
for (const [, selector, body] of blocks) {
  if (!/\.mu\b|\[data-measurement\]/.test(selector)) continue;
  const sel = selector.trim().split("\n").pop().trim();
  if (/box-shadow|text-shadow|filter\s*:/.test(body)) {
    violations.push({
      at: `src/styles/globals.css (${sel})`,
      msg: "gives a measurement unit an elevation. A measurement panel is plain and its punch comes from its structure, not its styling.",
    });
  }
  if (BRAND.test(body)) {
    violations.push({
      at: `src/styles/globals.css (${sel})`,
      msg: `styles a measurement unit with ${body.match(BRAND)[0]}. Brand colour never encodes data.`,
    });
  }
}

/* A gate that finds nothing has not passed. */
if (!unitCount) {
  console.error("check:measurements  FAILED  ·  no <Measurement> call site anywhere in src/.");
  console.error("Either the primitive is unused or it has been renamed. Keep the gate pointed at something.");
  process.exit(1);
}

if (!violations.length) {
  console.log(`check:measurements  ok  ·  ${unitCount} units, four slots each, no colour axis, no elevation`);
  process.exit(0);
}

console.error(`check:measurements  FAILED  ·  ${violations.length} violation(s) across ${unitCount} unit(s)\n`);
console.error("Four slots, never fewer. A slot with no value renders an em dash -- never blank,");
console.error("never zero, never omitted. The verdict is a sentence, not a colour and not an icon.\n");
for (const v of violations) {
  console.error(`  ${v.at}`);
  console.error(`    ${v.msg}`);
}
console.error("\nSee docs/design/measurement-unit.md");
process.exit(1);
