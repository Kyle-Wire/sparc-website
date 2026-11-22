import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { LockedShelf } from "@/components/place/cards";
import { ENGINES, RUNS_ON_WORDS } from "@/lib/engines";

export const metadata = { title: "The models" };

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
// What this page may NOT say: that either model is validated for a place,
// that either is available to run on this site, any accuracy figure, any
// run time, any price. Nothing has been measured at a customer's address.
// The methods paper does not exist yet and the page says so.

export default function ModelsPage() {
  return (
    <>
      <Nav active="models" />
      <PageHero
        kicker="the models · paid · not on sale yet"
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
              For heat, a project is shown as a change across the neighbourhood with its range, not as a
              promise about one street. We are not promising an outcome. We are giving you a way to
              see the problem and what each option changes in the model.
            </p>
          </div>
          <LockedShelf kind="flood-whatif" />
        </div>
      </Section>

      <Section kicker="said plainly" title="Where this stands today.">
        <div className="prose">
          <ul>
            <li>
              <strong>Not on the site yet.</strong> None of the four can be run from this site today. To start,
              a report is run by hand when someone asks for one.
            </li>
            <li>
              <strong>Nothing measured at your house.</strong> No model has been checked against a
              measurement at any property we report on. Results are screening-level, and each one says how
              much stands behind it.
            </li>
            <li>
              <strong>The neighbourhood, not the house.</strong> The property sits at the centre of the map;
              what is modelled is the streets around it. Nothing is said about the inside of a home: not the
              basement, not the first floor, not indoor temperature.
            </li>
            <li>
              <strong>No dollar figures.</strong> No expected loss, no insurance premium, no payback period.
            </li>
            <li>
              <strong>Methods paper: coming.</strong> A plain write-up of how each model works, what it
              was tested against and its margins will be linked here. Until it&apos;s out, treat every result
              as a first look.
            </li>
          </ul>
        </div>
        <p className="screening-note" style={{ marginTop: 24 }}>
          <strong>A screening tool.</strong> Not an engineering study, and not for engineering decisions.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 10 }}>
          <Link href="/start" className="btn btn-accent">Ask for a report <span className="arrow">→</span></Link>
          <Link href="/" className="btn">Look up the public record</Link>
        </div>
      </Section>

      <Footer />
    </>
  );
}
