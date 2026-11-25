import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import type * as React from "react";
import type { Route } from "next";
import { LockedShelf } from "@/components/place/cards";
import { ModelArt } from "@/components/models/ModelArt";
import { MODEL_PAGES } from "@/lib/model-pages";

export const metadata: Metadata = withPage("/models", {
  title: "The models",
  description: "SPARC Labs' own models: Alder (flood), Ginkgo (heat), Yew (ground), Poplar (wind), Ash (wildfire), Palm (hurricane), and Bristlecone, the checker.",
});

// What this page may say about the models, and where each sentence comes
// from. All five are SPARC Labs' own engines, kept in their own repositories.
// The engine cards read src/lib/engines.ts, which records the commit each
// sentence was read at; the notes below cover the first two.
//
//   FloodSim   its README: a 2D urban flood model that builds a 1 m model of
//              an area from open data (terrain, buildings, streets, land
//              cover, soils, design rainfall) and solves shallow-water flow on
//              the graphics card in the browser.
//   HeatSim    its README: hourly street-level air temperature, humidity and
//              an outdoor comfort index (PET) from public global data; an
//              urban canopy energy balance, with a small learned term fitted
//              on street sensors in 13 cities.
//
// What this page may NOT say: that a model is validated for a place, any
// run time, any price. Test results live on /how-we-test (linked once,
// quietly): Kyle, 23 Nov 2026, proof available, never pushed. The models are
// described in their finished form (Kyle, 23 Nov 2026: no temporary
// "validation ongoing" wording).

export default function ModelsPage() {
  return (
    <>
      <Nav active="models" />
      <main id="main">
      <PageHero
        kicker="the models · in every house report"
        title="What the public record can’t tell you."
        lead="A flood zone is a line on a map. It doesn’t say where the water goes on your street in a hard storm, how warm the block stays on a July night, or whether the ground under it moves differently from the ground around it. That takes a model of the neighbourhood. We built six, and a seventh that checks them."
        accent="var(--flood)"
      />

      <Section kicker="the grove" title="Six models for the hazards, and one that checks them all.">
        <div className="grove">
          {MODEL_PAGES.map((m) => (
            <Link
              key={m.slug}
              href={`/models/${m.slug}` as Route}
              className={`grove-card${m.slug === "bristlecone" ? " grove-dark" : ""}`}
              style={{ ["--gc" as string]: m.color } as React.CSSProperties}
            >
              <ModelArt slug={m.slug} />
              <h3>
                {m.name}
                <small>{m.slug === "bristlecone" ? "the checker" : m.hazard.toLowerCase()}</small>
              </h3>
              <p>{m.line}</p>
              <span className="grove-go">
                Meet {m.name} <span className="arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section kicker="how you would use them" title="Three ways in, one place at a time.">
        <div className="grid-3" style={{ gap: 18 }}>
          <Link href="/start" className="card engine-way">
            <span className="kicker">start here</span>
            <strong>Get a report, or run it yourself</strong>
            <span>Pick the place and the hazards, check your computer, and send a request. Nothing is charged.</span>
          </Link>
          <Link href="/workspace" className="card engine-way">
            <span className="kicker">preview</span>
            <strong>The workspace</strong>
            <span>What a subscriber would see: the choices, the run as it happens, the findings, the projects.</span>
          </Link>
          <Link href="/report/sample" className="card engine-way">
            <span className="kicker">layout</span>
            <strong>How a report is laid out</strong>
            <span>Findings first, how sure each is, then limits and sources at the back.</span>
          </Link>
        </div>
      </Section>

      <Section sunken kicker="what if" title="Try a project before you pay for it.">
        <div className="split-1-1" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>
              The projects on offer are ones a home owner can do: a rain garden, a French drain, taking up
              paving, rain barrels, planting trees, a lighter roof. You pick one, the model runs again, and
              you see what it changes in the model.
            </p>
            <p>Every what-if result will say three things beside the number:</p>
            <ul>
              <li>It is modelled. It has not been checked at this place.</li>
              <li>What kind of model produced it, and where that model has been tested.</li>
              <li>The margin: how far off the model has been where it could be checked.</li>
            </ul>
            <p>
              For heat, a project is shown as a change across the neighbourhood, not as a
              promise about one street. We are not promising an outcome. We are giving you a way to
              see the problem and what each option changes in the model.
            </p>
          </div>
          <LockedShelf kind="flood-whatif" />
        </div>
      </Section>

      <Section kicker="said plainly" title="What the report covers, and what it doesn’t.">
        <div className="prose">
          <ul>
            <li>
              <strong>The neighbourhood, then the house.</strong> What is modelled is the streets and buildings
              around the property, read at its walls. Nothing is said about the inside of a home: not the
              basement, not the first floor, not indoor temperature.
            </li>
            <li>
              <strong>A range on every number.</strong> Each finding carries its range and a label for how much
              evidence stands behind it.
            </li>
            <li>
              <strong>No dollar figures.</strong> No expected loss, no insurance premium, no payback period.
            </li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Want the detail? How each model works and what it has been tested against is on{" "}
            <Link href="/how-we-test">methods and tests</Link>.
          </p>
        </div>
        <p className="screening-note" style={{ marginTop: 24 }}>
          <strong>Environmental screening.</strong> Not an engineering study, and not for engineering decisions.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 10 }}>
          <Link href="/start" className="btn btn-accent">Get a report <span className="arrow">→</span></Link>
          <Link href="/map" className="btn">Look up the public record</Link>
        </div>
      </Section>

      </main>

      <Footer />
    </>
  );
}
