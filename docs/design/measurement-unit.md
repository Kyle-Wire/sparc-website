# The measurement unit — four slots, never fewer

Internal design specification. Owner: Head of Design. Enforced by
`npm run check:measurements`; the rendered half is specified in §6 and not
built.

> **Every number this company renders is a composite with four fixed slots. A
> slot with no value renders an em dash. Never blank, never zero, never
> omitted.**

This is the primitive the trust surfaces sit on. Everything else in this
directory — the placeholder register, the colour roles, the data ramps — is a
rule about what a panel may do. This is the thing a panel is made of.

---

## 1. It is not an invention

`insar_pipeline/figures.py:726-905` already builds this unit. It renders a
summary graphic in which every headline figure carries four things, and a figure
it could not compute reads `—` rather than crashing or defaulting to zero
(`figures.py:727-730`).

The pattern was correct and it was trapped in a PNG, inside a PDF, inside a
client deliverable. It appeared in no interface. This is that unit promoted to a
layout component, and the slot table below is a transcription rather than a
design:

| Slot | What it is | Where it already existed |
|---|---|---|
| **1 · Value** | the number, tabular-lining, the largest thing in the unit | everywhere |
| **2 · Interval, _named_** | `± x` **and what it is the spread of** — not a bare sigma | `figures.py:752-757`; the table header literally reads `± = farmland spread` (`figures.py:793`) |
| **3 · Verdict, in words** | the reading as a short phrase that still means something with the colour removed | `figures.py:762-775` |
| **4 · Support** | what ground and time the value draws on | `figures.py:779-782`, `figures.py:788-790` |

**Slot 3 is the important one and it is the thing nobody else does.** The verdict
is a sentence, not a colour and not an icon. It survives greyscale, a screen
reader, and a photocopy. `figures.py:891-893` also colours those verdicts — but
the colour is redundant to the words, which is the correct dependency order and
the reason the whole unit degrades gracefully.

**Slot 4 is the honest answer to zoom.** A reader who zooms past the support
distance should see the unit say so, not see smoother colour.

## 2. Four required props, each nullable

`src/components/system/measurement.tsx`.

```tsx
<Measurement
  of="impervious · providence"      // the subject. Not a slot, equally required.
  value="−0.40 °F"                  // slot 1
  interval={null}                   // slot 2
  verdict="Model and causal estimate agree"   // slot 3
  support="−10 pp impervious · Providence"    // slot 4
/>
```

None of the five is optional, and each takes `null` to mean *we do not have
this*. So:

- **Omitting a slot does not compile.** "Four slots, never fewer" is a type
  error before it is a review comment.
- **Declining a slot is a visible statement in the markup.** `interval={null}`
  is a sentence a reviewer can read. An absent prop is not.
- **`null` renders an em dash at the slot's own metrics**, so the layout reads
  exactly as it would with a value in it. That is what makes an empty slot a
  declared absence rather than a gap.

Slot 2's prop is a pair, `{ spread, of }`, and that is the whole point of it:
`± 0.38` on its own is not slot 2. The type makes a bare sigma unrepresentable.

**The interval slot keeps its `±` when it loses its spread.** It renders `± —`,
because the `±` is the slot's name rather than part of its value, and a column
of bare em dashes is an absence a reader cannot locate.

## 3. What the component deliberately cannot do

There is no `tone`, `severity`, `status`, `accent`, `variant` or `fill` prop,
and the gate fails the build if one appears.

Slot 3 is the channel that carries the reading; colour is only ever redundant to
it. An API that can colour a verdict is the API through which the brand ramp
becomes a severity scale, and that is a measured failure rather than a
hypothetical one — see [`data-ramps.md`](data-ramps.md): four of the brand
ramp's nine steps sit inside a 19-level band out of 256, so stages 02–05 were
one colour in greyscale print and for a reader with red–green deficiency.

For the same reason there is no `accent`, which is the prop `VCard` had and the
mechanism by which a mock panel borrowed the authority of a real one.

## 4. The boundary rule, built in

> **Personality may touch anything that is not a measurement. The moment a
> number appears, the measurement unit governs and the personality stops at the
> panel border.**

So the unit is plain on purpose: no display face, no stepped elevation, no brand
hue carrying meaning, no elevation at all. Rules and whitespace instead, which
is what a methods appendix is made of. Its punch comes from its structure — what
it refuses to hide — not from its styling.

The acceptance test is the crop test, and it runs in both directions:

