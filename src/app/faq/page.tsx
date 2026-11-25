import { withPage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";
import { REPORT, checkoutEnabled, formatPrice } from "@/lib/payments";

export const metadata: Metadata = withPage("/faq", {
  title: "Questions",
  description:
    "What the house report is, how it differs from a home inspection and a flood zone, how sure its findings are, what it will never say, and what happens after you order.",
});
// Price, delivery days and refund terms show only when checkout is on, read
// from src/lib/payments/catalog.ts, so this page and the Terms cannot drift.
export const dynamic = "force-dynamic";

// Every answer here is held to climate-home-inspection
// docs/validation/VALIDATION-STATUS.md §3 (words not allowed: predicts,
// accurate, validated, safe, risk score of our own, sinking). Nothing here may
// promise more than /terms or /privacy; where they differ, they win.

type QA = { q: string; a: ReactNode };

function List({ items }: { items: QA[] }) {
  return (
    <div className="faq-list">
      {items.map((x) => (
        <details key={x.q} className="faq-item">
          <summary>{x.q}</summary>
          <div className="faq-answer prose">{x.a}</div>
        </details>
      ))}
    </div>
  );
}

export default function FaqPage() {
  const onSale = checkoutEnabled();

  const before: QA[] = [
    {
      q: "What is the SPARC Labs Field Kit?",
      a: (
        <>
          <p>
            Everything you get for one house: the house report, an atlas that opens with no internet, maps to
            print, the data files, and a year of updates. The house report is the heart of it: our own flood, heat, ground movement and wind models, run for the streets around one house, written up as
            a PDF. Findings come first. Each one says, in words, how much evidence stands behind it. The reasons, the
            limits and every source are at the back.
          </p>
          <p>
            <Link href="/report/sample">See how a report is laid out</Link>.
          </p>
        </>
      ),
    },
    {
      q: "How is it different from a home inspection?",
      a: (
        <p>
          Your inspector checks the house: the roof, the wiring, the foundation they can see. We look at what happens
          around it: where water runs and stands in the streets in a heavy storm, how hot the block&apos;s air and
          surfaces get, and how that compares with the neighbourhood. It does
          not replace an inspection. It covers what an inspection does not.
        </p>
      ),
    },
    {
      q: "Isn't the FEMA flood zone enough?",
      a: (
        <p>
          A flood zone is one letter for a large area, drawn for flood insurance, and mostly about rivers and the
          coast. Water can also gather where the zone says little, when heavy rain fills the streets faster than the drains take it away.
          Our flood model runs storms on a 1 m grid, street by street, with the drains where we have their records, and shows where water
          reaches around the house in each storm modelled. The flood zone is on the free block record and in the
          report, named as FEMA&apos;s.
        </p>
      ),
    },
    {
      q: "How sure are the findings?",
      a: (
        <>
          <p>
            Nothing at your house has been measured, and no model result has been compared with a measurement there.
            That is true of any report on a single home, so the report says it once, on its back pages, instead of
            beside every number. Each number carries its range and the model&apos;s own error where it was tested. The
            back pages give every finding an evidence level, set by fixed rules from the evidence behind it, never from
            whether the news is good, and a note beside a number marks anything unusual about it, such as a check
            that failed at that place.
          </p>
          <p>
            If you want the detail, how each model works and what it has been tested against is on{" "}
            <Link href="/how-we-test">methods and tests</Link>.
          </p>
        </>
      ),
    },
    {
      q: "What will the report never say?",
      a: (
        <ul>
          {REPORT.isNot.map((x) => (
            <li key={x}>{x}.</li>
          ))}
          <li>No overall score, grade or colour for the house. We give the findings and how sure each one is.</li>
        </ul>
      ),
    },
    {
      q: "Where do the ground movement and wind sections come from?",
      a: (
        <>
          <p>
            Ground movement comes from NASA&apos;s satellite radar product, where it covers the place: whether the ground
            under the block moves differently from the ground around it, as a rate with its range, checked against GPS
            stations.
          </p>
          <p>
            Wind comes in two parts: storm gusts for the area, carried in from long weather-station records, and how
            wind moves between the buildings around the house, from our street model, scored against wind-tunnel
            measurements.
          </p>
          <p>
            Like every finding, each carries its range and a label for how much evidence stands behind it.
          </p>
        </>
      ),
    },
    {
      q: "Can you do my address?",
      a: onSale ? (
        <p>
          The free block record works for any US address. For a report, we first check what our models can cover at
          that place. If a section cannot be made there, we tell you and the report says so. If we cannot make the
          report at all, we charge nothing.
        </p>
      ) : (
        <p>
          The free block record works for any US address. For a report, we check what our models can cover at that
          place and tell you before anything is agreed.
        </p>
      ),
    },
  ];

  const after: QA[] = [
    {
      q: "How much is it, and how long does it take?",
      a: onSale ? (
        <p>
          {formatPrice(REPORT.priceCents)} for one property, plus any sales tax. You save a card when you order and
          we charge it once, when the report is ready. Nothing renews. We aim to finish within{" "}
          {REPORT.deliveryDays} working days of your order; if we have not, you can cancel and pay nothing.
        </p>
      ) : (
        <p>
          Reports are not on sale yet. The price, the delivery time and the refund terms will be published on the{" "}
          <Link href="/pricing">pricing page</Link> and in the <Link href="/terms">Terms</Link> before any charge is
          taken.
        </p>
      ),
    },
    {
      q: "My inspection period is short. Will it arrive in time?",
      a: onSale ? (
        <p>
          Many buyers have about ten days to inspect after an offer is accepted, and we promise the report within{" "}
          {REPORT.deliveryDays} working days. When you order, tell us your inspection deadline: we work on the
          orders with the nearest deadlines first. If your deadline comes before our date, the order page says so
          before you order, and you can write to us first for an honest answer. If we are late, you can cancel and
          pay nothing.
        </p>
      ) : (
        <p>
          When reports go on sale, the order page will ask for your inspection deadline and say before you order
          whether we can meet it.
        </p>
      ),
    },
    {
      q: "Who handles my card?",
      a: onSale ? (
        <p>
          Stripe. You enter your card on Stripe&apos;s page; we never see or keep the number. It is saved when you
          order and charged once, when your report is ready. If you cancel first, or we cannot make the report, the
          saved card is removed and nothing is charged.
        </p>
      ) : (
        <p>Nothing is sold yet, so no card is taken.</p>
      ),
    },
    {
      q: "Who makes it?",
      a: (
        <p>
          A person on our team runs the models for your place and reads the output before it reaches you. Every
          number in the report is built from a record of its source, date, method and model version. Nobody types a
          figure or a label in by hand.
        </p>
      ),
    },
    {
      q: "What if the report shows water at the house?",
      a: (
        <p>
          Read the label on the finding first, then take the report&apos;s questions to the people who can check the
          house: your inspector, an engineer, an insurance agent. We will not tell you whether to buy.{" "}
          <Link href="/next-steps">What to do next, step by step</Link>.
        </p>
      ),
    },
    {
      q: "What if I change my mind?",
      a: onSale ? (
        <p>
          Cancel any time before the report is ready and nothing is charged. If we cannot make the report for your
          property, nothing is charged either. Once it is ready and paid for, it is not refundable unless it is
          materially wrong about what it says it describes.
          The full wording is in the <Link href="/terms#reports">Terms</Link>.
        </p>
      ) : (
        <p>
          The refund terms will be in the <Link href="/terms">Terms</Link> before anything is sold.
        </p>
      ),
    },
    {
      q: "Can I share it?",
      a: (
        <p>
          Yes. The PDF is yours to keep and to show your agent, your inspector, your insurer or your family. It is a
          screening report and carries its limits on every page, so it travels honestly.
        </p>
      ),
    },
    {
      q: "What comes with it besides the PDF?",
      a: (
        <p>
          An atlas: an interactive map of every storm and the heat that opens with a double-click, with no internet
          and no account. Seven print-ready maps and charts. The findings and flood depth grids as data files, for an
          engineer. Reports ordered during the invitation launch also come on a walnut drive in a box, posted to you.{" "}
          <Link href="/report/sample">See them in the sample</Link>.
        </p>
      ),
    },
    {
      q: "Will the report be updated?",
      a: (
        <p>
          If we find a mistake in your report, we correct it and tell you, free, for as long as SPARC Labs exists. For
          12 months after delivery we also send you an update when a finding in your report changes or a new hazard,
          such as ground movement or wind, is added for your place. Your original never changes: each update sits
          beside it, saying what changed and why.
        </p>
      ),
    },
    {
      q: "What happens to my address?",
      a: (
        <p>
          Looking up a place keeps no address. A report is the one time we keep one, with your order, seen only by you
          and the person making the report. We never sell or share it, and never pass you to agents, lenders or
          insurers. See <Link href="/data-use">data use</Link> and the <Link href="/privacy">privacy page</Link>.
        </p>
      ),
    },
    {
      q: "What is free?",
      a: (
        <p>
          The block record, for any US address, with no account: FEMA flood zones, flood insurance claims nearby,
          disaster declarations, storm tracks, ground height, tree canopy and paving, each with its source and date,
          and questions to take to the seller, the inspector and the insurer.{" "}
          <Link href="/map">Look up a place</Link>.
        </p>
      ),
    },
  ];

  return (
    <>
      <Nav />
      <main id="main">
      <PageHero
        kicker="questions · straight answers"
        title="Before you decide."
        lead="What the house report is, what it is not, and what happens after you order. If your question is not here, ask us."
        accent="var(--flood)"
      />
      <Section kicker="before you buy" title="What you get.">
        <List items={before} />
      </Section>
      <Section sunken kicker="after you order" title="How it works.">
        <List items={after} />
        <p className="screening-note" style={{ marginTop: 28 }}>
          <strong>Still wondering?</strong> Write to <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> or use the{" "}
          <Link href="/contact">contact form</Link>. A person reads every message.
        </p>
      </Section>
      </main>
      <Footer />
    </>
  );
}
