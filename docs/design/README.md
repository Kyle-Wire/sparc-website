# Design system — internal specifications

These are internal design specifications for `sparc-website`, not public
documentation. The reader's guides in `docs/` are a different thing with a
different audience.

Each page states a rule, the measurement behind it, and the gate that enforces
it. Where there is no gate yet, the page says so.

| | |
|---|---|
| [`site-redesign-brief.md`](site-redesign-brief.md) | The site's direction from 17 November 2026: public records free for any US address, flood and heat models paid. What is built, what is not, and whose decision each point was. |
| [`roadmap.md`](roadmap.md) | Everything a one-stop shop for buying and owning a home would need, by what it does for the visitor, with what is built, what is next and what waits on Kyle or the engines. |
| [`placeholder-register.md`](placeholder-register.md) | A placeholder panel shows layout. It never shows digits. The register, the acceptance test, and the two CI gates. |
| [`color-roles.md`](color-roles.md) | Three token layers, the decorative-vs-structural rule split, the AA failures and what each fix was worth. |
| [`data-ramps.md`](data-ramps.md) | Why the brand ramp cannot encode severity, the two data ramps, and the greyscale legend test specified for Gate. |
| [`type-scale.md`](type-scale.md) | One set of scale tokens, read at every breakpoint. |

## The gates

```
npm run check:design                  # placeholders + colours, fast
npm run check:placeholders            # no numeral in a placeholder subtree
npm run check:colors                  # token contrast + ramp monotonicity
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

Since the redesign of 17 November 2026 there is a third thing a displayed
number may trace to: a public register, fetched live and named with its
publisher on the card that shows it (`src/lib/place/`, and the source table in
[`site-redesign-brief.md`](site-redesign-brief.md)). The rule is otherwise
unchanged. A model result with no run behind it is still a placeholder panel,
and the paid shelves on a place page are drawn that way.

## Not settled here

The direction choice (instrument / field report / cabinet) is with the board.
Dark mode, the print stylesheet, the typeface fork, the nav and IA
re-pointing, the evidence-room layout, the maturity chips
([SPA-37](/SPA/issues/SPA-37)) and the data-handling table all wait on it or on
a vocabulary that is not ours to assume. Each page above lists its own open
items in a final section.
