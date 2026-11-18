import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker } from "@/components/marketing/page-shell";
import { PlaceActions } from "@/components/place/PlaceActions";
import { PlaceMap, type TrackLine } from "@/components/place/PlaceMap";
import { HeightBand, LockedShelf, MissingCard, PendingCard, RatingBar, RecordCard, ShareBars, ShelfHead } from "@/components/place/cards";
import { GlanceRow } from "@/components/place/glance";
import { Questions } from "@/components/place/questions";
import { KM_PER_MILE, parsePlaceSlug } from "@/lib/place/coords";
import type { NearbyStorm } from "@/lib/place/hurricanes";
import type { Lookup } from "@/lib/place/lookup";
import type { TractRisk } from "@/lib/place/nri";
import { claimsNotLocatedPct, type CountyDeclarations, type TractClaims } from "@/lib/place/openfema";
import type { FloodZones } from "@/lib/place/fema";
import { finishPlace, glanceOf, startPlace } from "@/lib/place/summary";
import type { Ground, LandCover } from "@/lib/place/surroundings";

// A place page: everything on the public record about the neighbourhood
// around a block, and the layout of what paying would add.
//
// What may appear in a record card: a value read from a public register, the
// register's own words for it, and its source and date. No card interprets a
// record as safe or unsafe, and nothing here is SPARC Labs model output. The
// sentences around each value are templates in this file; the values come
// from src/lib/place. See docs/design/site-redesign-brief.md.
//
// The page address is a block, never a house (src/lib/place/coords.ts).

type Props = { params: Promise<{ slug: string }> };

const FEMA_SOURCE = "FEMA, National Flood Hazard Layer";
const CLAIMS_SOURCE = "FEMA, National Flood Insurance Program claims (OpenFEMA)";
const DECLARATIONS_SOURCE = "FEMA, Disaster Declarations Summaries (OpenFEMA)";
const RISK_SOURCE = "FEMA, National Risk Index";
const COVER_SOURCE = "National Land Cover Database 2021, USGS and partners (MRLC)";
const GROUND_SOURCE = "USGS, 3D Elevation Program";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = parsePlaceSlug(slug);
  return {
    title: place ? "A place on the public record" : "Place not found",
    // One page per block of the country is not something to put in a search index.
    robots: { index: false, follow: false },
  };
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Waits for one lookup inside a Suspense boundary, so the rest of the page
 *  is sent first and this part follows when its source answers. */
async function Later<T>({ value, children }: { value: Promise<T>; children: (v: T) => ReactNode }) {
  return <>{children(await value)}</>;
}

/** "our copy of November 17, 2026", for a record read from the site's own copy of a FEMA table. */
function copyNote(copied: string | null): string | undefined {
  return copied ? `our copy of ${longDate(copied)}` : undefined;
}

function joinNotes(...parts: (string | undefined)[]): string | undefined {
  const kept = parts.filter(Boolean);
  return kept.length ? kept.join(" · ") : undefined;
}

