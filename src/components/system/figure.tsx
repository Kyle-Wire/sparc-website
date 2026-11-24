import * as React from "react";

/**
 * A figure, with a caption that is not optional.
 *
 *   A figure says what it is, in words, at body size.
 *
 * This is the §4.4 failure written as a positive rule. A panel on /product
 * carried an accurate disclaimer for months and still read as a result,
 * because the disclaimer rendered at 10px mono --muted -- the weakest register
 * in the system, and visually identical to the decorative metadata beside it on
 * the same page -- while the claim it qualified rendered in body copy at full
 * strength. A reader had no way to tell a disclaimer from a timestamp. The
 * design was what made the false claim read as true.
 *
 * So:
 *
 *  - The caption is REQUIRED. A figure a reader has to interpret unaided is a
 *    figure they will interpret generously, and on this site generously means
 *    wrongly.
 *  - It renders at --fs-body, which type-scale.md §3 fixes as the floor for any
 *    honesty label, in full-measure ink, under a structural rule.
 *  - THERE IS NO className OR style PROP. That is the whole mechanism: a
 *    caption cannot be made smaller, lighter or greyer at a call site, which is
 *    exactly how the last one arrived at 10px muted mono. If a caption needs a
 *    different treatment, that is a change to the register, in one file, with a
 *    reason -- not a prop.
 *  - The caption sits BELOW the figure, with the subject as its first line.
 *    Printed-page order: a reader meets the figure, then the sentence that says
 *    what it is. A label floating above a frame is chrome; a caption under it
 *    is content.
 *
 * Not this component
 * ------------------
 * A placeholder panel is not a captioned figure, and the two must not be
 * confused: <Placeholder> carries its own mandatory note plus the hatch and the
 * PLACEHOLDER flag, because "this has never held a result" is a stronger
 * statement than a caption and needs a stronger register. Use <Figure> for a
 * figure that is real and needs explaining. Use <Placeholder> for a panel that
 * has nothing behind it. A panel that is both is a <Placeholder>.
 */

export function Figure({
  of,
  caption,
  children,
}: {
  /** What the figure is, in a few words. Renders as the caption's first line,
   *  in full ink. */
  of: string;
  /** Required. One or two sentences: what the reader is looking at, and what it
   *  is not. Plain text or inline elements -- a caption is prose, so it is not
   *  a slot for a layout. */
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="fig">
      {children}
      <figcaption>
        <span className="fig-of">{of}</span>
        {caption}
      </figcaption>
    </figure>
  );
}
