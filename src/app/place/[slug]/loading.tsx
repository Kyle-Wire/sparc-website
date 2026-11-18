import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker } from "@/components/marketing/page-shell";

// Shown while a place page asks the registers. A first visit to a place takes
// a few seconds, because each source is asked live; later visits are quick.
// This screen names who is being asked. It states no result.

const ASKING = [
  "The Census Bureau, for the tract and county",
  "FEMA, for flood zones, claims, declarations and hazard ratings",
  "USGS, for the ground's height",
  "The national land cover survey, for trees and paving",
  "NOAA's hurricane record, for storm tracks",
];

export default function PlaceLoading() {
  return (
    <>
      <Nav active="home" />
      <section className="place-head">
        <div className="wrap">
          <Kicker dot dotColor="var(--flood)">on the public record</Kicker>
          <h1>Reading the record for this place…</h1>
          <p className="lead">
            Each source is asked now, so what you see is what it holds today. This takes a few seconds the
            first time a place is looked up.
          </p>
          <ul className="place-loading" aria-live="polite">
            {ASKING.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </>
  );
}
