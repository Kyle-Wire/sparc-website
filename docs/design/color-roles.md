# Colour roles, and the two-token rule

Internal design specification. Owner: Head of Design. Enforced by
`npm run check:colors`.

Every ratio on this page was computed from the hex values in this repository
(sRGB relative luminance, WCAG 2.1 contrast formula) and is re-checked by the
gate. WCAG 2.1 AA needs **4.5:1** for normal text, **3:1** for large text
(≥24px, or ≥18.66px bold) and **3:1** for non-text UI boundaries that carry
meaning (1.4.11). Public-sector buyers; AA is assumed, not aspired to.

---

## 1. The finding this is built on

`sparc-website` was the least accessible of the company's three design
surfaces and the only public one. `FloodSim` is the most accessible. The nine
individual failures mattered less than one systemic observation:

> All three surfaces fail the 3:1 non-text requirement on their hairline rules
> — 1.61 / 1.68 / 1.34. The fix is **not** "darken the hairlines", because most
> of those rules are decorative and should stay faint. The fix is **two
> tokens**: a decorative hairline with no contrast obligation, and a
> *structural* boundary at ≥3:1. One token was doing both jobs and losing the
> one that matters.

The same shape of error produced the colour problems: `--grad-ramp` was
simultaneously the brand and the severity scale, and a token with two
contracts satisfies neither.

## 2. The three layers

`src/styles/tokens.css` is organised in layers, and the layers are the rule.

### Layer 1 · `--sparc-*` — the brand ramp. Decoration only.

Frozen pending brand review. **No contrast obligation**, because nothing is
lost if a reader cannot resolve it.

Legal: the hero wordmark fill, the 4px strip under the nav, a radial glow
behind a hero, a 2px identity stripe on a card that already has a findable
border.

Illegal: text, the boundary of a control, any encoding of data.

| token | hex | on `--paper` |
|---|---|---|
| `--sparc-purple` | `#602468` | 9.81 |
| `--sparc-magenta` | `#9e337d` | 5.93 |
| `--sparc-pink` | `#e94d9b` | 3.19 |
| `--sparc-red` | `#e94461` | 3.50 |
| `--sparc-crimson` | `#e73c25` | 3.77 — 4.14 under white text |
| `--sparc-orange` | `#e76c25` | 2.91 |
| `--sparc-amber` | `#e79024` | 2.27 |
| `--sparc-gold` | `#f0b632` | 1.67 |
| `--sparc-yellow` | `#fbdd46` | 1.23 |

### Layer 2 · role tokens — these carry obligations

| token | value | contract | measured |
|---|---|---|---|
| `--crimson` / `--accent` | `#cc331f` | text **and** white-text-on-it, 4.5:1 | 4.71 on paper · **5.17 under white text** |
| `--amber-ink` | `#9c5e12` | text, 4.5:1 | 4.75 on paper · 5.22 under white |
| `--purple` | `#602468` | text, 4.5:1 | 9.81 |
| `--magenta` | `#9e337d` | text, 4.5:1 | 5.93 |
| `--muted` | `#6e6358` | text, 4.5:1 | 5.33 |
| `--rule` | `#7c7362` | structural boundary, 3:1 | 4.68 white · 4.26 paper · 3.83 paper-2 · 3.13 paper-3 |
| `--hairline` (= `--line`) | `#c9c2b3` | **none** — decorative | 1.61, and that is correct |

### Layer 3 · `--seq-*` and `--div-*` — data only

See [`data-ramps.md`](data-ramps.md). Brand colour never encodes data; data
colour never decorates.

## 3. What changed, and why each one was load-bearing

### `--crimson` darkened, within the hue family

`#e73c25` → `#cc331f`. Hue 7.1° → 6.9°. White-on 4.14 → **5.17:1**; on paper
3.77 → **4.71:1**.

