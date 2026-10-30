# Design system — internal specifications

These are internal design specifications for `sparc-website`, not public
documentation. The reader's guides in `docs/` are a different thing with a
different audience.

Each page states a rule, the measurement behind it, and the gate that enforces
it. Where there is no gate yet, the page says so.

| | |
|---|---|
| [`measurement-unit.md`](measurement-unit.md) | Four slots, never fewer. The primitive every trust surface sits on, its four required props, and why it has no colour axis. |
| [`placeholder-register.md`](placeholder-register.md) | A placeholder panel shows layout. It never shows digits. The register, the acceptance test, and the two CI gates. |
| [`color-roles.md`](color-roles.md) | Three token layers, the decorative-vs-structural rule split finished at the use sites, the AA failures and what each fix was worth. |
| [`data-ramps.md`](data-ramps.md) | Why the brand ramp cannot encode severity, the two data ramps, and the greyscale legend test specified for Gate. |
| [`type-scale.md`](type-scale.md) | One set of scale tokens, read at every breakpoint, and tabular-lining numerals declared once. |

## The gates

```
npm run check:design                  # placeholders + measurements + numerals + colours
npm run check:placeholders            # no numeral in a placeholder subtree
npm run check:measurements            # four slots per unit, no colour axis
npm run check:numerals                # tabular-lining figures, no overrides
npm run check:colors                  # token contrast + ramp monotonicity
npm run check:color-usage             # the right token at the use site
npm run build && npm run check:placeholders:rendered
                                      # no digit a visitor could see
```

All three are plain Node with no new dependency, and each exits non-zero with a
`file:line` and a sentence saying what to do about it. CI wiring is Gate's
([SPA-42](/SPA/issues/SPA-42) sibling: *fix npm run lint, then add a CI
workflow*).

## The one rule under all of them

> Everything displayed traces to the validation record or to
> `sparc-resilience/docs/results/reconciliation.md`. No invented numbers, ever,
> including in mockups.

Before this work, "including in mockups" rested on a source comment. It now
fails a build.

## Not settled here

The direction choice (instrument / field report / cabinet) is with the board.
Dark mode, the print stylesheet, the typeface fork, the nav and IA
re-pointing, the evidence-room layout, the maturity chips
([SPA-37](/SPA/issues/SPA-37)) and the data-handling table all wait on it or on
a vocabulary that is not ours to assume. Each page above lists its own open
items in a final section.
