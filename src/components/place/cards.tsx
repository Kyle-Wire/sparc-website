import * as React from "react";
import Link from "next/link";
import { Em, Placeholder, PlaceholderPlot, PlaceholderTrack } from "@/components/system/placeholder";
import { RetryButton } from "./RetryButton";

/**
 * Cards for a place page.
 *
 * Two registers, kept visibly apart:
 *
 *   RecordCard   a fact read from a public register. The figure is real. Its
 *                footer names the publisher and the date, and that is its
 *                whole claim to authority: on-record cards carry a source, not
 *                a confidence class.
 *
 *   LockedShelf  the layout of a model result nobody has run. It is drawn with
 *                the site's placeholder register, so it has no digits in it
 *                and the design gates check that.
 *
 * See docs/design/site-redesign-brief.md, section 5.
 */

export type Hazard = "flood" | "heat" | "storm";

export function RecordCard({
  hazard,
  about,
  figure,
  figureNote,
  children,
  source,
  asOf,
  term,
}: {
  hazard: Hazard;
  /** What the card is about, in a few words. */
  about: string;
  /** The headline value, or omit for a card that only points at a map layer. */
  figure?: React.ReactNode;
  figureNote?: React.ReactNode;
  children: React.ReactNode;
  /** Publisher and dataset, as a reader would look it up. */
  source: string;
  /** A date or vintage for the record, in words. */
  asOf?: string;
  /** Anchor of this card's entry on /glossary, e.g. "flood-zone". */
  term?: string;
}) {
  return (
    <article className="record-card" data-hazard={hazard}>
      <div className="record-top">
        <div className="kicker">{about}</div>
        {term && (
          <Link className="record-term" href={{ pathname: "/glossary", hash: term }}>
            What is this?
          </Link>
        )}
      </div>
      {figure !== undefined && (
        <div className="record-figure">
          <span className="record-figure-value">{figure}</span>
          {figureNote && <span className="record-figure-note">{figureNote}</span>}
        </div>
      )}
      <div className="record-body">{children}</div>
      <footer className="record-source">
        <span className="record-basis">On record</span>
        <span>
          {source}
          {asOf ? ` · ${asOf}` : ""}
        </span>
      </footer>
    </article>
  );
}

/** A register that did not answer. The card keeps its place so the reader can
 *  see what is missing, and says so in a sentence. */
export function MissingCard({
  hazard,
  about,
  reason,
  source,
  final,
}: {
  hazard: Hazard;
  about: string;
  reason: string;
  source: string;
  /** The source does not cover this place; asking again will not help. */
  final?: boolean;
}) {
  return (
    <article className="record-card record-card-missing" data-hazard={hazard}>
      <div className="kicker">{about}</div>
      <div className="record-body">
        <p>
          <strong>{final ? "Not available for this place." : "No answer right now."}</strong> {reason}
        </p>
        {!final && <RetryButton />}
      </div>
      <footer className="record-source">
        <span className="record-basis">{final ? "Not covered" : "Not loaded"}</span>
        <span>{source}</span>
      </footer>
    </article>
  );
}

function Slot({ label, track }: { label: string; track?: boolean }) {
  return (
    <div className="shelf-slot">
      <span>{label}</span>
      {track ? <PlaceholderTrack height={8} /> : null}
      <span className="shelf-slot-value">
        <Em />
      </span>
    </div>
  );
}

export type ShelfKind = "flood-model" | "flood-whatif" | "heat-model" | "heat-whatif";

const SHELVES: Record<
  ShelfKind,
  { label: string; note: string; plot?: string; slots: string[]; tracks?: boolean }
> = {
  "flood-model": {
    label: "flood model · storm run",
    note: "Layout only. No flood model has been run for this place, so there are no numbers here. A run covers the neighbourhood around the property, street by street.",
    plot: "Where a map of peak water depth would go. Nothing has been modelled, so nothing is drawn.",
    slots: ["Deepest water beside the house", "Water on the street in front", "Nearest deeper water", "How it changes from storm to storm"],
  },
  "flood-whatif": {
    label: "what if · projects you can do",
    note: "Layout only. Nothing has been modelled. A what-if run shows what a project is likely to change in the model, with its margins. It is not a promise.",
    slots: ["Rain garden", "French drain", "Paving removed", "Rain barrels"],
    tracks: true,
  },
  "heat-model": {
    label: "heat model · air and comfort",
    note: "Layout only. No heat model has been run for this place, so there are no numbers here. A run covers the neighbourhood, by day and by night.",
    plot: "Where a map of outdoor comfort in sun and shade would go. Nothing has been modelled, so nothing is drawn.",
    slots: ["Surface temperature against the neighbourhood", "Street air, afternoon", "Street air, night", "Outdoor comfort, sun against shade"],
  },
  "heat-whatif": {
    label: "what if · projects you can do",
    note: "Layout only. Nothing has been modelled. A what-if run shows the likely change across the neighbourhood, with its margins. It is not a promise.",
    slots: ["Trees planted", "Paving removed", "Cool roof", "Cool pavement"],
    tracks: true,
  },
};