- **Crop any panel that contains a number.** If the crop contains the display
  face, a stepped shadow, or a brand hue carrying meaning, the boundary has been
  crossed.
- **Crop any panel that contains no number.** If that crop is indistinguishable
  from a generic template, the chrome register is not doing its job.

Note which way the restraint runs: it is scoped to measurements, and the licence
is everywhere else.

## 5. Composing with the placeholder register

A unit with no verified figure behind it is **four nulls inside a
`<Placeholder>`**. That is not a mode and needs no flag:

```tsx
<Placeholder label="adaptation scenario" note="…">
  <MeasurementRow cols={2}>
    <Measurement of="Baseline" value={null} interval={null} verdict={null} support={null} />
    <Measurement of="+ canopy scenario" value={null} interval={null} verdict={null} support={null} />
  </MeasurementRow>
</Placeholder>
```

The slots render as em dashes, the panel carries the hatch and the `PLACEHOLDER`
flag, and `npm run check:placeholders` already forbids a digit anywhere in the
subtree. Its `TEXT_PROPS` list carries the four slot names, so a figure cannot
enter a placeholder through a slot.

**A panel with no verified figure renders the register, not a plausible digit.**

## 6. What the gate asserts, and what it does not

`npm run check:measurements` — part of `npm run check:design`.

1. **Only the primitive writes `data-measurement`.** Same reasoning as
   `data-placeholder`: if the marker can be hand-rolled, the visual register and
   the gate drift apart.
2. **Every call site names all five props, with no spread.**
   `<Measurement {...row} />` typechecks and still leaves a reviewer unable to
   see which slot we did not have. "Which of these four is missing" is the
   question a reader of this code is always asking, so it has to be answerable
   from the markup.
3. **A literal verdict contains words.** `verdict="✓"` fails. A glyph does not
   survive greyscale, a screen reader or a photocopy, which is the one property
   slot 3 exists for.
4. **No colour axis.** Neither a forbidden prop at a call site nor a forbidden
   prop declared in the primitive.
5. **The stylesheet half of the boundary rule.** No rule selecting `.mu*` or
   `[data-measurement]` may set a shadow, a filter, or a brand token.
6. **A gate that finds nothing fails.** Zero call sites exits non-zero.

**What it does not catch**, stated so nobody trusts it further than it goes: a
brand hue reaching the unit through a token alias defined elsewhere, a shadow
applied by a parent, and a verdict computed at runtime. The crop test is still
the acceptance test; this is the part of it that can fail a build.

**The rendered half is specified and not built.** The stronger check is to read
the prerendered HTML, find every `[data-measurement]` subtree, and assert it
contains exactly five slot elements — the same shape as
`check:placeholders:rendered`, which closes the "digit reached indirectly" hole
by reading what a visitor reads. It is worth building when there is a second
rendered call site to protect; today the type system covers the one case it
would catch.

## 7. Where it is used today

| Call site | State |
|---|---|
| `landing-parts.tsx` `ProofStrip` | The reference site. Four readings from the register, three with no interval on record. **Not imported by any page**, and that is unchanged by this work. |
| `landing-parts.tsx` `ScenarioCompare` | Three units, all slots `null`, inside the placeholder register. This is the rendered call site. |

`ProofStrip` is worth reading as the before-and-after. It had a subject, a value
and one line of mixed caveat, with the verdict and the support competing for the
same 12px of muted mono and the interval nowhere at all. Splitting that line
into slots 3 and 4 made one thing visible that the single line had hidden: **the
register carries no interval for any of the four readings.** Four `± —`s in a
row is an uncomfortable render and it is the correct one. A spread that is not on
record is not a spread of zero, and the old layout could not say so because it
had no slot to say it in.

## 8. Not settled here

- **The table form.** A record with 163 rows is a table, not a row of units, and
  it shares these four slots per row. The verdict vocabulary, the reason codes
  and the sort order are specified (`failed · not established · not tested ·
  passed`, reason code at the same size and weight as the verdict word) and the
  component is not built. It wants the evidence-room work, not this task.
- **The provenance chip.** Slot 4 carries a per-row grade word where the record
  has one. The always-visible run-identity chip that belongs with it is chrome,
  and chrome waits on the direction answer.
- **The rendered gate**, as above.

---

**Related:** [`placeholder-register.md`](placeholder-register.md) ·
[`color-roles.md`](color-roles.md) · [`data-ramps.md`](data-ramps.md)
