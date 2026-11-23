import { withPage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";

// Blind spot S5 (business/11-blind-spots.md): a report that shows water at
// the walls may end a deal, so bad news needs a calm next step. This page is
// linked from the delivery email, the sample report and the FAQ.
//
// Rules for this page: no reassurance and no alarm. It never says a house is
// safe or unsafe, never says to buy or walk away, and names a kind of
// professional, never a firm. Wording follows business/14-support-playbook.md.

export const metadata: Metadata = withPage("/next-steps", {
  title: "If your report has hard news",
  description:
    "What a hard finding in a house report means, who can check it, and the questions to take to each of them.",
});

const MEANS: { t: string; b: string }[] = [
  {
    t: "It is a model, in big storms.",
    b: "A flood finding shows what our model shows in the storms we ran, which are larger than most storms a house meets in a few decades. It is not a forecast and not a record of what has happened.",
  },
  {
    t: "Read the label first.",
    b: "Every finding says how much evidence stands behind it. Exploratory or limited evidence means nobody has yet compared the model with a measurement of the same thing at this place.",
  },
  {
    t: "It is about the outside.",
    b: "The report says nothing about the basement, the first floor or the temperature indoors. Whether water at a wall gets in depends on the house, which a person has to look at.",
  },
  {
    t: "A dry history and a wet map can both be true.",
    b: "A house that has stayed dry so far has not yet met every storm. The caption under each map names the storm and the model's own error.",
  },
];

type Who = { who: string; when: string; ask: string[] };

const WHO: Who[] = [
  {
    who: "Your home inspector",
    when: "For the house itself. Usually already booked.",
    ask: [
      "Is there any sign of past water: stains, efflorescence, a sump pump, fresh paint low on basement walls?",
      "Does the ground slope away from the house on every side? Where do the downspouts empty?",
      "Are there window wells, basement doors or low vents at the side the report shows water?",
    ],
  },
  {
    who: "A licensed civil or geotechnical engineer",
    when: "When a finding is about drainage, grading, foundations or ground movement and you want a professional opinion.",
    ask: [
      "Here is where the model puts water beside the house. What would it take to keep it away from the walls, and roughly what does that involve?",
      "For ground movement: is anything in the house or the foundation consistent with the ground moving, and is it worth monitoring?",
    ],
  },
  {
    who: "An insurance agent",
    when: "Before you commit, for flood cover and what it costs at this address.",
    ask: [
      "What would flood insurance cost here, through the National Flood Insurance Program and privately?",
      "Is the house in a FEMA flood zone, and would an elevation certificate change the price?",
      "Have there been flood claims at this address? Ask whether the seller can get the property's flood loss history.",
    ],
  },
  {
    who: "The seller, through your agent",
    when: "As part of the questions you are allowed to ask before you buy.",
    ask: [
      "Has water ever come into the basement or against the house? When, and what was done?",
      "Has the house ever had a flood insurance claim, or an insurance claim for water?",
      "Are there drains, a sump pump or a backflow valve, and when were they last serviced?",
    ],
  },
  {
    who: "The city's water or stormwater department",
    when: "For the history of street flooding on the block.",
    ask: [
      "Are there records of street or sewer flooding on this block?",
      "Is any drainage or sewer work planned for the area?",
    ],
  },
];

const HEAT: string[] = [
  "Which rooms get afternoon sun, and how is the house cooled? Ask the seller for summer energy bills.",
  "Is there shade over the house or the street, and is any of it at risk (an old tree, a lot due for building)?",
  "Heat findings are about the air outside and outdoor comfort, not indoor temperature. The inspector can tell you about insulation, the roof and the cooling system.",
];

export default function NextStepsPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <PageHero
          kicker="after your report"
          title="If your report has hard news."
          lead="Some findings are hard to read, especially water at the walls of a house you love. Here is what they mean, what they do not, and who can tell you more. We will not tell you whether to buy. Nobody who has not been inside the house should."
          accent="var(--flood)"
        />

        <Section kicker="first, what a finding means" title="Four things to hold on to.">
          <div className="grid-2" style={{ gap: 18 }}>
            {MEANS.map((m) => (
              <div key={m.t} className="card" style={{ padding: 22 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{m.t}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)" }}>{m.b}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section sunken kicker="who can check it" title="Who to ask, and what to ask them.">
          <ol className="next-who">
            {WHO.map((w, i) => (
              <li key={w.who}>
                <span className="next-n mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{w.who}</h3>
                  <p className="next-when">{w.when}</p>
                  <ul>
                    {w.ask.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: "var(--muted)", maxWidth: 760 }}>
            Your report&apos;s page &ldquo;What to check at the house&rdquo; has the questions for your property, with
            what would settle each one. Take it with you.
          </p>
        </Section>

        <Section kicker="if it is the heat" title="Questions for a hot street.">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 760 }}>
            {HEAT.map((h) => (
              <li key={h} style={{ marginBottom: 8 }}>
                {h}
              </li>
            ))}
          </ul>
        </Section>

        <Section sunken kicker="what the report is not" title="Use it for questions, not as a certificate.">
          <div className="prose" style={{ maxWidth: 760 }}>
            <p>
              The report is a screening report for your own decision. It is not a flood determination, an elevation
              certificate, an engineering survey or a home inspection, so it cannot stand in for what a lender or
              insurer asks for. Show it to anyone you like; it carries its limits on every page.
            </p>
            <p>
              <strong>If you think we got something wrong</strong>, tell us which page and why at {EMAIL_PRIMARY}. A
              person will look and tell you honestly what we find. If we made a mistake, we correct it, and the{" "}
              <Link href="/terms#reports">Terms</Link> say when you get your money back.
            </p>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/account/reports" className="btn btn-accent">
              Open your report <span className="arrow">→</span>
            </Link>
            <Link href="/faq" className="btn">
              Questions
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Write to us
            </Link>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
