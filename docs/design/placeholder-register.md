# The placeholder register

> **A placeholder panel shows layout. It never shows digits.**

Internal design specification. Owner: Head of Design. Enforced by
`npm run check:placeholders` and `npm run check:placeholders:rendered`.

---

## 1. Why this is a primitive and not a label

On 29 October 2026 this site rendered, to the public, a planner brief
recommending a dollar figure of canopy planting across a named number of
priority tracts, with a temperature effect and a sigma. No run produced any of
it. Two lines above it, in the source, sat an accurate comment saying the
figures were invented. The panel also labelled itself `sample output ·
illustrative` in its own header.

Both of those honest signals failed, and they failed for a design reason that
is worth stating precisely, because it generalises:

- The source comment had no failure mode. Nothing broke when it was ignored.
- The rendered label was in the weakest typographic register the system has —
  10px, mono, `--muted`, right-aligned in a card header — and it was *visually
  identical* to decorative metadata on the same page (`philadelphia · 2026`
  two panels down, `1 km grid` on the homepage). A reader has no way to tell a
  disclaimer from a timestamp. Meanwhile the claim itself rendered in body copy
  at full strength.

So the design was what made the false claim read as true. A caption cannot fix
a panel. The register replaces the panel.

The same failure had already been found on the homepage's `ScenarioCompare`,
which rendered five invented figures at 24px bold under a 10px muted
disclaimer. Both are now in this one register, because a register with two
treatments is not a register.

## 2. The rules

All six are testable, which is the only reason to write them this way.

| | Rule | Why |
|---|---|---|
| 1 | **Every numeral becomes an em dash at the same metrics.** Use `<Em/>`. | The slot has to stay. A deleted slot does not show the layout, which is the one thing a placeholder is for. |
| 2 | **The diagonal hatch (`--tex-hatch`) sits behind the whole panel**, and inner surfaces go transparent so it is continuous. | One texture, one meaning, site-wide: *there is no number here*. It is the same hatch that will mean "unvalidated regime" and "not tested". A texture survives greyscale, print, PNG export and a photocopy; a tooltip and a colour do not. |
| 3 | **`PLACEHOLDER` sits in the panel's own header, at `--fs-body`, bold, full-strength ink, boxed.** Never in the kicker or meta register. | Direct inversion of the failure in §1. An honesty label smaller than the body text it qualifies is a disclaimer, and we have measured evidence that disclaimers do not read. `--fs-body` is the floor for any honesty label in this system. |
| 4 | **A note is mandatory**, one sentence, saying what the panel is and what it has never held. Not a tooltip, not truncated, not collapsed on mobile. | The hatch is a convention a first-time reader has not learned yet. A sentence is not. Anything you have to hover or expand is not in the primary read. |
| 5 | **No data colour inside a placeholder.** A plot area with nothing behind it renders as `<PlaceholderPlot/>`; a bar renders as `<PlaceholderTrack/>`. Axes, legend rows and node diagrams survive, because those are layout. | A drawn curve crops into a result whether or not a number is printed on it. This is §4.2's regime-masking rule generalised from a cell to a whole chart. |
| 6 | **A placeholder takes no accent colour.** | A coloured top rule is how the old mock panels borrowed the authority of a real card. |

**One vocabulary.** The word is `PLACEHOLDER`. Not `LAYOUT ONLY`, not
`ILLUSTRATIVE`, not `SAMPLE`. A label whose wording varies by panel has
already started editorialising.

## 3. The acceptance test

> **Crop the panel anywhere, at any zoom. No crop may read as a result.**

That is the test. Not "is there a disclaimer", which the old panel passed.

It is also the test that decided a case the digit rule alone does not settle.
The `/product` report panel's planner tab carried the sentence *"$2.4M canopy
expansion across 218 priority tracts is projected to reduce mean afternoon
air-temperature by 0.26 °C (σ 0.15)."* Em-dashing the numerals leaves *"canopy
expansion across — priority tracts is projected to reduce mean afternoon
air-temperature by —"*, which still crops into a claim — and canopy cooling is
the one intervention the validation register records as **not established**. So
the body renders as the skeleton of a document rather than as prose with holes
in it. What the three audiences actually receive is already stated in the copy
beside the panel, which is where a feature description belongs.

