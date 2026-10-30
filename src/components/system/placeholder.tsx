import * as React from "react";

/**
 * The placeholder register.
 *
 *   A placeholder panel shows layout. It never shows digits.
 *
 * Use this for any panel that depicts a readout nothing has produced. It is
 * not a label you add to a panel, it is the panel: the marker, the ground, the
 * header flag and the note all arrive together, because the failure mode this
 * replaces was a panel that labelled itself honestly and still read as a
 * result.
 *
 * Why the attribute matters more than the hatch
 * ---------------------------------------------
 * `data-placeholder` is the load-bearing part. With it on the wrapper, "no
 * numeral anywhere inside this subtree" becomes a mechanical check that CI can
 * own -- see scripts/check-placeholders.mjs and `npm run check:placeholders`.
 * The previous control was a source comment saying the figures were invented.
 * It sat two lines above the invented figures for months, it was accurate, and
 * the panel still rendered a dollar amount and a tract count to the public.
 * A comment is not a control.
 *
 * The rules, all testable
 * -----------------------
 *  1. Every numeral becomes an em dash at the same metrics. Use <Em/>. Never
 *     delete the slot -- a deleted slot does not show the layout, which is the
 *     one job a placeholder has.
 *  2. The hatch (--tex-hatch) sits behind the whole panel, and it is the same
 *     hatch that will mean "unvalidated regime" and "not tested" elsewhere.
 *     One texture, one meaning, site-wide: THERE IS NO NUMBER HERE.
 *  3. PLACEHOLDER sits in the panel's own header, at --fs-body, bold, in
 *     full-strength ink. Never in the kicker or meta register -- that register
 *     is where the old disclaimer failed, being both the weakest type in the
 *     system and visually identical to decorative metadata beside it.
 *  4. A note is mandatory and says in words what the panel is. A hatch is a
 *     convention a first-time reader has not learned yet; a sentence is not.
 *  5. No data colour inside a placeholder. A drawn curve crops into a result,
 *     so a plot area with nothing behind it renders as <PlaceholderPlot/>:
 *     axes and legend rows survive because those are layout.
 *
 * Acceptance test: crop the panel anywhere, at any zoom. No crop may read as
 * a result. That is the test, not "is there a disclaimer".
 *
 * Not this register
 * -----------------
 * Redaction is the inverse and must not look like this: a redacted panel means
 * "this was produced, an identifier is withheld", so its numerals are real and
 * it carries no hatch. If those two registers ever look alike, a reader cannot
 * tell a withheld client name from an invented package, and that distinction
 * is the company's whole credibility position. Redaction is specified in
 * docs/design/placeholder-register.md and is not built yet.
 */

/** A numeral slot with no numeral in it. */
export function Em({ prefix, suffix }: { prefix?: string; suffix?: string }) {
  return (
    <span className="ph-em">
      {prefix}
      {"—"}
      {suffix}
    </span>
  );
}

export function Placeholder({
  label,
  note,
  children,
  bodyStyle,
}: {
  /** The panel's own label, in its own register. Keep it descriptive of the
   *  layout, not of a result: "simulation · scenario", not "philadelphia".
   *  No place name and no date -- a named place on a scenario card is a study
   *  a reader can believe we ran, with or without digits beside it. */
  label: string;
  /** Mandatory. One sentence, present tense, saying what the panel is and
   *  what it has never held. */
  note: string;
  children: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}) {
  /* There is deliberately no accent prop. A coloured top rule is how the old
     mock panels borrowed the authority of a real card, and an API that can
     express it is an API somebody will use. */
  return (
    <div data-placeholder>
      <div className="ph-head">
        <div className="kicker">{label}</div>
        {/* Not a pill, not muted, not 10px. See rule 3. */}
        <span className="ph-flag">PLACEHOLDER</span>
      </div>
      <div className="ph-body" style={bodyStyle}>
        {children}
      </div>
      <p className="ph-note">{note}</p>
    </div>
  );
}

/**
 * A plot area with no data behind it. Keeps the frame and whatever axis
 * furniture the caller draws; refuses the curve. `labels` are rendered as
 * em dashes at the axis positions so the reader can see that the chart has
 * axes without being told what they read.
 */
export function PlaceholderPlot({
  height = 140,
  children,
  ariaLabel,
}: {
  height?: number;
  children?: React.ReactNode;
  /** Say what the panel would show, and that it shows nothing. */
  ariaLabel: string;
}) {
  return (
    <div
      className="ph-plot"
      role="img"
      aria-label={ariaLabel}
      style={{ height, position: "relative" }}
    >
      {children}
    </div>
  );
}

/** A bar track with no bar in it. */
export function PlaceholderTrack({ height = 10 }: { height?: number }) {
  return <div className="ph-track" style={{ height }} aria-hidden />;
}

/**
 * A control rendered as layout rather than as a control. A slider that moves
 * but drives nothing is a dead control and an accessibility smell; a slider
 * drawn at rest says "this panel has a budget constraint on it" without
 * pretending to compute. aria-hidden because there is nothing here to operate.
 */
export function PlaceholderSlider() {
  return (
    <div aria-hidden style={{ position: "relative", height: 16, display: "flex", alignItems: "center" }}>
      <div className="ph-track" style={{ height: 4, width: "100%", borderRadius: 999 }} />
      <span
        style={{
          position: "absolute",
          left: "38%",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--rule)",
        }}
      />
    </div>
  );
}
