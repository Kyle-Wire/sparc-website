/**
 * The gate for the placeholder register.
 *
 *   A placeholder panel shows layout. It never shows digits.
 *
 * Run: npm run check:placeholders   (exit 1 on any violation)
 *
 * Why this file exists rather than a comment: src/app/product/stage-parts.tsx
 * carried an accurate source comment saying its figures were invented, two
 * lines above a panel that rendered a dollar amount and a tract count to the
 * public. It was there for months. The comment was never wrong and it never
 * stopped anything, because a comment has no failure mode. This has one.
 *
 * What it asserts
 * ---------------
 *  1. The data-placeholder attribute is written in exactly one file, the
 *     primitive. If it can be hand-rolled, the visual register and this gate
 *     drift apart and the gate becomes decorative.
 *  2. No numeral renders anywhere inside a <Placeholder> subtree: not in text,
 *     not in a text-bearing prop, not produced at runtime by toFixed, Math.*
 *     or padStart. Geometry attributes (viewBox, d, cx, width, style values)
 *     are exempt -- an SVG coordinate is layout, and forbidding it would mean
 *     a placeholder could not draw an axis.
 *  3. Every <Placeholder> supplies a note. The hatch is a convention a
 *     first-time reader has not learned; a sentence is not.
 *
 * What it does not catch, stated plainly so nobody trusts it further than it
 * goes: a figure reached indirectly, e.g. a digit living in a module-scope
 * constant that is referenced inside the subtree by identifier. Closing that
 * needs type-directed analysis and would buy little -- the realistic
 * regression is somebody typing a number into a panel, which is caught. The
 * remaining mitigation is that <Placeholder> is the only way to get the
 * register, so a reviewer always has one place to look.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const PRIMITIVE = join("src", "components", "system", "placeholder.tsx");

/** The component that owns the register. Keyed off the JSX name, because the
 *  attribute itself lives inside the primitive and never in a page. */
const REGISTER_COMPONENT = "Placeholder";

/** Props whose values are read out to a human and therefore owe the rule.
 *  Keep this in step with the primitive and its helpers; a new text-bearing
 *  prop that is not listed here is a hole. */
const TEXT_PROPS = new Set([
  "label", "note", "title", "alt", "placeholder", "caption", "meta",
  "value", "sub", "text", "heading", "keys", "rows", "chips", "items",
  "labels", "options", "aria-label", "ariaLabel", "aria-description",
  // The measurement unit's four slots and its subject. A unit nested inside a
  // placeholder is the intended composition -- four nulls, four em dashes --
  // so these have to owe the rule, or the register would have a hole shaped
  // exactly like the thing it exists to stop.
  "of", "interval", "spread", "verdict", "support",
]);

/** Runtime numeral factories. A placeholder has no reason to format a number. */
const NUMERAL_CALLS = new Set(["toFixed", "toLocaleString", "toPrecision", "padStart", "toString"]);

const DIGIT = /[0-9]/;

function tsxFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsxFiles(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const violations = [];
const files = tsxFiles(SRC);
let panelCount = 0;

function where(sf, node) {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return `${relative(ROOT, sf.fileName).split(sep).join("/")}:${line + 1}:${character + 1}`;
}

/* ---- Walk every file: the marker check and the register subtrees ---- */
for (const file of files) {
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

  /** Walk a register subtree. `inTextPos` tracks whether the literal we reach
   *  is something a reader will see. */
  function scan(node, root) {
    // Attribute values: only text-bearing props are read out.
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (!TEXT_PROPS.has(name)) {
        // Geometry, style, className, key, role, href: layout, exempt. Do not
        // descend -- style={{ fontSize: 9 }} is not a rendered numeral.
        return;
      }
      const init = node.initializer;
      if (init) {
        const value = ts.isJsxExpression(init) ? init.expression : init;
        if (value) checkText(value, root, `prop "${name}"`);
      }
      return;
    }

    if (ts.isJsxText(node)) {
      if (DIGIT.test(node.text)) {
        report(node, root, `rendered text "${node.text.trim().slice(0, 60)}"`);
      }
      return;
    }

    if (ts.isJsxExpression(node)) {
      if (node.expression) checkText(node.expression, root, "rendered expression");
      return; // checkText hands any nested JSX back to scan
    }

    node.forEachChild((c) => scan(c, root));
  }

  const isJsxNode = (n) =>
    ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n);

  /** Anything in a read-out position: literals must be digit-free and nothing
   *  may manufacture a numeral at runtime.
   *
   *  `top` distinguishes {42} -- a rendered number -- from .slice(0, 3), whose
   *  arguments are layout arithmetic and not read out. Nested JSX is handed
   *  back to scan() so that a style object inside a .map() callback keeps its
   *  exemption; otherwise every `fontSize: 9` in a placeholder would fail the
   *  build, the gate would be unusable, and somebody would delete it. */
  function checkText(node, root, label, top = true) {
    if (isJsxNode(node)) {
      scan(node, root);
      return;
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && DIGIT.test(node.text)) {
      report(node, root, `${label}: "${node.text.slice(0, 60)}"`);
    }
    if (ts.isNumericLiteral(node) && top) {
      report(node, root, `${label}: the literal ${node.text} renders as a digit`);
    }
    if (ts.isTemplateExpression(node)) {
      const literals = [node.head, ...node.templateSpans.map((s) => s.literal)];
      if (literals.some((l) => DIGIT.test(l.text))) {
        report(node, root, `${label}: template literal contains a digit`);
      }
    }
    if (ts.isPropertyAccessExpression(node)) {
      const prop = node.name.getText(sf);
      if (NUMERAL_CALLS.has(prop)) report(node, root, `${label}: ${prop}() formats a number for display`);
      if (node.expression.getText(sf) === "Math") report(node, root, `${label}: Math.${prop} computes a number`);
    }
    node.forEachChild((c) => checkText(c, root, label, false));
  }

  function report(node, root, msg) {
    violations.push({ at: where(sf, node), msg, panel: root });
  }

  const isPrimitive = relative(ROOT, file) === PRIMITIVE;

  const visit = (node) => {
    /* Assertion 1: only the primitive writes the marker. Checked on the AST
       rather than by searching the text, so that a comment explaining the
       marker is not itself a violation. */
    if (
      !isPrimitive &&
      ts.isJsxAttribute(node) &&
      node.name.getText(sf) === "data-placeholder"
    ) {
      violations.push({
        at: where(sf, node),
        msg: `writes data-placeholder directly. Use <${REGISTER_COMPONENT}> from ${PRIMITIVE.split(sep).join("/")} -- the marker and the visual register have to arrive together, or the hatch and the gate drift apart.`,
      });
    }

    const name = openingName(node);
    if (name === REGISTER_COMPONENT) {
      panelCount++;
      const attrs = attrsOf(node);
      const label = attrs?.properties.find(
        (p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "label"
      );
      const labelText =
        label && ts.isJsxAttribute(label) && label.initializer && ts.isStringLiteral(label.initializer)
          ? label.initializer.text
          : "(unlabelled)";

      const note = attrs?.properties.find(
        (p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "note"
      );
      if (!note) {
        violations.push({
          at: where(sf, node),
          panel: labelText,
          msg: "no note. A placeholder has to say in words what it is -- the hatch is a convention, a sentence is not.",
        });
      }

      node.forEachChild((c) => scan(c, labelText));
      return; // subtree handled
    }
    node.forEachChild(visit);
  };
  visit(sf);
}

/* ---- Report ---- */
if (violations.length === 0) {
  console.log(`check:placeholders  ok  ·  ${panelCount} panels in the register, no numerals, every one noted`);
  process.exit(0);
}

console.error(`check:placeholders  FAILED  ·  ${violations.length} violation(s) across ${panelCount} panel(s)\n`);
console.error("A placeholder panel shows layout. It never shows digits.");
console.error("If the figure is real it does not belong in a placeholder: it belongs in a panel");
console.error("whose numbers trace to sparc-resilience/docs/results/reconciliation.md.\n");
for (const v of violations) {
  console.error(`  ${v.at}`);
  console.error(`    ${v.panel ? `[${v.panel}] ` : ""}${v.msg}`);
}
console.error("\nSee docs/design/placeholder-register.md");
process.exit(1);
