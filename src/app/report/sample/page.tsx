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
// Ground movement and wind sit in the order as sections still to come: the
// directive's §13 rule is that a new hazard is reported only once it has a
// method, an evidence record and a label.

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

const SECTIONS: { title: string; what: string; cards: string[]; plot?: string; coming?: boolean }[] = [
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
    what: "Free: whether the ground the house stands on moves toward or away from the satellite against the ground around it, labelled exploratory, and the map of ground prone to sinkholes. Paid: whether it moves with its surroundings or on its own, whether the rate is steady or new, the seasonal swing, and ten years ahead. A held section says it is in review; a refused reading shows no number and says why. Added once it has evidence records and labels.",
    cards: ["Ground at the house, free", "Sinkhole-prone ground, free", "With its surroundings or on its own", "Steady or new", "Seasonal swing", "Ten years ahead"],
    coming: true,
  },
  {
    title: "Wind",
    what: "Wind is being built and is not in reports. Storm gusts for the area come first, once that check is merged; wind between the buildings only after the street model passes its wind-tunnel benchmark.",
    cards: ["Storm gusts for the area", "Wind between the buildings"],
    coming: true,
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
          model finding is labelled exploratory or limited evidence, and nothing at either house was measured. Ground
          movement and wind are not in reports yet; page 1 of each says why.
        </p>
      </Section>

      {SAMPLES.map((x, n) => (
        <Section key={x.id} sunken={n === 0} kicker={`${x.name} · nine pages`} title={x.place + "."}>
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
            <li key={s.title} className="report-section" data-coming={s.coming ? "true" : undefined}>
              <div className="report-section-head">
                <h3>{s.title}</h3>
                {s.coming && <span className="shelf-state" data-state="coming">Coming</span>}
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
          <Link href="/models" className="btn">
            The models behind it
          </Link>
        </div>
      </Section>

      <Footer />
    </>
  );
}
