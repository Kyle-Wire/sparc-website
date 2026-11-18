import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { Em, Placeholder, PlaceholderPlot } from "@/components/system/placeholder";

export const metadata: Metadata = { title: "How a report is laid out" };

// The buyer report's structure, from the Climate Inspection repository's
// docs/product/DIRECTIVE.md §7 ("The report"), opened 18 November 2026. The
// report there is built only from evidence records; the proof-of-concept report
// names its block and stays private, so this page shows the layout and no
// finding. A public sample report replaces it once there is a place that can
// be shown (docs/HANDOFF.md, item 5).
//
// Ground movement and wind sit in the order as sections still to come: the
// directive's §13 rule is that a new hazard is reported only once it has a
// method, an evidence record and a label.

const LABELS = ["Well supported", "Moderately supported", "Limited evidence", "Insufficient information"];

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
    what: "Whether the ground at the house is sinking, whether it moves with its surroundings or on its own, and whether the rate is steady or new. Added once it has a method, evidence records and labels.",
    cards: ["Movement at the house", "Against the surroundings", "Steady or new"],
    coming: true,
  },
  {
    title: "Wind",
    what: "How wind moves through the neighbourhood across the seasons, as a map. Added once it has a method, evidence records and labels.",
    cards: ["By season", "Where buildings funnel it"],
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
        kicker="the report · layout only"
        title="How a report is laid out."
        lead="Findings first. How sure each one is, printed on it in words. The reasons, limits and sources at the back, never in front. This is the layout; no finding on this page is real."
        accent="var(--flood)"
      />

      <Section kicker="the rules a report follows" title="What it will and will not say.">
        <div className="split-1-1" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>
              Every number in a report comes from a record: its source, its date, the method, the engine version and
              its limits. The report is built from those records and nothing else. Nobody types a figure or a label
              into it by hand.
            </p>
            <p>Each modelled finding carries one of four labels, set by fixed rules from the kind of evidence behind it, never from whether the news is good:</p>
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

      <Section sunken kicker="the sections, in order" title="A section takes as many pages as it needs.">
        <ol className="report-sections">
          {SECTIONS.map((s) => (
            <li key={s.title} className="report-section" data-coming={s.coming ? "true" : undefined}>
              <div className="report-section-head">
                <h3>{s.title}</h3>
                {s.coming && <span className="shelf-state" data-state="coming">Coming</span>}
              </div>
              <p>{s.what}</p>
              <Placeholder
                label="report · section"
                note="Layout only. No report on this site holds a finding. Each card would carry a figure, its sentence and its label."
              >
                {s.plot && <PlaceholderPlot height={120} ariaLabel={s.plot} />}
                <div className="report-cards" style={s.plot ? { marginTop: 12 } : undefined}>
                  {s.cards.map((c) => (
                    <div key={c} className="report-card">
                      <span className="kicker">{c}</span>
                      <span className="report-card-figure">
                        <Em />
                      </span>
                      <span className="report-card-label">
                        <Em />
                      </span>
                    </div>
                  ))}
                </div>
              </Placeholder>
            </li>
          ))}
        </ol>
        <p className="screening-note" style={{ marginTop: 28 }}>
          <strong>A screening report.</strong> Not an engineering study, an appraisal, an insurance quote or a home
          inspection, and not for engineering decisions. A real sample will be linked here once there is a place that
          can be shown in public.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link href="/start" className="btn btn-accent">
            Ask for a report <span className="arrow">→</span>
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
