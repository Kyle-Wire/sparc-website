import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";

export const metadata: Metadata = withPage("/glossary", {
  title: "Plain glossary",
  description: "Flood zones, base flood elevation, tree canopy, surface temperature and the other words on a place page, in plain language, with the publisher's own definitions.",
});

// The words a place page uses, in plain language.
//
// The rule for this page: a definition of somebody else's term is that
// publisher's own definition, restated plainly, with a link to the page it was
// read from. Every source below was opened on 17 November 2026 and the entry
// was written from what the page said, not from memory. Where an entry adds a
// remark of our own it is marked "On this site" and states no fact about
// flooding, heat or law that the source does not.
//
// To add an entry: open the publisher's page, write the entry from it, link
// it, and put the date in READ. An entry with no source is only allowed for a
// term this site invented (the block, the shelves).

const READ = "17 November 2026";

interface Entry {
  id: string;
  term: string;
  body: string[];
  /** A remark of our own, kept apart from the publisher's definition. */
  here?: string;
  source?: { name: string; href: string };
}

const ENTRIES: Entry[] = [
  {
    id: "flood-zone",
    term: "Flood zone",
    body: [
      "FEMA's flood maps divide land into zones. Zones whose code begins with A or V are Special Flood Hazard Areas: land FEMA maps as under water in a flood that has a 1 percent chance of being equalled or exceeded in any year.",
      "Zone X shown shaded, or Zone B on older maps, is a moderate flood hazard area: land between the limit of that flood and the limit of the rarer 0.2 percent a year flood. Zone X unshaded, or Zone C, is an area of minimal flood hazard: outside the Special Flood Hazard Area and higher than the 0.2 percent a year flood.",
    ],
    here: "A boundary between zones can cut a block, so the flood zone card lists every zone that touches the block and the map shows where the lines fall. Click the map to read the zone at one spot.",
    source: { name: "FEMA glossary, Flood Zones", href: "https://www.fema.gov/about/glossary/flood-zones" },
  },
  {
    id: "special-flood-hazard-area",
    term: "Special Flood Hazard Area",
    body: [
      "FEMA's name for the zones beginning with A or V. FEMA describes it as the area where the National Flood Insurance Program's floodplain management rules must be enforced and where the mandatory purchase of flood insurance applies.",
    ],
    here: "Whether insurance will be required for a particular loan is a question for the lender. It is on the list of questions the site gives you when a Special Flood Hazard Area touches the block.",
    source: {
      name: "FEMA glossary, Special Flood Hazard Area",
      href: "https://www.fema.gov/about/glossary/special-flood-hazard-area-sfha",
    },
  },
  {
    id: "hundred-year-flood",
    term: "100-year flood, 1 percent a year flood, base flood",
    body: [
      "Three names for one thing. FEMA's flood maps are drawn for the flood that has a 1 percent chance of being equalled or exceeded in any given year, which FEMA also calls the base flood or the 100-year flood. The 0.2 percent a year flood is the one also called the 500-year flood.",
    ],
    here: "It does not mean once in a hundred years. By arithmetic, a 1 percent chance every year comes to about a 26 percent chance of at least one such flood over thirty years.",
    source: { name: "FEMA glossary, Flood Zones", href: "https://www.fema.gov/about/glossary/flood-zones" },
  },
  {
    id: "base-flood-elevation",
    term: "Base flood elevation",
    body: [
      "The height the water surface reaches in a flood that has a 1 percent chance of being equalled or exceeded in any year. FEMA shows it on the flood map for some zones, among them AE, AH and VE.",
    ],
    source: {
      name: "FEMA glossary, Base Flood Elevation",
      href: "https://www.fema.gov/about/glossary/base-flood-elevation-bfe",
    },
  },
  {
    id: "flood-insurance-claim",
    term: "Flood insurance claim",
    body: [
      "A claim made on a policy of the National Flood Insurance Program, which FEMA runs. FEMA publishes every claim with personal details removed and its location given as a census area, not an address.",
    ],
    here: "The claims card counts the claims in the census tract around the block, by year of loss. Only insured homes can claim, so a low count does not mean no flooding. No dollar amounts are read or shown.",
    source: { name: "FEMA OpenFEMA, NFIP claims dataset", href: "https://www.fema.gov/about/openfema/data-sets" },
  },
  {
    id: "disaster-declaration",
    term: "Federal disaster declaration",
    body: [
      "A federal declaration that a disaster or emergency has struck an area. FEMA publishes each declaration with the counties it names, the date, and FEMA's own label for the kind of incident (hurricane, flood, severe storm and so on).",
    ],
    here: "A declaration covers a whole county. The card counts them for the county the block is in and leaves out public-health declarations.",
    source: {
      name: "FEMA OpenFEMA, Disaster Declarations Summaries dataset",
      href: "https://www.fema.gov/about/openfema/data-sets",
    },
  },
  {
    id: "storm-track",
    term: "Storm track, tropical storm, hurricane",
    body: [
      "NOAA's National Hurricane Center keeps a record of every known tropical cyclone: where its centre was, how strong its winds were and what kind of system it was, point by point along its path. That path is the track.",
      "NOAA classes a system by its sustained wind: a tropical depression below 34 knots, a tropical storm from 34 to 63 knots, a hurricane from 64 knots. Hurricanes are then ranked from category 1 (74 to 95 mph) to category 5 (157 mph or higher) on the Saffir-Simpson Hurricane Wind Scale.",
    ],
    here: "The storms card lists systems whose centre passed within 100 km of the block, with NOAA's class for the system at its nearest point. Rain and wind reach far from the centre, so the distance is not a measure of what the block got.",
    source: { name: "NOAA National Hurricane Center, data archive and wind scale", href: "https://www.nhc.noaa.gov/data/#hurdat" },
  },
  {
    id: "sea-level-rise",
    term: "Sea level rise layer, high-tide line",
    body: [
      "NOAA's Office for Coastal Management maps where the sea would reach if it stood a given number of feet above today's Mean Higher High Water. Mean Higher High Water is the average height of the higher of each day's high tides, taken over NOAA's reference period for tides.",
      "NOAA calls the map a screening-level tool. It shows the scale of possible flooding, not exact locations, and does not account for erosion, sinking ground or future construction.",
    ],
    here: "This is a map layer only. The site makes no statement about a block from it.",
    source: { name: "NOAA Tides and Currents, tidal datums", href: "https://tidesandcurrents.noaa.gov/datum_options.html" },
  },
  {
    id: "tree-canopy",
    term: "Tree canopy",
    body: [
      "The share of the ground that is covered by the crowns of trees, seen from above. The national land cover survey maps it across the lower 48 states in cells 30 metres across, each holding a percentage.",
    ],
    here: "The card averages those cells over the block and over the square kilometre around it. Open water counts as no canopy.",
    source: { name: "MRLC, NLCD Tree Canopy Cover", href: "https://www.mrlc.gov/data/type/tree-canopy" },
  },
  {
    id: "paving",
    term: "Paving and buildings (impervious surface)",
    body: [
      "The share of the ground covered by pavement, concrete, rooftops and other built materials that shed water as runoff. The national land cover survey maps it in cells 30 metres across, each holding a percentage.",
    ],
    here: "The card averages those cells over the block and over the square kilometre around it. Open water counts as not paved.",
    source: {
      name: "MRLC, NLCD Fractional Impervious Surface",
      href: "https://www.mrlc.gov/data/type/fractional-impervious-surface",
    },
  },
  {
    id: "ground-height",
    term: "Ground height",
    body: [
      "The height of the land surface, from the US Geological Survey's 3D Elevation Program.",
    ],
    here: "The ground height card compares the typical (median) height of the block with the typical height of the square kilometre around it, and says how much of that area lies lower than the block. Height alone does not say where water goes. Open water is counted at its surface.",
    source: {
      name: "USGS, 3D Elevation Program elevation service",
      href: "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer",
    },
  },
  {
    id: "risk-index",
    term: "FEMA National Risk Index",
    body: [
      "A FEMA dataset that, in FEMA's words, was created to help illustrate the communities most at risk for eighteen natural hazards. For each census tract it gives a rating for each hazard and one for all hazards together, from very low to very high.",
    ],
    here: "The site shows FEMA's rating words as FEMA gives them, including \"no rating\" and \"not applicable\". It leaves out the index's dollar figures. A rating describes a community, not a house: two homes in one tract get the same rating.",
    source: {
      name: "FEMA, Resilience Analysis and Planning Tool (home of the index)",
      href: "https://www.fema.gov/emergency-managers/practitioners/resilience-analysis-and-planning-tool",
    },
  },
  {
    id: "census-tract",
    term: "Census tract",
    body: [
      "A small area the US Census Bureau draws for publishing statistics. Several public records are published by tract, not by address.",
    ],
    here: "Flood insurance claims and FEMA's hazard ratings on a place page describe the tract the block is in.",
  },
  {
    id: "the-block",
    term: "The block, the neighbourhood",
    body: [
      "Words this site uses for the two areas it reads. The block is a box about 180 metres across around the middle of the place you looked up. The neighbourhood is the square kilometre around that, and on the map the dashed ring 500 metres out.",
    ],
    here: "The page address holds the block, not a house. An address you type is used to find the block and is not stored.",
  },
  {
    id: "shelves",
    term: "On record, modelled, what if",
    body: [
      "The three shelves each hazard has on this site. On record is what public agencies have published, shown with its source and date; it is free. Modelled is the result of running our own flood or heat model for the neighbourhood. What if is the same model run again with a project added, such as a rain garden or more trees.",
    ],
    here: "The modelled and what-if shelves are not on sale yet. Until a model has been run for a place, those panels are drawn as empty layouts and hold no numbers.",
  },
  {
    id: "temperatures",
    term: "Surface temperature, air temperature, outdoor comfort",
    body: [
      "Three different things that are easy to mix up. Surface temperature is the temperature of roofs, pavement and tree tops as a satellite sees them from above. Air temperature is the temperature of the air at street level. Outdoor comfort is an index of how hot it feels to a person standing outside, which depends on the air, the humidity, the wind and whether they are in sun or shade.",
    ],
    here: "These belong to the paid heat shelf. When they appear they will sit under separate labels and will never be averaged together. None of them is the temperature indoors.",
  },
  {
    id: "screening",
    term: "Screening tool",
    body: [
      "A first look that tells you what to ask about and what to look at more closely. This site gathers public records, and later model results, so that a buyer or owner has more to go on.",
    ],
    here: "It is not an engineering study, an appraisal, an insurance quote or a home inspection, and it is not for engineering decisions.",
  },
];