This is the one change on the list that is not hygiene. Under a
one-conversion-path site, `.btn-accent` is the only button that matters — and
its label is 13px, so 4.14:1 was an AA miss on the single element the whole
site funnels to. The brand ramp step is untouched, so `--grad-ramp` is
unchanged and no brand review is implied: only the *role* token moved. A side
effect worth having is that crimson is now legal as body-size text for the
first time, which covers `a:hover`, the footer link hover and the active
account-nav item.

### The rule token split

`--hairline` keeps `#c9c2b3` and keeps every one of its ~45 existing uses, all
of which are decorative and should stay faint. `--rule` is new at `#7c7362`
and clears 3:1 against white, `--paper`, `--paper-2` and `--paper-3` — all four
grounds we actually put a border on. It is applied to the boundaries that carry
meaning: `.btn`, `.input`, the placeholder panel frame and its inner dashed
surfaces, the drawer and menu controls.

If you are reaching for a border and a reader needs to be able to find it, you
want `--rule`.

### Three hues retired from text and boundary roles

| was | where | ratio | now |
|---|---|---|---|
| `--amber` as mono text | `pricing/page.tsx` list index | 2.27 | `--amber-ink` |
| `--amber` as a tile's only frame | `landing-parts.tsx` ProofStrip | 2.27 | `--amber-ink` |
| `--amber` as a legend swatch | `landing-parts.tsx` PosteriorTrace | 2.27 | `--amber-ink` |
| `--amber`, `--gold` as badge fills **under white text** | `landing-parts.tsx` PipelineFlow stages | **2.50, 1.84** | ink badge; see [`data-ramps.md`](data-ramps.md) §3 |
| `--crimson`, `--orange`, `--gold` as tab fills under white text | `stage-parts.tsx` ReportVisual | 4.14, 3.20, **1.84** | ink tab, plus `aria-selected` |
| `--gold` as a card accent | `stage-parts.tsx` VCard | 1.67 | component removed |

There is deliberately **no `--gold-ink` or `--yellow-ink`**. At 1.67 and 1.23
those two cannot be rescued without leaving the hue, and nothing in the system
needs them to. They are decoration and that is all they are.

### What was left alone, on purpose

Roughly fifteen sites use a brand hue as a 2–3px identity stripe on a card
that already has a findable border — the domain cards, the template peek on the
homepage, the response-time cards, the under-the-hood grid, `PageHero`'s 6px
dot and its radial glow. **None of those carry meaning through hue**, and none
of them owe a ratio. Having two tokens is exactly what makes it possible to
leave them bright.

## 4. Colour is always the redundant channel

This is the house pattern and it was already right in one place: `insar`'s
deliverable verdicts colour their verdict column with hexes that fail AA on the
table's own row, and a reader loses nothing, because the *words* carry the
meaning — "Stands out from farmland", "Within farmland spread". Keep the
pattern, fix the hexes.

Applied here: every `--status-*` token appears beside a word or a glyph that
says the same thing. `--status-warn` now points at `--amber-ink` so the colour
is legible too, but the word is what is doing the work.

## 5. The gate

`npm run check:colors` asserts every token in a declared text or boundary role
against every ground we use, re-derives both data ramps, and prints the
decoration-only tokens with their ratios and the note that they owe nothing.
It fails loudly when someone reaches for `--gold` as a text colour.

It would have caught the primary call-to-action at 4.14:1.

## 6. Still open

- **No dark mode.** All three app surfaces have one; the public site does not,
  and `tokens.css` has no `prefers-color-scheme` block. Deferred: it is a
  direction-dependent decision.
- **No print stylesheet**, on a site whose readers put pages into board
  packets. The placeholder hatch now forces `print-color-adjust: exact` so at
  least the honesty survives a print. Deferred with dark mode.
- **`prefers-reduced-motion`** now covers the two loops it previously missed —
  `rampShift` on the hero wordmark and the nav strip. `pulse-dot` and
  `.live-dot` were removed outright rather than quieted.
- **~45 inline `fontSize` literals** across the pages. See
  [`type-scale.md`](type-scale.md) §4 — the real fix is a small component layer,
  and that is direction-dependent.
