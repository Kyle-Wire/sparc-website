import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import tracks from "@/data/hurricane-tracks.manifest.json";
import { tableNote } from "@/lib/place/tables";

export const metadata = {
  title: "Data sources",
  description: "Every public source behind a place page: FEMA, USGS, NOAA, the Census Bureau and the national land cover survey, how the site reads each one and how fresh it is.",
};

// Where each record on a place page comes from, how the site reads it, and
// how fresh it is. The dates on this page are read from the manifests the
// build scripts write (src/data/fema/manifest.json and
// src/data/hurricane-tracks.manifest.json); none is typed by hand.
//
// Two ways of reading a source, and the page says which applies to each:
//   our copy      the whole table is copied into the site once a month and
//                 read from there. Quick, and it does not fail when the
//                 agency's server is busy. It can be up to a month behind.
//   asked live    the agency is asked when a place is first looked up, and
//                 the answer is kept for a while. Always current when asked;
//                 can fail if the agency does not answer.

function day(iso: string | null | undefined): string {
  if (!iso) return "not recorded";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime())
    ? "not recorded"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

interface Row {
  record: string;
  publisher: string;
  how: "Our copy" | "Asked live" | "Map layer";
  detail: string;
}

export default function DataPage() {
  const claims = tableNote("claims");
  const declarations = tableNote("declarations");
  const risk = tableNote("risk");

  const rows: Row[] = [
    {
      record: "Flood insurance claims",
      publisher: "FEMA, OpenFEMA NFIP claims",
      how: "Our copy",
      detail: claims
        ? `Copied ${day(claims.copied)}. FEMA last refreshed its table ${day(claims.femaLastRefresh)}. ` +
          (claims.claimsRead && typeof claims.claimsNotLocated === "number"
            ? `${claims.claimsRead.toLocaleString("en-US")} claims read; ${claims.claimsNotLocated.toLocaleString("en-US")} of them FEMA has not placed in a census area, so they are counted for no tract.`
            : "")
        : "No copy in this build; FEMA is asked live.",
    },
    {
      record: "Federal disaster declarations",
      publisher: "FEMA, OpenFEMA declarations summaries",
      how: "Our copy",
      detail: declarations
        ? `Copied ${day(declarations.copied)}. FEMA last refreshed its table ${day(declarations.femaLastRefresh)}.`
        : "No copy in this build; FEMA is asked live.",
    },
    {
      record: "Hazard ratings",
      publisher: "FEMA, National Risk Index",
      how: "Our copy",
      detail: risk
        ? `Copied ${day(risk.copied)}. FEMA's version: ${risk.femaVersion ?? "not given"}.`
        : "No copy in this build; FEMA is asked live.",
    },
    {
      record: "Tropical storm and hurricane tracks",
      publisher: "NOAA National Hurricane Center, HURDAT2",
      how: "Our copy",
      detail: `Copied ${day(tracks.built)}. ${tracks.sources.map((s) => `${s.basin} ${s.record}`).join("; ")}. Rebuilt by hand when NOAA publishes a new file.`,
    },
    {
      record: "Flood zones and map panel dates",
      publisher: "FEMA, National Flood Hazard Layer",
      how: "Asked live",
      detail: "Asked when a place is first looked up; the answer is kept for a week.",
    },
    {
      record: "Ground height",
      publisher: "USGS, 3D Elevation Program",
      how: "Asked live",
      detail: "The block and the area: kept for half a year. A spot you click: kept for a month.",
    },
    {
      record: "Tree canopy, paving and buildings",
      publisher: "National Land Cover Database 2021 (MRLC)",
      how: "Asked live",
      detail: "The survey is the 2021 edition. An answer is kept for half a year.",
    },
    {
      record: "Nearest mapped fault",
      publisher: "USGS, Quaternary Fault and Fold Database (2020 release)",
      how: "Asked live",
      detail: "Asked for the block and for a spot you click; kept for a month. The faults layer loads in your browser.",
    },
    {
      record: "Landslides mapped nearby",
      publisher: "USGS, U.S. Landslide Inventory, version 3",
      how: "Asked live",
      detail: "Counted within 1 km; kept for a month.",
    },
    {
      record: "Landslide susceptibility",
      publisher: "USGS, Mirus et al. 2024 (data release DOI 10.5066/P13KAGU3)",
      how: "Map layer",
      detail: "Loaded by your browser straight from USGS while the layer is on.",
    },
    {
      record: "Soil",
      publisher: "USDA NRCS, Soil Survey Geographic Database (SSURGO), through Soil Data Access",
      how: "Asked live",
      detail: "Kept for a month. The service is often slow; when it does not answer within 8 seconds, the page says so.",
    },
    {
      record: "Wind events a year, by census tract",
      publisher: "FEMA, National Risk Index",
      how: "Asked live",
      detail: "FEMA's annualized frequency for tornado, strong wind and hurricane; kept for a month.",
    },
    {
      record: "Census tract and county",
      publisher: "US Census Bureau geocoder; Photon (OpenStreetMap data, © OpenStreetMap contributors) when Census does not find an address",
      how: "Asked live",
      detail: "Kept for a month. An address you type is sent once to find the block and is not kept at all.",
    },
    {
      record: "Sea level rise; the base map",
      publisher: "NOAA Office for Coastal Management; USGS The National Map, aerial imagery",
      how: "Map layer",
      detail: "Loaded by your browser straight from the agency while the map is on screen.",
    },
  ];

  return (
    <>
      <Nav />
      <main id="main">
      <PageHero
        kicker="data sources · where each record comes from"
        title="Where the data comes from, and how fresh it is."
        lead="Every record on a place page is a public one. Some we copy whole once a month; the rest we ask for when you look a place up. This page says which, and gives the dates."
        accent="var(--flood)"
      />
      <section className="compact">
        <div className="wrap">
          <div className="table-scroll">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Publisher</th>
                  <th>How the site reads it</th>
                  <th>How fresh</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.record}>
                    <td>{r.record}</td>
                    <td>{r.publisher}</td>
                    <td>{r.how}</td>
                    <td>{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="prose" style={{ marginTop: 32 }}>
            <h3>Our copy, and asked live</h3>
            <p>
              <strong>Our copy</strong> means the whole public table is copied into the site and read from
              there. It is quick and it does not fail when an agency&apos;s server is busy. It can be up to a
              month behind the agency, and each card that uses it gives the date the copy was taken.
            </p>
            <p>
              <strong>Asked live</strong> means the agency is asked when a place is first looked up, and the
              answer is kept for the time shown. If the agency does not answer, the card says so and offers
              to try again. Nothing is filled in to cover the gap.
            </p>
            <p>
              Nothing here is changed on the way through: counts, labels and ratings are the publisher&apos;s
              own. What each term means is in the <Link href="/glossary">plain glossary</Link>.
            </p>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
