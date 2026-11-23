import { withPage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";

export const metadata: Metadata = withPage("/report/sample", {
  title: "Sample reports",
  description: "Two real house reports for two Philadelphia rowhouses, addresses withheld: every page, every finding with its evidence label, and what a report will never say.",
});

// The buyer report's structure, from the Climate Inspection repository's
// docs/product/DIRECTIVE.md §7 ("The report"), opened 18 November 2026. The
// report there is built only from evidence records; the proof-of-concept report
// names its block and stays private, so this page shows the layout and no
// finding. A public sample report replaces it once there is a place that can
// be shown (docs/HANDOFF.md, item 5).
//
// 22 November 2026: two real sample reports replace the empty layout as the
// page's main exhibit. They were built by the real pipeline in Climate Home
// Inspection (PR 23, remade on HeatSim 0.6.1 with Copernicus weather in PR 26,
// reports/samples/) for PHL-POC-001 and PHL-POC-002, carry
// "Sample report" on every page, withhold the address and do not mark the
// house on any map. Files: public/samples/. The statements quoted below are
// copied from page 3 of each report (finding F1), labels included.
//
// Ground movement and wind are in every report (Kyle, 23 November 2026). The
// two samples were built before that and do not have the sections yet.

const LABELS = ["Well supported", "Moderately supported", "Limited evidence", "Insufficient information"];


const SAMPLES = [
  {
    id: "a",
    name: "Sample A",
    place: "A rowhouse on South Street, Center City",
    stat: "0 of 24",
    statLine: "design-storm runs with water at the house's walls",
    finding:
      "In the model, water does not reach the house's outside walls in any of the six design storms (10-, 100- and 500-year, lasting 1 hour and 24 hours): none of 24 runs.",
    pdf: "/samples/sample-report-a.pdf",
  },
  {
    id: "b",
    name: "Sample B",
    place: "A rowhouse in Northeast Philadelphia",
    stat: "24 of 24",
    statLine: "design-storm runs with water at the house's walls",
    finding:
      "In the model, water reaches the house's outside walls in 24 of 24 design-storm runs, standing up to 30 cm above the typical ground beside the house.",
    pdf: "/samples/sample-report-b.pdf",
  },
] as const;

const PAGE_NAMES = [
  "What you get: a sample report",
  "Main findings",
  "Does storm water reach the house?",
  "Harder tests, and what the public record shows",
  "How hot do the block's surfaces run?",
  "How warm is the air, and how does it feel outdoors?",
  "What to check at the house, and how sure each finding is",
  "Limits and points to note",
  "Where each finding comes from",
];

const SECTIONS: { title: string; what: string; cards: string[]; plot?: string; screening?: boolean }[] = [
  {
    title: "At a glance",
    what: "The property's reference, the headline findings for each hazard, and the names of the things the report does not cover.",
    cards: ["Flood, the headline", "Heat, the headline", "Not covered"],
  },
  {
    title: "Flood",
    what: "The design storms, with a map. Then the harder tests of the model, and what the public record shows: the flood zone, the ground's height, inspections after a real storm, and how the model compares with other records.",
    cards: ["Water beside the house", "Water in the street", "Nearest deeper water", "Storm by storm"],
    plot: "Where the map of peak water depth around the property would go. Nothing has been modelled, so nothing is drawn.",
  },
  {
    title: "Heat",
    what: "What was measured from above, with a map. Then what the model estimates: street air temperature, and outdoor comfort under its own heading, with its own map.",
    cards: ["Surface, block against neighbourhood", "Street air, day", "Street air, night", "Comfort, sun against shade"],
    plot: "Where the map of measured surface temperature would go. Nothing has been measured for a place shown here, so nothing is drawn.",
  },
  {
    title: "Ground movement",
    what: "Whether the ground the house stands on moves toward or away from the satellite against the ground around it, as a rate with its range, from NASA's satellite radar product where it covers the place; the map of ground prone to sinkholes; whether it moves with its surroundings or on its own, and whether the rate is steady or new. A refused reading shows no number and says why.",
    cards: ["Ground at the house, free", "Sinkhole-prone ground, free", "With its surroundings or on its own", "Steady or new", "Seasonal swing", "Ten years ahead"],
    screening: true,
  },
  {
    title: "Wind",
    what: "Storm gusts for the area from long weather-station records, and how wind moves between the buildings around the house, from our street model. Each with its range and its label.",
    cards: ["Storm gusts for the area", "Wind between the buildings"],
    screening: true,
  },
  {
    title: "What to check at the house, and how sure each finding is",
    what: "Every question the report cannot answer, with what would settle it. The four labels, which findings carry which, and why.",
    cards: ["Questions, with what settles each", ...LABELS],
  },
  {
    title: "Limits and points to note",
    what: "What each model cannot see at this place, said once, at the back.",
    cards: ["Limits of the flood model here", "Limits of the heat model here"],
  },
  {
    title: "Where each finding comes from",
    what: "Every source, its date and its method, and the engine version that produced each modelled figure.",
    cards: ["Sources", "Engine versions"],
  },
];

export default function SampleReportPage() {
  return (
    <>
      <Nav active="models" />
      <main id="main">
      <PageHero
        kicker="sample reports · real homes · addresses withheld"
        title="What you get."
        lead="Two real reports for two Philadelphia rowhouses, built by the same models and the same code as a paid report. Every page, every finding, every label for how sure it is. The addresses are withheld and no map marks the house."
        accent="var(--flood)"
      />

      <Section kicker="two homes, two answers" title="Same storms. Very different streets.">
        <div className="sample-pair">
          {SAMPLES.map((x) => (
            <article key={x.id} className="sample-card">
              <a href={`#sample-${x.id}`} className="sample-cover" aria-label={`${x.name}: read it page by page`}>
                <Image src={`/samples/${x.id}-page-3-thumb.webp`} alt={`${x.name}, page 3: does storm water reach the house?`} width={408} height={528} />
              </a>
              <div className="sample-body">
                <span className="kicker">{x.name}</span>
                <h3>{x.place}</h3>
                <p className="sample-stat">
                  <strong>{x.stat}</strong> {x.statLine}
                </p>
                <p>&ldquo;{x.finding}&rdquo;</p>
                <p className="sample-label">Labelled: limited evidence. Model output, not a measurement.</p>
                <div className="row" style={{ marginTop: 12 }}>
                  <a href={`#sample-${x.id}`} className="btn btn-accent">
                    Read it page by page <span className="arrow">→</span>
                  </a>
                  <a href={x.pdf} className="btn" download>
                    Download the PDF
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="screening-note" style={{ marginTop: 28 }}>
          <strong>Samples, not advice.</strong> These show what a report contains. They are screening reports: every
          model finding is labelled exploratory or limited evidence, and nothing at either house was measured. These two
          were made before ground movement and wind went into every report, so they show flood and heat only. See{" "}
          <Link href="/how-we-test">How we test</Link> for where each check stands.
        </p>
      </Section>


      <Section sunken kicker="beyond the pdf" title="A report you can open, print and keep.">
        <p className="lead" style={{ maxWidth: 760, margin: "0 0 28px" }}>
          The PDF is the report. Around it comes everything you need to look closer, show someone else, or hand to an
          engineer. Pictures below are from Sample A, with a sample pin where the house would be.
        </p>
        <div className="pkg-grid">
          <figure className="pkg-item pkg-wide">
            <Image src="/samples/package/atlas-flood.webp" alt="The atlas open on the flood map: a storm picker on the left, water depth over the block on the right, a sample pin in the middle." width={1440} height={900} />
            <figcaption>
              <strong>The atlas.</strong> Every storm and the heat on one interactive map. Pick a storm, compare two
              side by side, and read the depth beside the house. It opens with a double-click, with no internet and no
              account, and also online on your phone.
            </figcaption>
          </figure>
          <figure className="pkg-item">
            <Image src="/samples/package/plate-flood.webp" alt="A print plate: where the water goes in a 100-year downpour, with the figures at the house beside the map." width={1400} height={1081} />
            <figcaption>
              <strong>Prints.</strong> Seven print-ready maps and charts, as PDF and PNG, each with its source and its
              evidence label at the foot.
            </figcaption>
          </figure>
          <figure className="pkg-item pkg-tall">
            <Image src="/samples/package/atlas-updates-panel.webp" alt="The atlas's updates tab: a version history, each update listed with what changed, and how updates work." width={760} height={1460} />
            <figcaption>
              <strong>Updates.</strong> If we find a mistake, we correct it for free for as long as SPARC Labs exists.
              For 12 months, when a finding changes or a hazard is added, we email you the update too. Your original
              never changes; each update sits beside it with what changed and why.
            </figcaption>
          </figure>
          <div className="pkg-item pkg-text">
            <strong>The data.</strong> The findings as CSV and JSON, and the flood depth grids as GeoTIFF, for an
            engineer or anyone with mapping software. Every source, date and engine version comes with them.
          </div>
          <div className="pkg-item pkg-text">
            <strong>In a box, during the invitation launch.</strong> Reports ordered by invitation also come on a walnut
            drive in a box with a print of the block, posted to you. We ask for the address when the report is ready.
            The download is yours either way.
          </div>
        </div>
      </Section>

      {SAMPLES.map((x, n) => (
        <Section key={x.id} sunken={n === 1} kicker={`${x.name} · nine pages`} title={x.place + "."}>
          <div id={`sample-${x.id}`} className="sample-pages" style={{ scrollMarginTop: 96 }}>
            {PAGE_NAMES.map((name, i) => (
              <a key={name} href={`/samples/${x.id}-page-${i + 1}.webp`} target="_blank" rel="noopener" className="sample-page">
                <Image src={`/samples/${x.id}-page-${i + 1}-thumb.webp`} alt={`${x.name}, page ${i + 1}: ${name}`} width={408} height={528} />
                <span>
                  {i + 1}. {name}
                </span>
              </a>
            ))}
          </div>
          <div className="row" style={{ marginTop: 20 }}>
            <a href={x.pdf} className="btn" download>
              Download {x.name} as a PDF
            </a>
          </div>
        </Section>
      ))}

      <Section kicker="the rules a report follows" title="What it will and will not say.">
        <div className="split-1-1" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>
              Every number in a report comes from a record: its source, its date, the method, the engine version and
              its limits. The report is built from those records and nothing else. Nobody types a figure or a label
              into it by hand.
            </p>
            <p>Each finding carries one of four labels, set by fixed rules from the kind of evidence behind it, never from whether the news is good:</p>
            <ul>
              {LABELS.map((l) => (
                <li key={l}>
                  <strong>{l}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="prose">
            <p>A report never says:</p>
            <ul>
              <li>that water rises above the first floor, unless the floor&apos;s height is known from a survey;</li>
              <li>anything about the basement, or about the temperature indoors;</li>
              <li>a count of hot days;</li>
              <li>an expected loss, an insurance premium or a payback period;</li>
              <li>that a result is validated, unless it was compared with a measurement of the same thing at that place.</li>
            </ul>
            <p>Surface temperature, air temperature and outdoor comfort are different things. Each has its own heading, and they are never averaged or swapped.</p>
          </div>
        </div>
      </Section>

      <Section sunken kicker="the sections, in order" title="Every report follows the same order.">
        <ol className="report-sections">
          {SECTIONS.map((s) => (
            <li key={s.title} className="report-section">
              <div className="report-section-head">
                <h3>{s.title}</h3>
                {s.screening && <span className="shelf-state">New</span>}
              </div>
              <p>{s.what}</p>
            </li>
          ))}
        </ol>
        <p className="screening-note" style={{ marginTop: 28 }}>
          <strong>A screening report.</strong> Not an engineering study, an appraisal, an insurance quote or a home
          inspection, and not for engineering decisions.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link href="/start" className="btn btn-accent">
            Ask for a report <span className="arrow">→</span>
          </Link>
          <Link href="/faq" className="btn">
            Questions
          </Link>
          <Link href="/next-steps" className="btn">
            If a report has hard news
          </Link>
          <Link href="/models" className="btn">
            The models behind it
          </Link>
        </div>
      </Section>

      </main>

      <Footer />
    </>
  );
}
