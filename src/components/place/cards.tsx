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

export type Hazard = "flood" | "heat" | "storm" | "ground" | "wind";

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

/** A register still being asked. It holds the card's place so nothing jumps
 *  when the answer arrives, names who is being asked, and states no result. */
export function PendingCard({ hazard, about, who, source }: { hazard: Hazard; about: string; who: string; source: string }) {
  return (
    <article className="record-card record-card-pending" data-hazard={hazard} aria-busy="true">
      <div className="kicker">{about}</div>
      <div className="record-body">
        <p>
          <strong>Asking {who} now.</strong> This card fills in when it answers.
        </p>
      </div>
      <footer className="record-source">
        <span className="record-basis">Asking</span>
        <span>{source}</span>
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

export type ShelfKind =
  | "flood-model" | "flood-whatif"
  | "heat-model" | "heat-whatif"
  | "ground-model" | "ground-whatif"
  | "wind-model";

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
    note: "Layout only. Nothing has been modelled. A what-if run shows what a project changes in the model, with the spread across its test runs. It is not a measurement or a promise.",
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
    note: "Layout only. Nothing has been modelled. A what-if run shows the change across the neighbourhood in the model, with its range. It is not a measurement or a promise.",
    slots: ["Trees planted", "Paving removed", "Cool roof", "Cool pavement"],
    tracks: true,
  },
  "ground-model": {
    label: "ground movement · measured from radar",
    note: "Layout only. No radar has been processed for this place, so there are no numbers here. A reading describes the ground around the property, not the house, set against a near ring and a wide ring around it.",
    plot: "Where a map of ground movement would go. Nothing has been measured, so nothing is drawn.",
    slots: ["With its surroundings or on its own", "Steady, or new from a given year", "Seasonal swing, research", "Where the satellite cannot see"],
  },
  "ground-whatif": {
    label: "what if · ten years ahead",
    note: "Layout only. Nothing has been measured. The ground at the property against its wide surroundings, carried forward ten years with a band that widens. It is a projection of a measurement, not a forecast, and it names no point at which damage begins.",
    plot: "Where the record of movement over the years, and the band carried forward, would go. Nothing has been measured, so nothing is drawn.",
    slots: ["Ten years ahead, against the wide ring", "How wide the band grows"],
  },
  "wind-model": {
    label: "wind model · through the seasons",
    note: "Layout only. No wind model has been run for this place, so there are no numbers here. A run shows how wind moves between the buildings, season by season.",
    plot: "Where a map of wind through the neighbourhood would go. Nothing has been modelled, so nothing is drawn.",
    slots: ["Wind by season", "Where buildings may funnel it", "Gusts at street level", "Gusts at roof level"],
  },
};

/** Which hazard each shelf belongs to, for the request link. */
const SHELF_HAZARD: Record<ShelfKind, string> = {
  "flood-model": "flood",
  "flood-whatif": "flood",
  "heat-model": "heat",
  "heat-whatif": "heat",
  "ground-model": "ground",
  "ground-whatif": "ground",
  "wind-model": "wind",
};

/** A paid shelf, drawn as layout. `cta` adds the request link under it. */
export function LockedShelf({ kind, cta = true, place }: { kind: ShelfKind; cta?: boolean; place?: string }) {
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
          <Link href={{ pathname: "/start", query: place ? { place, hazard: SHELF_HAZARD[kind] } : { hazard: SHELF_HAZARD[kind] } }}>
            Ask for a report
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * A hazard's paid shelves, folded into one strip: each shelf's name and what
 * a run would give, in words, and one way to ask for it. The placeholder
 * panels (LockedShelf) open from the strip on a click, so the layout is still
 * there for anyone who wants to see it but no longer fills the page.
 *
 * The strip holds no figure and is not a placeholder panel: it describes a
 * product, it does not depict a readout. See docs/design/cabinet-frame.md.
 */
export function PaidStrip({ shelves, place, hazard }: { shelves: { name: string; kind: ShelfKind }[]; place: string; hazard: string }) {
  return (
    <div className="paid-strip">
      <div className="paid-strip-row" style={{ "--shelves": shelves.length } as React.CSSProperties}>
        {shelves.map((sh) => (
          <div key={sh.kind} className="paid-strip-shelf">
            <span className="paid-strip-name">
              {sh.name}
              <span className="pill" data-state="later">Paid · not run</span>
            </span>
            <p>{SHELVES[sh.kind].slots.join(" · ")}</p>
          </div>
        ))}
        <Link href={{ pathname: "/start", query: { place, hazard } }} className="btn btn-accent btn-sm">
          Ask for a report <span className="arrow">→</span>
        </Link>
      </div>
      <details className="paid-strip-more">
        <summary>See the layout a run would fill</summary>
        <div className="shelf-pair" style={shelves.length === 1 ? { gridTemplateColumns: "minmax(0, 1fr)" } : undefined}>
          {shelves.map((sh) => (
            <LockedShelf key={sh.kind} kind={sh.kind} cta={false} />
          ))}
        </div>
      </details>
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
