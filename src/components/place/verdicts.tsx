// The place page's one line per hazard, beside the map ("Map plus verdicts",
// docs/design/map-first-brief.md s.5), and the free ground and wind cards
// (s.6). Each line is a public record as its publisher gives it, for the area
// around the block. None of it is a reading of a house, and the column ends by
// saying so, with one quiet link to the report (s.7).

import Link from "next/link";
import type { Lookup } from "@/lib/place/lookup";
import type { Glance } from "@/lib/place/summary";
import type { LandCover } from "@/lib/place/surroundings";
import type { NearestFault, SoilReading } from "@/lib/place/ground";
import type { WindFrequency } from "@/lib/place/wind";
import { FAULT_SEARCH_KM, SLIDE_RADIUS_KM, perYear } from "@/lib/place/readings";
import { RecordCard, MissingCard } from "./cards";

export interface GroundRecord {
  fault: Lookup<NearestFault | null>;
  slides: Lookup<number>;
  soil: Lookup<SoilReading | null>;
}

const km = (v: number) => (v < 1 ? "under 1 km" : `${v.toFixed(1)} km`);

function zoneLine(g: Glance): string {
  if (g.zone === null) return "FEMA's flood map did not answer.";
  if (g.zone === "Not mapped") return "FEMA has not mapped flood zones here.";
  return `Zone ${g.zone}${g.sfha ? ", a Special Flood Hazard Area" : ", outside the Special Flood Hazard Area"}.`;
}

function groundLine(r: GroundRecord): string {
  const parts: string[] = [];
  if (r.fault.ok) parts.push(r.fault.data ? `Nearest mapped fault ${km(r.fault.data.km)} away.` : `No fault mapped within ${FAULT_SEARCH_KM} km.`);
  if (r.slides.ok) parts.push(r.slides.data ? `${r.slides.data} landslides mapped within ${SLIDE_RADIUS_KM} km.` : `No landslide mapped within ${SLIDE_RADIUS_KM} km.`);
  return parts.length ? parts.join(" ") : "The USGS records did not answer.";
}

function windLine(w: Lookup<WindFrequency | null>): string {
  if (!w.ok) return "FEMA's National Risk Index did not answer.";
  if (!w.data) return "FEMA has no census tract here.";
  const t = perYear(w.data.tornado);
  const s = perYear(w.data.strongWind);
  return `In this census tract FEMA counts strong wind ${s ?? "not rated"}, tornadoes ${t ?? "not rated"}.`;
}

