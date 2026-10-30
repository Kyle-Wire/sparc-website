# The type scale

Internal design specification. Owner: Head of Design. The numeral rule in §4 is
enforced by `npm run check:numerals`.

---

## 1. The problem it had

`src/styles/tokens.css` documented a full type scale — `--fs-hero`,
`--fs-page-hero`, `--fs-h1`, `--fs-h2`, `--fs-h2-section`, `--fs-h3`,
`--fs-display`. **On desktop, none of it was used.**

`globals.css` set `h1/h2/h3` to the literals `48px / 28px / 22px`, which
*happened* to equal the token values. `.page-hero h1` was the literal `56px`,
and `40px` at the tablet breakpoint, where no token existed at all. The tokens
only took effect inside the `max-width: 640px` block.

So the scale was a comment that agreed with the code by coincidence. Any future
change drifts, silently, and with no utility layer in this codebase every
bypass is a one-line inline style — which is exactly how the colour misuse got
in too.

## 2. What it is now

One set of names, read at every breakpoint, cascading desktop → tablet →
mobile. **`globals.css` declares no literal `font-size` for a scale step at any
breakpoint.** Add a step by adding a token.

| token | desktop | tablet (≤900) | mobile (≤640) |
|---|---|---|---|
| `--fs-hero` | 64 | 48 | 36 |
| `--fs-page-hero` | 56 | 40 | 30 |
| `--fs-h1` | 48 | 40 | 32 |
| `--fs-h2-section` | 36 | 30 | 24 |
| `--fs-stage-title` | 32 | 24 | 22 |
| `--fs-h2` | 28 | 26 | 22 |
| `--fs-h3` | 22 | 20 | 18 |
| `--fs-display` | 40 | 34 | 30 |
| `--fs-lead` | 18 | 17 | 16 |
| `--fs-h4` | 16 | 16 | 16 |
| `--fs-body` | 13 | 13 | 13 |
| `--fs-label` | 10 | 10 | 10 |

Four tokens are new. `--fs-stage-title`, `--fs-lead` and `--fs-h4` existed only
as literals; `--fs-body` and `--fs-label` existed only as repeated magic
numbers. The **tablet block is entirely new** — the scale previously had a hole
exactly at the most common viewport, with its two values buried as literals in
unrelated rules.

## 3. `--fs-body` is the floor for an honesty label

Not a type decision, a register decision, and it is why `--fs-body` needed a
name. §4.4's failure was an honest disclaimer at 10px mono `--muted` beneath a
claim in full-strength body copy. The inversion is a rule:

> **An honesty label is never smaller than the body text of the thing it
> qualifies.** A label at caption size is a disclaimer, and we have measured
> evidence that disclaimers do not read.

`PLACEHOLDER` and the placeholder note are both set at `--fs-body`. The
maturity chips, when their vocabulary lands
([SPA-37](/SPA/issues/SPA-37)), inherit the same floor.

## 4. Tabular-lining numerals, declared once

> **Tabular-lining numerals everywhere a number can change.**

First item in the common design layer, and it holds in every direction still
open, so it is worth a gate rather than a convention.

Inter's default figures are **proportional**. That means a column of readings
does not line up, and a value that updates shifts the glyphs around it — so a
reader comparing two figures is comparing two rhythms, and a number that changes
appears to move. On a surface whose entire argument is *check this figure*, that
is a defect rather than a refinement.

**One declaration, on `html, body`.** Not on the components that happen to hold
numbers today: the failure mode is the number that arrives tomorrow in a
component nobody thought to tag. Opting a surface out is now a visible,
deliberate line of CSS instead of the default.

Three things the gate asserts beyond the root declaration:

1. **Form controls are covered explicitly.** The UA stylesheet applies the
   `font` shorthand to `input`, `button`, `select` and `textarea`, and that
   shorthand resets `font-variant-numeric` — so without a rule of its own, a
   quantity typed into a field is the one place on the site with proportional
   figures. `font-family: inherit` on `.input` does not reach it.
2. **`font-feature-settings` is forbidden.** It is the low-level property: it
   overrides `font-variant-numeric` and takes an opaque OpenType tag list, so a
   component reaching for one unrelated feature silently drops tabular figures
   and nothing reports it. Two of these existed before the gate — including one
   on `.ph-em`, the placeholder register's own numeral slot, which is the single
   place the property could have done the most damage.
3. **No silent opt-out.** `proportional-nums` and `oldstyle-nums` fail the
   build. A surface that genuinely needs them needs a reviewed exception with a
   reason in `scripts/check-numerals.mjs`.

**Not covered**, and said out loud rather than skipped silently: the email
templates, which render in somebody else's engine and where most clients ignore
`font-variant-numeric` entirely; and a figure drawn into a `canvas` or an SVG
`<text>` with its own font stack.

## 5. Still open: the ~45 inline literals

Roughly forty-five `fontSize:` literals remain in page components — ten `22`s
that are `--fs-h3`, a run of `24`s on the legal pages that is a section-head
step the scale does not name, `40` on the product closing head that is
`--fs-display`.

Converting them one by one is the wrong fix and would be a sprawling diff
across files the copy owners are actively editing. The right fix is the
correction this audit already made to the brief: **this is Next.js with plain
CSS and no utility layer**, so every token bypass is one line of inline style,
and the system will not survive the next page without a small set of real
components — card, panel header, measurement unit, legend. That is
direction-dependent work and it is not in this task.

What is in place is the guard: the scale is now real, so a component layer has
something to read from, and the next person to add a heading has a token to
reach for rather than a number to copy.
