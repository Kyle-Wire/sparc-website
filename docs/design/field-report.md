# Register B — the field report

Internal design specification. Owner: Head of Design.

> **Register B owns every surface that asks for trust.** Program pages,
> validation records, method sections, engagement and deliverable pages,
> anything with a figure in it. Warm paper, generous measure, printed-page
> rhythm, real captions, the four-slot
> [measurement unit](measurement-unit.md) as the layout primitive.

This is the register of a methods appendix, and that is the whole argument for
it: it is the only register in which "we publish our own failure modes" reads as
rigour rather than as style. Restraint here is not timidity.

**Scope note.** This page covers the ground, the measure, the rhythm and the
captions. The header, the navigation, the section openers, the 404 and the empty
states are **not** in it and are not touched: those are the surfaces the open
direction question is actually about. Nothing here depends on how that question
resolves.

---

## 1. The reading ground — `.prose`

Five long-form surfaces — `/docs`, `/data-use`, `/privacy`, `/terms` and
`/download` — each carried an identical inline block:

```
maxWidth: 760, margin: "0 auto", display: "grid", gap: 18,
color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7
```

copied in all five. `/privacy` additionally carried `className="prose"` **with no
such rule anywhere in the stylesheet** — which is the clearest possible evidence
that the class should have existed. Somebody reached for it, nothing happened,
and the inline copy stayed.

What changed beyond the deduplication:

| | was | now | why |
|---|---|---|---|
| measure | `760px` | `--measure: 74ch` | 760px at 15px is roughly **100 characters a line**, about a third past the range where a reader reliably finds the start of the next one. In `ch` so it tracks the font size instead of contradicting it. |
| size | `15` inline ×5 | `--fs-prose: 16px` | A scale step declared as a literal in five files is exactly what [`type-scale.md`](type-scale.md) exists to stop. |
| leading | `1.7` | `1.75` | Printed-page leading at a 16px body. |
| sub-head | `fontSize: 24, fontWeight: 700, color: --ink, margin: 0` inline **×18** | `--fs-prose-head` on `.prose > h2` | The run `type-scale.md` §4 named as "a section-head step the scale does not name". It has a name now, and the markup is `<h2>` and nothing else. |
| rhythm | `gap: 18` | `--space-5` (24px) | Off the spacing scale, so paragraph separation here and section separation everywhere are the same series. |

**"Generous measure" means comfortable, not wide.** A field report is read, not
scanned, and a 100-character line is a line a reader loses their place in.

`/download`'s article was left-aligned rather than centred and is now centred
with the other four. One surface out of five is not a decision, it is a file
that was edited on a different day.

## 2. Printed-page rhythm, and the two new spacing tokens

The spacing scale ran `4/8/12/16/24/32/48/64` and stopped — **below a single
section's own padding.** So every page-level rhythm value on the site was a
literal off the scale: `section` at `80px`, `.compact` at `56px`, `.page-hero`
at `72px`, `.stage-block` at `56px`. A scale that cannot express page rhythm is
a scale the page ignores, which is what was happening.

`--space-9: 96px` and `--space-10: 128px` are added, and the section rhythm now
reads from the scale:

| | desktop | mobile |
|---|---|---|
| `section` | `--space-9` (96) | `--space-7` (48) |
| `section.compact` | `--space-7` (48) | `--space-6` (32) |
| `.stage-block` | `--space-7` (48) | `--space-6` (32) |

`.page-hero` is deliberately left at its literals: it is a **section opener**,
and section openers are held.

## 3. Real captions — `<Figure>`

> **A figure says what it is, in words, at body size.**

This is §4.4's failure written as a positive rule. The mock panel on `/product`
carried an accurate disclaimer for months and still read as a result, because
the disclaimer rendered at **10px mono `--muted`** — the weakest register in the
system, and visually identical to the decorative metadata beside it — while the
claim it qualified rendered in body copy at full strength. A reader could not
tell a disclaimer from a timestamp.

`src/components/system/figure.tsx`:

- **The caption is required.** A figure a reader has to interpret unaided is a
  figure they will interpret generously, and on this site generously means
  wrongly.
- It renders at `--fs-body`, the floor `type-scale.md` §3 fixes for any honesty
  label, in full-measure ink, under a `--rule` boundary.
- **There is no `className` or `style` prop.** That is the whole mechanism: a
  caption cannot be made smaller, lighter or greyer at a call site, which is
  exactly how the last one arrived at 10px. A different caption treatment is a
  change to the register, in one file, with a reason — not a prop.
- The caption sits **below** the figure with the subject as its first line.
  Printed-page order: the reader meets the figure, then the sentence that says
  what it is. A label floating above a frame is chrome; a caption under it is
  content.

### What this fixed on the two homepage panels

Both carried their one load-bearing sentence in a `.pill` — 10px uppercase mono,
the same register the `/product` disclaimer failed in.

| panel | was | now |
|---|---|---|
| `PipelineFlow` | `.pill` reading "illustration · stage 03" | caption: *drawn to show the interface, not produced by a run; the highlighted row advances on a timer.* The pill keeps `stage 03`, which is a neutral readout and is what a pill is for. |
| `PosteriorTrace` | `.pill` reading "illustration · not sampled data" | caption: *the four curves are drawn by a formula in this component, not sampled from any posterior.* The kicker went with it — the caption's first line already says what the figure is. |

### `<Figure>` is not `<Placeholder>`

They must not be confused and the distinction is not stylistic:
`<Placeholder>` carries a mandatory note **plus** the hatch and the
`PLACEHOLDER` flag, because *this has never held a result* is a stronger
statement than a caption and needs a stronger register. Use `<Figure>` for a
figure that is real and needs explaining; `<Placeholder>` for a panel with
nothing behind it. A panel that is both is a `<Placeholder>`.

## 4. Still open

- **`PosteriorTrace`'s four curves are drawn, and that is a register
  inconsistency, not a caption problem.** `placeholder.tsx` rule 5 says a drawn
  curve crops into a result, which is why the seven `/product` panels render a
  hatched `<PlaceholderPlot/>` with no curve at all. By that rule this panel
  should too. Its caption is now honest and at full weight, which is a strict
  improvement, but a caption does not survive a crop and the rule is about
  crops. **Removing the curves is a visible change to the landing page's main
  visual** and it is a register decision rather than a typographic one, so it is
  recorded here rather than taken. See
  [`placeholder-register.md`](placeholder-register.md).
- **The ~45 remaining inline `fontSize` literals** outside the five long-form
  pages. `type-scale.md` §5's answer still holds: the real fix is a component
  layer, and three of its components now exist — the measurement unit, the
  placeholder and the figure. The card and the panel header do not yet.
- **The table form of the measurement unit.** A 163-row record is a table, not a
  row of units. Specified in [`measurement-unit.md`](measurement-unit.md) §8 and
  waiting on the evidence-room work.
- **Dark mode and the print stylesheet**, both direction-dependent, both still
  listed in [`color-roles.md`](color-roles.md) §6. The print case matters more
  here than anywhere: this is the register whose pages go into board packets.

---

**Related:** [`measurement-unit.md`](measurement-unit.md) ·
[`type-scale.md`](type-scale.md) · [`color-roles.md`](color-roles.md) ·
[`placeholder-register.md`](placeholder-register.md)
