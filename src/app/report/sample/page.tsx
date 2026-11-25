import { withPage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import DATA from "@/lib/copy/samples.json";

export const metadata: Metadata = withPage("/report/sample", {
  title: "Sample reports",
  description: "Two real house reports for two Philadelphia rowhouses, addresses withheld: every page, every finding with its range, how sure the findings are, and what a report will never say.",
});

// The samples are two real reports built by Climate Home Inspection's own
// pipeline (tools/report/build_sample.py, reports/samples/) for PHL-POC-001 and
// PHL-POC-002: the same records, models and code as a paid report, "Sample
// report" on every page, the address withheld and no house marked on any map.
//
// 25 November 2026: replaced with the option B report Kyle made the main report
// on 24 November (CHI D58: the "How your land works" title page with four
// answers, squared-off maps, flood, heat, ground, wind and, where the block has
// the runs, winter). Files and the page list come from
// scripts/samples/import-chi-samples.py, which writes public/samples/ and
// src/lib/copy/samples.json from the report as printed. Rerun it after the
// samples are rebuilt; nothing on this page is typed from a report by hand.

const LABELS = ["Well supported", "Moderately supported", "Limited evidence", "Insufficient information"];

const PLACES: Record<string, string> = {
  a: "A rowhouse on South Street, Center City",
  b: "A rowhouse in Northeast Philadelphia",
};

const SAMPLES = DATA.samples.map((x) => ({ ...x, place: PLACES[x.id] ?? x.name }));

const SECTIONS: { title: string; what: string }[] = [
  {
    title: "How your land works",
    what: "The block in 3D on the title page, with one plain answer for each of the air, the surface, the street and the ground. Then the main findings, each with its range.",
  },
  {
    title: "Flood",
    what: "The design storms, with a map of where the water goes. Then harder tests of the model, and what the public record shows: the flood zone, the ground's height, inspections after a real storm, and how the model compares with other records.",
  },
  {
    title: "Heat",
    what: "What was measured from above, with a map. Then what the model gives: street air temperature, and outdoor comfort (PET) in sun and in shade, under its own heading.",
  },
  {
    title: "Ground movement",
    what: "Whether the ground under the house is moving against the ground around it, read from satellite radar, as a rate with its range. Then whether it moves on its own or with its surroundings, whether the rate has changed, the seasonal swing, and ten years ahead if the past rate holds.",
  },
  {
    title: "Wind",
    what: "The tropical storms that have passed near the place, storm gusts at the house from long weather-station records, and what the buildings around the house do to that wind, from our street model. Each with its range.",
  },
  {
    title: "Winter",
    what: "Where the block has the runs: how hard winters are here, where ice lingers, which outside walls take the cold wind, and where snow piles up after a storm.",
  },
  {
    title: "Reading this report",
    what: "What to check at the house, with what would settle each question. How sure each finding is, in four evidence levels, said once. The limits of each source, and every source with its date and the engine version behind each figure.",
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
        lead="Two real reports for two Philadelphia rowhouses, built by the same models and the same code as a paid report: flood, heat, ground movement and wind, every finding with its range, and how sure the findings are, set out once at the back. The addresses are withheld and no map marks the house."
        accent="var(--flood)"
      />

      <Section kicker="two homes, two answers" title="Same storms. Very different streets.">
        <div className="sample-pair">
          {SAMPLES.map((x) => (
            <article key={x.id} className="sample-card">
              <a href={`#sample-${x.id}`} className="sample-cover" aria-label={`${x.name}: read it page by page`}>
                <Image src={`${x.dir}/${x.id}-page-2-thumb.webp`} alt={`${x.name}, page 2: How your land works, the block in 3D with four answers`} width={408} height={528} />
              </a>
              <div className="sample-body">
                <span className="kicker">{x.name}</span>
                <h3>{x.place}</h3>
                <ul className="sample-answers">
                  {x.answers.map((a) => (
                    <li key={a.kick}>
                      <span>{a.kick.split(" · ").slice(1, 2).join("")}</span>
                      <strong>{a.say}</strong>
                    </li>
                  ))}
                </ul>
                <p className="sample-label">The answers on its title page, as printed. {x.pages.length} pages.</p>
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
          <strong>Samples, not advice.</strong> These show what a report contains. Sample B&rsquo;s block has no
          street-level wind run yet, so its report has storm gusts at the house but not the wind around it, and no
          winter section. The <Link href="/example">worked example of Sample A&rsquo;s block</Link> has every layer, in 3D.
        </p>
      </Section>

      <Section sunken kicker="the SPARC Labs Field Kit" title="A report you can open, print and keep.">
        <p className="lead" style={{ maxWidth: 760, margin: "0 0 28px" }}>
          The PDF is the report. Together with everything around it, it makes up the SPARC Labs Field Kit:
          everything you need to look closer, show someone else, or hand to an
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
              <strong>Prints.</strong> Seven print-ready maps and charts, as PDF and PNG, each with its source at the foot.
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
        <Section key={x.id} sunken={n === 1} kicker={`${x.name} · ${x.pages.length} pages`} title={x.place + "."}>
          <div id={`sample-${x.id}`} className="sample-pages" style={{ scrollMarginTop: 96 }}>
            {x.pages.map((pg, i) => (
              <a key={i} href={`${x.dir}/${x.id}-page-${i + 1}.webp`} target="_blank" rel="noopener" className="sample-page">
                <Image src={`${x.dir}/${x.id}-page-${i + 1}-thumb.webp`} alt={`${x.name}, page ${i + 1}: ${pg.title}`} width={408} height={528} />
                <span>
                  {i + 1}. {pg.title}
                </span>
              </a>
            ))}
          </div>
          <details className="sample-engines">
            <summary>The engine versions behind {x.name}</summary>
            <table>
              <thead>
                <tr>
                  <th>Engine</th>
                  <th>Version</th>
                  <th>Data and run</th>
                </tr>
              </thead>
              <tbody>
                {x.engines.map((e) => (
                  <tr key={e.engine}>
                    <td>{e.engine}</td>
                    <td>
                      <code>{e.version}</code>
                    </td>
                    <td>{e.run}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
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
              its limits. The report is built from those records and nothing else. Nobody types a figure, a level or
              a note into it by hand.
            </p>
            <p>No model result can be checked at the house it describes, so the report says that once, on its back pages, rather than beside every number. A note beside a number marks something unusual about that finding, such as a check that failed at that place. The back pages also give every finding one of four evidence levels, set by fixed rules from the kind of evidence behind it, never from whether the news is good:</p>
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
