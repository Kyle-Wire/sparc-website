# Data ramps, and why the brand ramp is not one

Internal design specification. Owner: Head of Design. Enforced by
`npm run check:colors` (the ramps are re-derived and their separation asserted)
and `npm run check:color-usage` (the brand ramp cannot leave its declared
decorative sites). The render-level half is specified in §5 and handed to Gate.

> **Brand colour never encodes data. Data colour never decorates.**

This rule is already written down inside the company, in a comment at the top
of the pipeline app's stylesheet:
*"The map's data layers keep their own colour scales: they are measurements,
not decoration."* — `insar_pipeline app_assets/app.css:6-7`. It is enforced
there in code: the basemap is desaturated so that measurement colour is the
only colour on the map. The website was the surface breaking it.

---

## 1. The measurement

`--grad-ramp` is a nine-step purple→yellow gradient. It was used as a severity
and stage sequence on the homepage pipeline and as the progress fill on the
product rail. **It is not luminance-monotonic:**

| step | hex | rel. luminance | 8-bit grey | vs previous |
|---|---|---|---|---|
| purple | `#602468` | 0.0475 | 64 | — |
| magenta | `#9e337d` | 0.1112 | 94 | up |
| pink | `#e94d9b` | 0.2500 | 136 | up |
| red | `#e94461` | 0.2232 | 129 | **down** |
| crimson | `#e73c25` | 0.2035 | 124 | **down** |
| orange | `#e76c25` | 0.2785 | 143 | up |
| amber | `#e79024` | 0.3706 | 162 | up |
| gold | `#f0b632` | 0.5221 | 190 | up |
| yellow | `#fbdd46` | 0.7266 | 221 | up |

Four consecutive steps — pink, red, crimson, orange — land inside a **19-level
band out of 256**. In greyscale print, and for a reader with red–green
deficiency, stages 02/03/04/05 were one colour. Agency deliverables get
printed, so this is not hypothetical.

**Rule: the brand ramp is brand furniture. It never encodes an ordered
quantity.**

**And the rule is now a build failure rather than a comment.** `tokens.css`
listed the ramp's legal uses — the hero wordmark fill, the 4px strip under the
nav, a radial glow — and listed the illegal ones it had been doing. That list was
prose. It is now the `RAMP_SITES` allowlist in
`scripts/check-color-usage.mjs`: `var(--grad-ramp)` outside a declared site
fails `npm run check:color-usage`, and the two declared sites are the two that
exist. A third one is a decision somebody has to write down, with a reason,
where the next person will read it.

That matters more here than anywhere else in this directory, because this is the
rule the company already had in writing — `insar_pipeline app_assets/app.css:6`
— and broke anyway, on the one surface that is public.

## 2. The two ramps

### Sequential · for magnitude · `--seq-1` … `--seq-9`

Derived, not picked. `scripts/derive-ramps.mjs` holds each brand step's **hue**
and solves HSL lightness for an evenly spaced 8-bit greyscale target. The brand
keeps the thing a brand cares about; the ramp earns the thing a reader decodes.

| token | hex | 8-bit grey | gap |
|---|---|---|---|
| `--seq-1` | `#2a102d` | 32 | — |
| `--seq-2` | `#5c1e49` | 57 | 25 |
| `--seq-3` | `#9c1358` | 82 | 25 |
| `--seq-4` | `#d21a3a` | 107 | 25 |
| `--seq-5` | `#e7533f` | 132 | 25 |
| `--seq-6` | `#e9844b` | 157 | 25 |
| `--seq-7` | `#ebab5c` | 182 | 25 |
| `--seq-8` | `#efcc7e` | 207 | 25 |
| `--seq-9` | `#f5eab0` | 232 | 25 |

Monotonic by construction, 25 grey levels between adjacent steps. `--grad-ramp`
separates its worst four steps by 19 levels **in total**.

The derivation is a script rather than nine committed hexes for one reason:
"the ramp is monotonic" is a property you either prove or do not have. The gate
re-runs the derivation and fails if the committed tokens have been hand-edited,
because a ramp nobody can re-derive is how `--grad-ramp` got here.

### Diverging · for signed change · `--div-1` … `--div-9`

**ColorBrewer RdBu, 9-class, verbatim. Adoption, not invention.** Both
engineering repos independently arrived at it for signed change:

- `FloodSim app/map.html:116, 118` builds the compare and depth legends from
  `rgb(33,102,172)` → `rgb(178,24,43)` — the endpoints of RdBu.