export function Verdicts(props: {
  slug: string;
  glance: Glance;
  cover: Lookup<LandCover>;
  ground: GroundRecord;
  wind: Lookup<WindFrequency | null>;
}) {
  const { glance, cover } = props;
  const lines: { key: string; name: string; text: string; href: string }[] = [
    { key: "flood", name: "Flood", text: zoneLine(glance), href: "#flood" },
    {
      key: "heat",
      name: "Heat",
      text: cover.ok
        ? `Trees cover ${Math.round(cover.data.canopy.block)}% of the block and paving ${Math.round(cover.data.paving.block)}%.`
        : "The land cover survey did not answer.",
      href: "#heat",
    },
    { key: "ground", name: "Ground", text: groundLine(props.ground), href: "#ground" },
    { key: "wind", name: "Wind", text: windLine(props.wind), href: "#wind" },
    {
      key: "all",
      name: "Every hazard",
      text: glance.risk ? `FEMA rates the tract "${glance.risk}" across eighteen hazards.` : "FEMA's rating did not answer.",
      href: "#hazards",
    },
  ];
  return (
    <section className="verdicts" aria-label="On record here, one line per hazard">
      <div className="kicker">on record here · free</div>
      <ul>
        {lines.map((l) => (
          <li key={l.key} data-hazard={l.key}>
            <a href={l.href}>
              <strong>{l.name}</strong>
              <span>{l.text}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="verdicts-foot">
        About the area around this block, from public agencies. How a house here fares is what the{" "}
        <Link href={{ pathname: "/start", query: { place: props.slug } }}>house report</Link> models (
        <Link href="/report/sample">sample</Link>).
      </p>
    </section>
  );
}

export function VerdictsPending() {
  return (
    <section className="verdicts" aria-busy>
      <div className="kicker">on record here · free</div>
      <p className="spot-hint">Reading FEMA, USGS, the soil survey and the land cover survey…</p>
    </section>
  );
}

const QFAULT_SOURCE = "USGS, Quaternary Fault and Fold Database, 2020";
const SLIDE_SOURCE = "USGS, U.S. Landslide Inventory, version 3";
const SOIL_SOURCE = "USDA NRCS, Soil Survey Geographic Database (SSURGO)";
const WIND_SOURCE = "FEMA, National Risk Index";

export function GroundCards({ r }: { r: GroundRecord }) {
  return (
    <>
      {r.fault.ok ? (
        <RecordCard
          hazard="ground"
          about="Nearest mapped fault"
          figure={r.fault.data ? km(r.fault.data.km) : "None"}
          figureNote={r.fault.data ? r.fault.data.name : `mapped within ${FAULT_SEARCH_KM} km`}
          source={QFAULT_SOURCE}
        >
          <p>
            {r.fault.data
              ? `USGS maps the ${r.fault.data.name} ${km(r.fault.data.km)} from the middle of this block${r.fault.data.age ? `; its most recent movement is classed "${r.fault.data.age}"` : ""}.`
              : `USGS maps no fault that has moved in the last 1.6 million years within ${FAULT_SEARCH_KM} km of this block.`}{" "}
            {r.fault.data?.url && (
              <a href={r.fault.data.url} rel="noreferrer">
                USGS&apos;s report on it
              </a>
            )}
          </p>
          <p className="record-aside">
            Distance from a mapped fault is not a measure of how the ground shakes. Switch on the Faults layer in the map
            to see them.
          </p>
        </RecordCard>
      ) : (
        <MissingCard hazard="ground" about="Nearest mapped fault" reason={r.fault.reason} source={QFAULT_SOURCE} />
      )}
      {r.slides.ok ? (
        <RecordCard
          hazard="ground"
          about="Landslides mapped nearby"
          figure={r.slides.data.toLocaleString("en-US")}
          figureNote={`within ${SLIDE_RADIUS_KM} km`}
          source={SLIDE_SOURCE}
        >
          <p>
            Landslides USGS has gathered from state surveys, research and reports. Places no one has surveyed show none, so
            zero is not a clean bill. The Landslide susceptibility layer in the map shows how prone the slopes are (USGS,
            2024, 90 m).
          </p>
        </RecordCard>
      ) : (
        <MissingCard hazard="ground" about="Landslides mapped nearby" reason={r.slides.reason} source={SLIDE_SOURCE} />
      )}
      {r.soil.ok ? (
        <RecordCard hazard="ground" about="Soil" figure={r.soil.data?.hydroGroup ? `Group ${r.soil.data.hydroGroup}` : undefined} figureNote={r.soil.data?.hydroGroup ? "how fast water soaks in, A fast to D slow" : undefined} source={SOIL_SOURCE}>
          {r.soil.data ? (
            <p>
              The soil survey maps the middle of this block as <strong>{r.soil.data.name}</strong>
              {r.soil.data.drainage ? `, ${r.soil.data.drainage.toLowerCase()}` : ""}
              {r.soil.data.flooding && r.soil.data.flooding !== "None" ? `, flooding ${r.soil.data.flooding.toLowerCase()}` : ""}.
              {r.soil.data.hydricPct ? ` ${r.soil.data.hydricPct}% of the map unit is wetland (hydric) soil.` : ""}
            </p>
          ) : (
            <p>The soil survey has no map unit at the middle of this block.</p>
          )}
          <p className="record-aside">A soil survey maps areas of a few acres. It is not a test of the soil on a lot.</p>
        </RecordCard>
      ) : (
        <MissingCard hazard="ground" about="Soil" reason={r.soil.reason} source={SOIL_SOURCE} />
      )}
    </>
  );
}

export function WindCard({ w }: { w: Lookup<WindFrequency | null> }) {
  if (!w.ok) return <MissingCard hazard="wind" about="Wind events in the tract" reason={w.reason} source={WIND_SOURCE} />;
  if (!w.data) return <MissingCard hazard="wind" about="Wind events in the tract" reason="FEMA has no census tract here." source={WIND_SOURCE} />;
  const rows: [string, number | null][] = [
    ["Strong wind", w.data.strongWind],
    ["Tornado", w.data.tornado],
    ["Hurricane", w.data.hurricane],
  ];
  return (
    <RecordCard hazard="wind" about="Wind events in the census tract" source={`${WIND_SOURCE}${w.data.version ? `, ${w.data.version}` : ""}`}>
      <ul>
        {rows.map(([name, f]) => (
          <li key={name}>
            <strong>{name}:</strong> {perYear(f) ?? "not rated by FEMA here"}
          </li>
        ))}
      </ul>
      <p className="record-aside">
        FEMA&apos;s count of events a year for the whole census tract, so a large tract records more than a small one for the
        same weather. It is not a measure of wind at a house.
      </p>
    </RecordCard>
  );
}
