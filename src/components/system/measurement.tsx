import * as React from "react";

/**
 * The measurement unit.
 *
 *   Every number SPARC renders is a composite with four fixed slots.
 *   A slot with no value renders an em dash. Never blank, never zero,
 *   never omitted.
 *
 * This is the primitive the rest of the trust surfaces sit on, and it is not an
 * invention: insar_pipeline/figures.py:726-905 already builds exactly this unit
 * for a client deliverable, and a figure it could not compute reads `—` rather
 * than defaulting to zero (figures.py:727-730). The pattern was trapped in a
 * PNG inside a PDF and appeared in no interface. This is that unit, promoted to
 * a layout component.
 *
 * The four slots
 * --------------
 *  1. value     the number, tabular-lining, the largest thing in the unit.
 *  2. interval  `± x` AND WHAT IT IS THE SPREAD OF. A bare sigma is not a
 *               slot-2 value, which is why the prop is a pair and not a
 *               string -- figures.py:793's table header literally reads
 *               "± = farmland spread", and that second half is the half a
 *               reader needs.
 *  3. verdict   the reading as a short phrase that still means something with
 *               the colour removed: "Stands out from farmland" / "Within
 *               farmland spread" / "Not testable against farmland". A SENTENCE,
 *               NOT A COLOUR AND NOT AN ICON. It survives greyscale, a screen
 *               reader, and a photocopy.
 *  4. support   what ground and time the value draws on. This is the honest
 *               answer to zoom: a reader who zooms past the support distance
 *               should see the unit say so rather than see smoother colour.
 *
 * Why every slot is a required prop
 * ---------------------------------
 * "Four slots, never fewer" has to be a type error before it is a review
 * comment. None of the four is optional; each one takes `null` to mean "we do
 * not have this", and `null` renders an em dash at the slot's own metrics. So
 * omitting a slot does not compile, and declining one is a visible, deliberate
 * statement in the markup -- which is the opposite of the failure mode this
 * replaces, where the missing half of a figure was simply absent and the reader
 * had no way to know a slot existed at all.
 *
 * What this component deliberately cannot do
 * ------------------------------------------
 * There is no `tone`, `severity`, `status` or `accent` prop, and there will not
 * be one. Slot 3 is the channel that carries the reading; colour is only ever
 * redundant to it. An API that can colour a verdict is an API through which the
 * brand ramp becomes a severity scale, which is the measured failure in
 * docs/design/data-ramps.md -- four of its nine steps sit inside a 19-level
 * band out of 256, so stages 02-05 were one colour in greyscale print.
 *
 * The boundary rule, built in
 * ---------------------------
 *   Personality may touch anything that is not a measurement. The moment a
 *   number appears, the measurement unit governs and the personality stops at
 *   the panel border.
 *
 * So this unit is plain on purpose: no display face, no stepped elevation, no
 * brand hue carrying meaning. Its punch comes from its structure -- what it
 * refuses to hide -- not from its styling. The test is the crop test: crop any
 * panel containing a number, and if the crop contains the display face, a
 * stepped shadow or a brand hue carrying meaning, the boundary has been
 * crossed. scripts/check-measurements.mjs runs the mechanical half of that.
 *
 * Composing with the placeholder register
 * ---------------------------------------
 * A unit with no verified figure behind it is four nulls inside a
 * <Placeholder>. That is not a special mode and needs no flag: the slots render
 * as em dashes, the panel carries the hatch and the PLACEHOLDER flag, and
 * scripts/check-placeholders.mjs already forbids a digit anywhere in the
 * subtree. A panel with no number renders the register, not a plausible digit.
 */

/** Slot 2. The pair is the point: `± 0.38` on its own is not a measurement. */
export type Interval = {
  /** The spread itself, formatted, without a leading `±`. */
  spread: string;
  /** What it is the spread OF. "farmland spread", "8-run sampling", "RMSE". */
  of: string;
};

/** A slot with nothing in it. Same metrics as the slot's content, so the unit
 *  still reads as a unit -- an omitted slot shows nothing, which is the whole
 *  problem. */
function Slot({ children }: { children: React.ReactNode }) {
  return children == null ? <span className="mu-em">—</span> : <>{children}</>;
}

export function Measurement({
  of,
  value,
  interval,
  verdict,
  support,
  href,
}: {
  /** What is being measured. The unit's name, not one of the four slots, and
   *  required for the same reason: a number with no subject is not a reading. */
  of: string;
  /** Slot 1. A string, not a number, so the unit cannot compute one and so it
   *  can carry a sign, a unit symbol, or a verdict-shaped non-value such as
   *  "not established". `null` when there is no figure. */
  value: string | null;
  /** Slot 2. `null` when no interval is on record -- which is common, and is
   *  worth seeing. */
  interval: Interval | null;
  /** Slot 3. A phrase that reads correctly in greyscale. `null` only when the
   *  record carries no verdict at all. */
  verdict: string | null;
  /** Slot 4. The ground and time the value draws on, and its provenance grade
   *  where the record carries one. `null` when unrecorded. */
  support: string | null;
  /** Optional: where the figure is openable down to. "Every headline number is
   *  openable down to its provenance" is the one thing the unit links out for;
   *  it is not a slot and it never replaces one. */
  href?: string;
}) {
  const label = <div className="mu-of">{of}</div>;
  return (
    <div data-measurement className="mu">
      {href ? <a className="mu-link" href={href}>{label}</a> : label}

      <div className="mu-value">
        <Slot>{value}</Slot>
      </div>

      {/* Slot 2 sits with the value because it modifies it, and the name of the
          spread renders at the same size and ink as the spread -- it is not a
          qualifier on the number, it is half of what the number means. */}
      <div className="mu-interval">
        {interval ? (
          <>
            <span className="mu-pm">±&nbsp;{interval.spread}</span>{" "}
            <span className="mu-of-what">{interval.of}</span>
          </>
        ) : (
          /* The `±` stays when the spread does not. It is the slot's name
             rather than part of its value, and without it a reader meets a
             column of bare em dashes and cannot tell which slot each one is
             standing in -- which would make the absence unreadable, and an
             unreadable absence is the thing this unit exists to prevent. */
          <span className="mu-em">±&nbsp;—</span>
        )}
      </div>

      {/* The rule above the verdict is --rule, not --hairline: it is the
          division between a result and the caveat on it, which carries meaning,
          so WCAG 1.4.11 applies and it clears 3:1 on every ground we put it on.
          The five slots are direct children so that a row of units can line
          them up on a shared grid -- see .mu-row. */}
      <div className="mu-verdict">
        <Slot>{verdict}</Slot>
      </div>
      <div className="mu-support">
        <Slot>{support}</Slot>
      </div>
    </div>
  );
}

/**
 * A row of measurement units that read as one table.
 *
 * Separate component rather than a prop on the unit, because the alignment is
 * the reason it exists: slot 1 of every unit in a row sits on one baseline and
 * slot 3 starts at one offset, so a reader compares verdicts down a column
 * instead of hunting for them. Four units of unequal slot lengths laid out
 * independently is four cards; laid out on a shared grid it is a field report.
 */
export function MeasurementRow({
  children,
  cols = 4,
}: {
  children: React.ReactNode;
  /** How many units sit side by side at full width. Layout only -- it cascades
   *  to two and then one through the stylesheet's breakpoints. */
  cols?: 2 | 3 | 4;
}) {
  return (
    <div className="mu-row" style={{ "--mu-cols": cols } as React.CSSProperties}>
      {children}
    </div>
  );
}
