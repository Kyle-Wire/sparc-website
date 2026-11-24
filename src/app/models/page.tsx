import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { LockedShelf } from "@/components/place/cards";
import { ENGINES, RUNS_ON_WORDS } from "@/lib/engines";

export const metadata: Metadata = withPage("/models", {
  title: "The models",
  description: "SPARC Labs' own flood, heat, ground movement and wind models: what each gives, what it has been checked against, and what it will never say.",
});

// What this page may say about the models, and where each sentence comes
// from. All four are SPARC Labs' own engines, kept in their own repositories.
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
        lead="A flood zone is a line on a map. It doesn’t say where the water goes on your street in a hard storm, how warm the block stays on a July night, or whether the ground under it moves differently from the ground around it. That takes a model of the neighbourhood. We built four."
        accent="var(--flood)"
      />

      <Section kicker="four engines" title="Flood, heat, ground movement and wind, for the neighbourhood around a home.">
        <div className="engine-grid">
          {ENGINES.map((e) => (
            <div key={e.id} className="card engine-card" data-hazard={e.id}>
              <div className="kicker">
                {e.hazard} · {RUNS_ON_WORDS[e.runsOn]}
              </div>
              <h3>{e.name}</h3>
              <p className="engine-why">
                {e.why} <span className="engine-on">Runs on our {e.engine} engine.</span>
              </p>
              <p>{e.summary}</p>
              {e.free && (
                <>
                  <div className="kicker" style={{ marginTop: 6 }}>free with every report</div>
                  <ul>
                    {e.free.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
              <div className="kicker" style={{ marginTop: 6 }}>{e.free ? "paid" : "what a buyer reads"}</div>
              <ul>
                {e.findings.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="engine-where">{e.where}</p>
              <p className="engine-status">
                <strong>Today:</strong> {e.status}
              </p>
            </div>
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
          <Link href="/start" className="btn btn-accent">Ask for a report <span className="arrow">→</span></Link>
          <Link href="/" className="btn">Look up the public record</Link>
        </div>
      </Section>

      </main>

      <Footer />
    </>
  );
}