export default function GlossaryPage() {
  return (
    <>
      <Nav />
      <PageHero
        kicker="plain glossary · every term on a place page"
        title="What the words mean."
        lead="Each definition is the publisher's own, restated plainly, with a link to the page it was read from. Where we add something of ours, it is marked."
        accent="var(--flood)"
      />
      <section className="compact">
        <div className="wrap">
          <div className="glossary-index">
            {ENTRIES.map((e) => (
              <a key={e.id} href={`#${e.id}`}>
                {e.term.split(",")[0]}
              </a>
            ))}
          </div>
          <div className="glossary">
            {ENTRIES.map((e) => (
              <article key={e.id} id={e.id} className="glossary-entry">
                <h3>{e.term}</h3>
                {e.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {e.here && (
                  <p>
                    <strong>On this site.</strong> {e.here}
                  </p>
                )}
                <p className="glossary-source">
                  {e.source ? (
                    <>
                      Source: <a href={e.source.href} rel="noreferrer">{e.source.name}</a>, read {READ}.
                    </>
                  ) : (
                    "Our own term."
                  )}
                </p>
              </article>
            ))}
          </div>
          <div className="row" style={{ marginTop: 28, gap: 10 }}>
            <Link href="/" className="btn btn-accent">Look up an address <span className="arrow">→</span></Link>
            <Link href="/models" className="btn">How the models work</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