## 4. How to apply it

```tsx
import { Em, Placeholder, PlaceholderPlot } from "@/components/system/placeholder";

<Placeholder
  label="simulation · scenario"
  note="This is the layout of the scenario panel. No scenario has been run for any place."
>
  <PlaceholderPlot height={64} ariaLabel="Empty raster area showing where …" />
  <dl className="dl"><dt>mean change</dt><dd><Em /></dd></dl>
</Placeholder>
```

Do not hand-roll `data-placeholder`. The gate fails on it, on purpose: if the
marker can be applied without the visual, the two drift apart and the gate
becomes decoration.

**Panel labels carry no place and no date.** `philadelphia · 2026` on a
scenario card is a study a reader can believe we ran, with or without digits
beside it.

## 5. The gate

The marker is the load-bearing part of this spec, not the hatch. With
`data-placeholder` on the wrapper, *no numeral inside this subtree* is a
mechanical check.

| | What it reads | Catches | Cost |
|---|---|---|---|
| `npm run check:placeholders` | the TSX source, via the TypeScript parser | digits in rendered text, in text-bearing props, and runtime numeral factories (`toFixed`, `Math.*`, `padStart`); a hand-rolled marker; a missing note | fast, every commit |
| `npm run check:placeholders:rendered` | the prerendered HTML, after `npm run build` | **any digit a visitor would see**, including one reached indirectly | needs a build |

Geometry is exempt by design: `viewBox`, `d`, `cx`, `width` and `style` values
are layout, and forbidding them would mean a placeholder could not draw an
axis. The rendered check sidesteps the question entirely — stripping tags takes
every attribute with them, so it reads what a visitor reads.

Both gates are verified against a deliberately bad fixture, not just against
passing code. The source gate's one honest hole is a digit in a module-scope
constant referenced by identifier inside a subtree; the rendered gate closes
it.

**Suggested CI wiring** (for Gate, with
[SPA-42](/SPA/issues/SPA-42)'s sibling issue on adding a workflow): run
`check:placeholders` and `check:colors` on every push, and
`check:placeholders:rendered` after the build step. Both are plain Node, no new
dependency, and both exit non-zero with a `file:line` and a sentence saying
what to do.

## 6. Two registers that must not look alike

`PLACEHOLDER` means *nothing here was ever produced*. **Redaction** is the
inverse: *this was produced, an identifier is withheld*. If those render alike,
a reader cannot tell a withheld client name from an invented package — and the
distinction is the company's whole credibility position.

| | **Placeholder** | **Redaction** (specified, not built) |
|---|---|---|
| Means | never produced | produced, identifier withheld |
| Numerals | every one is `—` | real; they trace to the package |
| Ground | diagonal hatch behind the panel | none — the panel is ordinary |
| Covered text | n/a | solid block at the covered text's own metrics, `████` |
| Header | `PLACEHOLDER` at label weight | what was removed and why |

**Redaction is only usable over something that exists.** A synthesized manifest
is a placeholder and renders hatched with `—` for every size and count, no
exceptions. That keeps "no invented numbers, ever, including in mockups"
checkable at the panel level, and a manifest is dense with numbers, so it
matters.

## 7. Open: a third register for interface illustrations

Three homepage panels — `TerminalSplash`, `PipelineFlow`, `PosteriorTrace` —
depict the interface and assert no values. They carry `illustration · …`
labels from the claim sweep and they are **deliberately not in this register**,
because they have no value slots to empty: there is nothing to replace with an
em dash.

They do render ordinal UI labels, though — stage `00`–`06`, `trace 1`–`4` —
which is why they cannot simply be absorbed into a rule that forbids all
digits. Either that is a legitimate second, weaker register with its own
marker, or those labels should go. It is a real question and it is not urgent;
flagged here so the inconsistency is on the record rather than discovered later.

---

**Related:** [`color-roles.md`](color-roles.md) ·
[`data-ramps.md`](data-ramps.md) · [`type-scale.md`](type-scale.md)