function miles(km: number): number {
  return Math.round(km / KM_PER_MILE);
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function stormLine(s: NearbyStorm): string {
  const who = s.name ? `${s.name}, ${s.year}` : `Unnamed storm, ${s.year}`;
  const what = s.categoryNearby > 0 ? `category ${s.categoryNearby} hurricane` : s.statusNearby;
  const where = s.closestKm < 2 ? "over this place" : `${miles(s.closestKm)} mi away`;
  return `${who}: ${what} at its nearest point, ${where}`;
}

function ClaimsCard({ res, tractName }: { res: Lookup<TractClaims>; tractName: string }) {
  if (!res.ok) return <MissingCard hazard="flood" about="Flood insurance claims nearby" reason={res.reason} source={CLAIMS_SOURCE} />;
  const c = res.data;
  const notLocated = claimsNotLocatedPct();
  const caveat = (
    <p className="record-aside">
      Only homes insured through the National Flood Insurance Program can make a claim, so a low count does not
      mean no flooding. Claims are published by census area, never by address
      {notLocated !== null && notLocated > 0
        ? `, and FEMA has not placed about ${notLocated}% of all claims nationwide in any census area, so those are counted nowhere`
        : ""}
      .
    </p>
  );
  if (c.total === 0) {
    return (
      <RecordCard hazard="flood" about="Flood insurance claims nearby" term="flood-insurance-claim" figure="0" figureNote={`claims on record in ${tractName}`} source={CLAIMS_SOURCE} asOf={copyNote(c.copied)}>
        <p>No flood insurance claim is on record in the census tract around this place.</p>
        {caveat}
      </RecordCard>
    );
  }
  const busiest = c.busiestYears.map((y) => `${y.year} (${y.claims})`);
  return (
    <RecordCard
      hazard="flood"
      about="Flood insurance claims nearby"
      term="flood-insurance-claim"
      figure={`${c.atLeast ? "over " : ""}${c.total.toLocaleString("en-US")}`}
      figureNote={`${c.total === 1 ? "claim" : "claims"} on record in ${tractName}`}
      source={CLAIMS_SOURCE}
      asOf={joinNotes(c.firstYear && c.lastYear ? `${c.firstYear} to ${c.lastYear}` : undefined, copyNote(c.copied))}
    >
      <p>
        Flood insurance claims were made in this census tract in {c.yearsWithClaims}{" "}
        {c.yearsWithClaims === 1 ? "year" : "different years"}
        {c.firstYear && c.lastYear && c.firstYear !== c.lastYear ? `, from ${c.firstYear} to ${c.lastYear}` : c.lastYear ? `, ${c.lastYear}` : ""}.
        {busiest.length > 1 ? ` The years with the most were ${list(busiest)}.` : ""}
      </p>
      {caveat}
    </RecordCard>
  );
}

function DeclarationsCard({ res, countyName }: { res: Lookup<CountyDeclarations>; countyName: string }) {
  if (!res.ok) return <MissingCard hazard="storm" about="Federal disaster declarations" reason={res.reason} source={DECLARATIONS_SOURCE} />;
  const d = res.data;
  const shown = d.byType.slice(0, 4).map((t) => `${t.type.toLowerCase()} ${t.count}`);
  const types = d.byType.length > 4 ? `${shown.join(", ")}, and other types` : list(shown);
  return (
    <RecordCard
      hazard="storm"
      about="Federal disaster declarations"
      term="disaster-declaration"
      figure={d.total.toLocaleString("en-US")}
      figureNote={`for ${countyName}${d.firstYear ? ` since ${d.firstYear}` : ""}`}
      source={DECLARATIONS_SOURCE}
      asOf={copyNote(d.copied)}
    >
      {d.total > 0 ? (
        <>
          <p>By FEMA&apos;s own type: {types}.</p>
          <p>Most recent, with FEMA&apos;s type and the date declared:</p>
          <ul>
            {d.recent.map((r) => (
              <li key={`${r.date}-${r.title}`}>
                {r.title} ({r.type.toLowerCase()}), {longDate(r.date)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>FEMA lists no disaster declaration for this county.</p>
      )}
      <p className="record-aside">
        A declaration covers the whole county, not this block. Public-health declarations are left out.
      </p>
    </RecordCard>
  );
}

function GroundCard({ res }: { res: Lookup<Ground> }) {
  if (!res.ok) return <MissingCard hazard="flood" about="Ground height" reason={res.reason} final={res.final} source={GROUND_SOURCE} />;
  const g = res.data;
  const diff = g.blockFt - g.neighbourhoodFt;
  const size = Math.abs(diff);
  const level = size < 1;
  const lower = Math.round(g.lowerSharePct);
  return (
    <RecordCard
      hazard="flood"
      about="Ground height"
      figure={level ? "Level" : `${size.toFixed(size < 10 ? 1 : 0)} ft ${diff > 0 ? "higher" : "lower"}`}
      figureNote={level ? "with the typical ground around it" : "than the typical ground around it"}
      source={GROUND_SOURCE}
      term="ground-height"
    >
      <p>
        The block&apos;s ground is typically {Math.round(g.blockFt)} ft; across the square kilometre around it the
        typical figure is {Math.round(g.neighbourhoodFt)} ft. About {lower}% of that area lies lower than the
        block and about {100 - lower}% lies higher.
      </p>
      <HeightBand low={g.lowFt} high={g.highFt} around={g.neighbourhoodFt} block={g.blockFt} />
      <p className="record-aside">
        Height alone does not say where water goes; that takes a model of the streets. Open water in the
        area is counted at its surface. Click the map to read the height of any one spot.
      </p>
    </RecordCard>
  );
}

function CoverCards({ res }: { res: Lookup<LandCover> }) {
  if (!res.ok) {
    return <MissingCard hazard="heat" about="Tree canopy and paving" reason={res.reason} final={res.final} source={COVER_SOURCE} />;
  }
  const { canopy, paving } = res.data;
  const aside = (
    <p className="record-aside">
      An average of the survey&apos;s cells over the block and over the square kilometre around it. Open water
      counts as neither trees nor paving. The map layer above shows the pattern.
    </p>
  );
  return (
    <>
      <RecordCard
        hazard="heat"
        about="Tree canopy"
        figure={`${Math.round(canopy.block)}%`}
        figureNote="of the block is under tree canopy"
        source={COVER_SOURCE}
        asOf="2021"
        term="tree-canopy"
      >
        <ShareBars block={canopy.block} around={canopy.neighbourhood} />
        {aside}
      </RecordCard>
      <RecordCard
        hazard="heat"
        about="Paving and buildings"
        figure={`${Math.round(paving.block)}%`}
        figureNote="of the block is paved or built on"
        source={COVER_SOURCE}
        asOf="2021"
        term="paving"
      >
        <ShareBars block={paving.block} around={paving.neighbourhood} />
        {aside}
      </RecordCard>
    </>
  );
}

function RiskCard({ res, tractName }: { res: Lookup<TractRisk>; tractName: string }) {
  if (!res.ok) return <MissingCard hazard="storm" about="FEMA's rating of every hazard" reason={res.reason} source={RISK_SOURCE} />;
  const r = res.data;
  const rated = r.hazards.filter((h) => h.rank > 0);
  const unrated = r.hazards.filter((h) => h.rank === 0);
  return (
    <RecordCard
      hazard="storm"
      about="FEMA's rating of every hazard"
      term="risk-index"
      figure={r.overall.rating}
      figureNote={`all hazards together, for ${tractName}`}
      source={RISK_SOURCE}
      asOf={joinNotes(r.version ? `version ${r.version}` : undefined, copyNote(r.copied))}
    >
      <p>
        FEMA rates each census tract in the country for eighteen natural hazards, from very low to very
        high. For this tract:
      </p>
      <ul className="rating-list">
        {rated.map((h) => (
          <li key={h.hazard}>
            <span>{h.hazard}</span>
            <RatingBar rank={h.rank} />
            <strong>{h.rating}</strong>
          </li>
        ))}
      </ul>
      {unrated.length > 0 && (
        <p className="record-aside">
          No rating from FEMA here for: {unrated.map((h) => h.hazard.toLowerCase()).join(", ")}.
        </p>
      )}
      <p className="record-aside">
        This is FEMA&apos;s rating of the census tract as a community, set against every other tract. It is not
        a rating of a house, and two homes in one tract get the same rating.
      </p>
    </RecordCard>
  );
}

function ZoneCard({ zones }: { zones: Lookup<FloodZones> }) {
  const sfha = zones.ok ? zones.data.zones.filter((z) => z.inSfha) : [];
  return zones.ok ? (
    zones.data.zones.length === 0 ? (
      <RecordCard hazard="flood" about="FEMA flood zone" figure="Not mapped" source={FEMA_SOURCE}>
        <p>FEMA&apos;s digital flood map has no zone for this block. Not every part of the country is in it.</p>
      </RecordCard>
    ) : (
      <RecordCard
        hazard="flood"
        about="FEMA flood zone"
        term="flood-zone"
        figure={`Zone ${zones.data.zones[0].code}`}
        figureNote={
          zones.data.zones.length > 1
            ? `and ${zones.data.zones.length - 1} more on this block`
            : (zones.data.zones[0].subtype ?? undefined)
        }
        source={FEMA_SOURCE}
        asOf={zones.data.panelDate ? `map panel effective ${longDate(zones.data.panelDate)}` : undefined}
      >
        {zones.data.zones.length === 1 ? (
          <p>
            FEMA&apos;s flood map puts this block in Zone {zones.data.zones[0].code}
            {zones.data.zones[0].subtype ? ` (${zones.data.zones[0].subtype.toLowerCase()})` : ""}.{" "}
            {sfha.length
              ? "FEMA classes it as a Special Flood Hazard Area."
              : "FEMA does not class it as a Special Flood Hazard Area."}
          </p>
        ) : (
          <>
            <p>FEMA&apos;s flood map shows more than one zone on this block:</p>
            <ul>
              {zones.data.zones.map((z) => (
                <li key={`${z.code}-${z.subtype ?? ""}`}>
                  Zone {z.code}
                  {z.subtype ? `, ${z.subtype.toLowerCase()}` : ""}
                  {z.inSfha ? " (Special Flood Hazard Area)" : ""}
                </li>
              ))}
            </ul>
            <p>
              {sfha.length
                ? "Part of the block is in FEMA's Special Flood Hazard Area. "
                : "None of them is a Special Flood Hazard Area. "}
              The map above shows where the lines fall.
            </p>
          </>
        )}
        <p className="record-aside">
          A flood zone is FEMA&apos;s map of flood hazard for insurance and building rules. It is
          context, not a forecast for one house.
        </p>
      </RecordCard>
    )
  ) : (
    <MissingCard hazard="flood" about="FEMA flood zone" reason={zones.reason} source={FEMA_SOURCE} />
  );
}

export default async function PlacePage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const place = parsePlaceSlug(rawSlug);
  if (!place) notFound();
  const slug = decodeURIComponent(rawSlug);

  // The fast records are awaited here; FEMA's flood map, ground height and
  // land cover are still being asked and each fills its own card below.
  const start = await startPlace(place);
  const record = finishPlace(start);
  const { areas, claims, declarations, risk, storms } = start;
  const early = glanceOf(start, null);
  const where = early.where;
  const tractName = areas.ok ? areas.data.tractName : "this census tract";
  const countyName = areas.ok ? areas.data.countyName : "this county";

  const tracks: TrackLine[] = storms.storms.map((s) => ({
    id: s.id,
    label: s.name ? `${s.name} ${s.year}` : `Unnamed ${s.year}`,
    lines: s.lines,
  }));

  return (
    <>
      <Nav active="home" />

      <section className="place-head">
        <div className="wrap">
          <Kicker dot dotColor="var(--flood)">
            on the public record{areas.ok ? ` · ${tractName}, ${countyName}` : ""}
          </Kicker>
          <h1>A block in {where}</h1>
          <p className="lead">
            What public registers hold about flood, storms, sea level and land cover around this place. The
            page shows the neighbourhood, not a house, and its address carries the block only.
          </p>
          <Suspense fallback={<GlanceRow glance={early} linked zonePending />}>
            <Later value={record}>
              {(r) => (
                <>
                  <PlaceActions slug={slug} glance={r.glance} />
                  <GlanceRow glance={r.glance} linked />
                </>
              )}
            </Later>
          </Suspense>
          <div className="place-paid-cta">
            <span>
              <strong>What could happen here?</strong> Flood, heat, ground movement and wind, modelled for this
              neighbourhood. Paid, and not on sale yet.
            </span>
            <Link href={{ pathname: "/start", query: { place: slug } }} className="btn btn-accent btn-sm">
              Get a report or run it yourself <span className="arrow">→</span>
            </Link>
          </div>
          <div className="place-jump">
            <span className="kicker">on this page</span>
            <a href="#map">Map</a>
            <a href="#flood">Flood and storms</a>
            <a href="#heat">Heat</a>
            <a href="#ground">Ground</a>
            <a href="#wind">Wind</a>
            <a href="#hazards">Every hazard</a>
            <a href="#questions">Questions to take with you</a>
            <a href="#sources">Sources</a>
            <Link href="/glossary">What the words mean</Link>
            <Link href="/">Look up another address</Link>
          </div>
        </div>
      </section>

      <section id="map" className="place-map-section">
        <div className="wrap-wide">
          <PlaceMap slug={slug} place={place} tracks={tracks} />
        </div>
      </section>

      <section id="flood" className="hazard-row">
        <div className="wrap">
          <Kicker>hazard</Kicker>
          <h2>
            <span className="hazard-mark" data-hazard="flood" aria-hidden />
            Flood and storms
          </h2>
          <p className="lead">FEMA&apos;s flood map, what has been claimed and declared nearby, and the storms that have passed.</p>

          <div className="shelf">
            <ShelfHead name="On record" state="free" />
            <div className="shelf-cards">
              <Suspense fallback={<PendingCard hazard="flood" about="FEMA flood zone" who="FEMA's flood map" source={FEMA_SOURCE} />}>
                <Later value={start.zones}>{(zones) => <ZoneCard zones={zones} />}</Later>
              </Suspense>

              <Suspense fallback={<PendingCard hazard="flood" about="Ground height" who="USGS" source={GROUND_SOURCE} />}>
                <Later value={start.ground}>{(ground) => <GroundCard res={ground} />}</Later>
              </Suspense>
              <ClaimsCard res={claims} tractName={tractName} />
              <DeclarationsCard res={declarations} countyName={countyName} />

              <RecordCard
                hazard="storm"
                about="Tropical storms and hurricanes"
                term="storm-track"
                figure={storms.total.toLocaleString("en-US")}
                figureNote={`tracked within ${storms.radiusKm} km (${miles(storms.radiusKm)} miles)`}
                source="NOAA National Hurricane Center, HURDAT2 best tracks"
                asOf={storms.record}
              >
                {storms.total > 0 ? (
                  <>
                    <p>
                      {storms.hurricanesNearby === 0
                        ? "None was at hurricane strength at its nearest point."
                        : `${storms.hurricanesNearby} ${storms.hurricanesNearby === 1 ? "was" : "were"} at hurricane strength at the nearest point.`}{" "}
                      The count includes depressions and the remnants of storms. Most recent:
                    </p>
                    <ul>
                      {storms.storms.slice(0, 6).map((s) => (
                        <li key={s.id}>{stormLine(s)}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>NOAA&apos;s record has no tropical storm or hurricane track this close to the place.</p>
                )}
                <p className="record-aside">
                  A track is the path of the storm&apos;s centre. Rain and wind reach far from it, so distance from
                  a track is not a measure of what this block got.
                </p>
              </RecordCard>

              <RecordCard hazard="flood" about="Sea level rise" term="sea-level-rise" source="NOAA Office for Coastal Management, Sea Level Rise Viewer data">
                <p>
                  NOAA maps where the sea would reach at the highest tides if it stood 1, 3 or 6 feet above
                  today&apos;s high-tide line. Switch the layer on in the map above to see whether that water
                  reaches this neighbourhood. Inland, the layer is empty.
                </p>
                <p className="record-aside">
                  NOAA describes its map as a screening-level tool. It does not account for erosion, sinking
                  ground or future construction. This card is a map layer only; the site makes no statement
                  about this block from it.
                </p>
              </RecordCard>
            </div>
          </div>

          <div className="shelf shelf-pair">
            <div>
              <ShelfHead name="Modelled" state="paid" />
              <LockedShelf kind="flood-model" place={slug} />
            </div>
            <div>
              <ShelfHead name="What if" state="paid" />
              <LockedShelf kind="flood-whatif" place={slug} />
            </div>
          </div>
        </div>
      </section>

      <section id="heat" className="hazard-row">
        <div className="wrap">
          <Kicker>hazard</Kicker>
          <h2>
            <span className="hazard-mark" data-hazard="heat" aria-hidden />
            Heat
          </h2>
          <p className="lead">How much of the block is trees and how much is paving, set against the area around it, and what a model would add.</p>

          <div className="shelf">
            <ShelfHead name="On record" state="free" />
            <div className="shelf-cards">
              <Suspense fallback={<PendingCard hazard="heat" about="Tree canopy and paving" who="the land cover survey" source={COVER_SOURCE} />}>
                <Later value={start.cover}>{(cover) => <CoverCards res={cover} />}</Later>
              </Suspense>
            </div>
          </div>

          <div className="shelf shelf-pair">
            <div>
              <ShelfHead name="Modelled" state="paid" />
              <LockedShelf kind="heat-model" place={slug} />
            </div>
            <div>
              <ShelfHead name="What if" state="paid" />
              <LockedShelf kind="heat-whatif" place={slug} />
            </div>
          </div>
        </div>
      </section>

      <section id="hazards" className="hazard-row">
        <div className="wrap">
          <Kicker>every hazard</Kicker>
          <h2>What else FEMA rates here</h2>
          <p className="lead">Wildfire, earthquake, tornado, heat wave and the rest, as FEMA rates them for the area.</p>
          <div className="shelf">
            <ShelfHead name="On record" state="free" />
            <div className="shelf-cards shelf-cards-one">
              <RiskCard res={risk} tractName={tractName} />
            </div>
          </div>
        </div>
      </section>

      <section id="questions" className="hazard-row">
        <div className="wrap">
          <Kicker>what to do with this</Kicker>
          <h2>Questions to take with you</h2>
          <p className="lead">
            Chosen from what the record shows for this place. They are questions for people who can answer
            them, not advice.
          </p>
          <Suspense fallback={<p className="shelf-empty">The questions are chosen once every source has answered.</p>}>
            <Later value={record}>{(r) => <Questions record={r} />}</Later>
          </Suspense>
        </div>
      </section>

      <section id="ground" className="hazard-row">
        <div className="wrap">
          <Kicker>hazard · coming</Kicker>
          <h2>
            <span className="hazard-mark" data-hazard="ground" aria-hidden />
            Ground movement
          </h2>
          <p className="lead">
            Whether the ground is sinking or shifting, measured from satellite radar over years, and the measured
            rate carried forward.
          </p>
          <div className="shelf">
            <ShelfHead name="On record" state="coming" />
            <p className="shelf-empty">
              No public register of ground movement is on this page yet. Which one to show, if any, has not been
              decided.
            </p>
          </div>
          <div className="shelf shelf-pair">
            <div>
              <ShelfHead name="Measured" state="paid" />
              <LockedShelf kind="ground-model" place={slug} />
            </div>
            <div>
              <ShelfHead name="What if" state="paid" />
              <LockedShelf kind="ground-whatif" place={slug} />
            </div>
          </div>
        </div>
      </section>

      <section id="wind" className="hazard-row">
        <div className="wrap">
          <Kicker>hazard · coming</Kicker>
          <h2>
            <span className="hazard-mark" data-hazard="wind" aria-hidden />
            Wind
          </h2>
          <p className="lead">How wind moves through the neighbourhood across the seasons, as a map.</p>
          <div className="shelf shelf-pair">
            <div>
              <ShelfHead name="On record" state="free" />
              <p className="shelf-empty">
                The hurricane and tropical storm tracks <a href="#flood">under Flood and storms</a> and on the map
                are the part of wind that is on record here today.
              </p>
            </div>
            <div>
              <ShelfHead name="Modelled" state="paid" />
              <LockedShelf kind="wind-model" place={slug} />
            </div>
          </div>
        </div>
      </section>

      <section id="sources" className="compact">
        <div className="wrap">
          <Kicker>reading this page</Kicker>
          <h2 style={{ margin: "8px 0 18px" }}>What this is, and where it comes from</h2>
          <p className="screening-note">
            <strong>A screening tool.</strong> This page gathers public records so a buyer or resident can see
            them in one place. The records are shown as their publishers give them and can be out of date or
            incomplete. It is not an engineering study, an appraisal, an insurance quote or a home inspection,
            and it is not for engineering decisions.
          </p>
          <div className="table-scroll" style={{ marginTop: 24 }}>
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Publisher</th>
                  <th>What area it describes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Flood zones</td>
                  <td>FEMA, National Flood Hazard Layer</td>
                  <td>The block: a box about 180 m across around the middle of this place</td>
                </tr>
                <tr>
                  <td>Flood insurance claims</td>
                  <td>FEMA, OpenFEMA NFIP claims</td>
                  <td>The census tract ({tractName})</td>
                </tr>
                <tr>
                  <td>Disaster declarations</td>
                  <td>FEMA, OpenFEMA declarations summaries</td>
                  <td>The county ({countyName})</td>
                </tr>
                <tr>
                  <td>Storm tracks</td>
                  <td>NOAA National Hurricane Center, HURDAT2</td>
                  <td>Within {storms.radiusKm} km of the place</td>
                </tr>
                <tr>
                  <td>Hazard ratings</td>
                  <td>FEMA, National Risk Index</td>
                  <td>The census tract ({tractName})</td>
                </tr>
                <tr>
                  <td>A spot you click</td>
                  <td>FEMA flood map; USGS 3D Elevation Program; National Land Cover Database 2021</td>
                  <td>That spot, and the land cover cell it falls in</td>
                </tr>
                <tr>
                  <td>Sea level rise</td>
                  <td>NOAA Office for Coastal Management</td>
                  <td>Map layer</td>
                </tr>
                <tr>
                  <td>Tree canopy, paving</td>
                  <td>National Land Cover Database 2021 (MRLC)</td>
                  <td>The block, and the square kilometre around it; also a map layer</td>
                </tr>
                <tr>
                  <td>Ground height</td>
                  <td>USGS, 3D Elevation Program</td>
                  <td>The block, and the square kilometre around it</td>
                </tr>
                <tr>
                  <td>Census areas, base map</td>
                  <td>US Census Bureau; USGS The National Map</td>
                  <td>Names of the tract and county; the map underneath</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="record-aside" style={{ marginTop: 16, maxWidth: 820 }}>
            Your address: if you searched for one, it was sent to the Census Bureau&apos;s geocoder to find this
            block and was not stored. The link to this page holds the block, so sharing it does not share a
            house. Map tiles load in your browser straight from the agencies above. A spot you click is sent
            to those agencies to be read and is not stored. Saved places and notes stay in your browser.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