- `insar figures.py:436, 460, 627` uses `cmap="RdBu"` with
  `TwoSlopeNorm(0, −lim, lim)`, so zero pins to the neutral midpoint.

Zero pins to `--div-5` (`#f7f7f7`), and the gate asserts that specific hex: a
diverging ramp whose zero is off the midpoint lies about sign.

It is deliberately **not** monotonic end to end. It is monotonic *outward from
zero, one arm at a time* — blue arm 247 > 225 > 188 > 138 > 100, red arm
247 > 225 > 182 > 131 > 91 — which is the property the gate checks, because it
is the property the ramp claims. The consequence is that the two arms are
distinguishable from each other **only by hue**, so a diverging legend always
carries numeric ends and a labelled zero. All three surfaces already do this
(`viewer.css .legend .ticks`, `map.html .ticks`, `app.css .legend .ends`);
keep it.

### Quality is not hazard

`figures.py:483` renders temporal coherence as `cmap="gray", vmin=0, vmax=1`.
Quality layers do not get hazard colour. Good instinct, now a rule.

## 3. What `--grad-ramp` lost

| role | was | now | why |
|---|---|---|---|
| stage colour, homepage pipeline | 7 brand steps as badge fills under white text | badge is `--fg`; the shown row is `--accent` | Stage index is ordinal, and it already has **two** non-colour channels stronger than hue: the number itself and the row position. Colour is left with the one job it is good at here — marking which row is shown. It also removes two unreadable pairs: white on `--gold` is 1.84:1. |
| progress fill, product rail | 7-stop vertical gradient | solid `--accent` | Progress is encoded by **length**. That is what a progress bar is. A gradient added hue to a quantity that was already unambiguous. |
| panel accent, `/product` | per-stage brand hue on a card's top rule | removed with `VCard` | Those panels are placeholders now and take no accent — see [`placeholder-register.md`](placeholder-register.md) rule 6. |
| hero wordmark, nav strip | `--grad-ramp` | **unchanged** | Decoration, and legal. It is now built from `--sparc-*` rather than the working hues, so darkening `--crimson` for AA left the gradient alone. |

**Why stage chrome gets no ramp at all, since it is the non-obvious call:** a
seven-step chrome ramp on a light ground cannot be both monotonic and ≥3:1.
Only five of the nine sequential steps clear 3:1 against `--paper` — the light
end tops out at 1.11 — so seven findable, ordered, distinguishable chrome
colours do not exist on this background. Rather than invent a worse ramp, the
honest answer is that stage identity was never a colour problem.

## 4. Where the ramps are used today

**Nowhere, and that is correct.** Every chart on this site is currently a
placeholder, and placeholders carry no data colour. The ramps exist as tokens
so that the evidence-room work and the two apps have one definition to adopt
instead of re-deriving a scale per surface, which is what produced three accent
hues and two incompatible severity scales across one company.

The gate keeps them honest in the meantime: a ramp that drifts fails the build
before anything is drawn with it.

## 5. The greyscale legend test — specified, for Gate

The token-level half is built and runs in `npm run check:colors`: the ramps are
re-derived and their greyscale separation asserted against a floor of 8 grey
levels out of 256. That is what would have caught the `--grad-ramp` problem.

The render-level half is the stronger test and is **more than a day's work**,
so it is specified here and handed over rather than built:

> Render every map, chart and legend to greyscale in CI, sample the legend
> swatches, and assert that adjacent legend classes differ by at least 8 of 255
> in 8-bit grey. Fail the build otherwise.

Implementation notes, so the estimate is not a guess:

1. **Needs a render harness.** The repo has no component test runner and no
   headless browser. Minimum viable: Playwright, one page that mounts each
   legend at a fixed size, `page.screenshot()` with a CSS
   `filter: grayscale(1)` applied, then sample pixels at known swatch centres.
2. **Needs stable targets.** Each legend swatch should carry
   `data-legend-swatch="<class>"` so the sampler reads positions from the DOM
   instead of from hard-coded coordinates. That attribute does not exist yet
   and should be added with the first real legend.
3. **Severity surviving greyscale is a correctness property, not a nicety.**
   Treat the check as a build failure, not a warning. A warning on a
   deliverable that gets printed is a warning nobody reads.
4. **Scope it to data colour only.** Brand furniture must be excluded or the
   check will fail on the hero and be disabled within a week.

Until that exists, the discipline is the token gate plus the rule in §1, and
the rule's enforcement is review.

---

**Related:** [`color-roles.md`](color-roles.md) ·
[`placeholder-register.md`](placeholder-register.md)