/** A paid shelf, drawn as layout. `cta` adds the request link under it. */
export function LockedShelf({ kind, cta = true }: { kind: ShelfKind; cta?: boolean }) {
  const s = SHELVES[kind];
  return (
    <div className="shelf-locked">
      <Placeholder label={s.label} note={s.note}>
        {s.plot && <PlaceholderPlot height={120} ariaLabel={s.plot} />}
        <div className="shelf-slots" style={s.plot ? { marginTop: 14 } : undefined}>
          {s.slots.map((label) => (
            <Slot key={label} label={label} track={s.tracks} />
          ))}
        </div>
      </Placeholder>
      {cta && (
        <p className="shelf-cta">
          Paid, and not on sale yet. For now a report is run by hand on request.{" "}
          <Link href="/contact">Ask for a report</Link>
        </p>
      )}
    </div>
  );
}

/**
 * The block beside the area around it, as two bars on one scale of 0 to 100
 * percent. The block's bar comes first and is the darker one; each bar has
 * its label and its figure in words, so nothing depends on the shade.
 */
export function ShareBars({ block, around }: { block: number; around: number }) {
  const rows = [
    { label: "This block", value: block, self: true },
    { label: "The square kilometre around it", value: around, self: false },
  ];
  return (
    <div className="share-bars" role="img" aria-label={`This block ${Math.round(block)} percent; the square kilometre around it ${Math.round(around)} percent.`}>
      {rows.map((r) => (
        <div key={r.label} className="share-bar">
          <span>{r.label}</span>
          <span className="share-track">
            <span data-self={r.self ? "true" : undefined} style={{ width: `${Math.max(0, Math.min(100, r.value))}%` }} />
          </span>
          <strong>{Math.round(r.value)}%</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Where the block's ground sits between the lowest and highest surface in the
 * square kilometre around it: a band from low to high with two marks, the
 * area's typical height (hollow) and the block's (solid).
 */
export function HeightBand({ low, high, around, block }: { low: number; high: number; around: number; block: number }) {
  const span = high - low;
  const at = (v: number) => (span > 0 ? Math.max(0, Math.min(100, ((v - low) / span) * 100)) : 50);
  const ft = (v: number) => `${Math.round(v)} ft`;
  return (
    <div className="height-band" role="img" aria-label={`The block's typical ground is ${ft(block)}; the area's is ${ft(around)}; the area runs from ${ft(low)} to ${ft(high)}.`}>
      <div className="height-track">
        <span className="height-mark height-mark-around" style={{ left: `${at(around)}%` }} />
        <span className="height-mark height-mark-block" style={{ left: `${at(block)}%` }} />
      </div>
      <div className="height-ends">
        <span>lowest {ft(low)}</span>
        <span>highest {ft(high)}</span>
      </div>
      <div className="height-key">
        <span><i className="height-mark height-mark-block" /> this block, {ft(block)}</span>
        <span><i className="height-mark height-mark-around" /> typical for the area, {ft(around)}</span>
      </div>
    </div>
  );
}

/**
 * FEMA's five-step rating as a row of five squares. Length carries the rank
 * and the rating word sits beside it, so nothing depends on colour. A hazard
 * FEMA does not rate shows the word alone.
 */
export function RatingBar({ rank }: { rank: number }) {
  if (rank < 1) return <span className="rating-bar rating-bar-none" aria-hidden />;
  return (
    <span className="rating-bar" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} data-on={i <= rank ? "true" : undefined} />
      ))}
    </span>
  );
}

export function ShelfHead({ name, state }: { name: string; state: "free" | "paid" | "coming" }) {
  const words = { free: "Free", paid: "Paid · not on sale yet", coming: "Coming" }[state];
  return (
    <div className="shelf-head">
      <h3>{name}</h3>
      <span className="shelf-state" data-state={state}>
        {words}
      </span>
    </div>
  );
}
