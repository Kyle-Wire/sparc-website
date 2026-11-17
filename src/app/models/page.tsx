import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { LockedShelf } from "@/components/place/cards";

export const metadata = { title: "The models" };

// What this page may say about the two models, and where each sentence comes
// from. Both are SPARC Labs' own engines, kept in their own repositories.
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
        title="What the public record cannot tell you."
        lead="A flood zone is a line on a map. It does not say where the water goes on your street in a hard storm, or how hot the block gets in July. That takes a model of the neighbourhood."
        accent="var(--flood)"
      />

      <Section kicker="two engines" title="Flood and heat, for the neighbourhood around a home.">
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 24, borderTop: "3px solid var(--flood)" }}>
            <div className="kicker">flood</div>
            <h3 style={{ margin: "10px 0 12px" }}>FloodSim</h3>
            <div className="prose" style={{ fontSize: 14 }}>
              <p>
                Builds a model of the neighbourhood at one-metre detail from public data: the terrain
                survey, building outlines, streets, land cover, soils and the official rainfall statistics
                for the place. Then it runs a storm over it and follows the water.
              </p>
              <ul>
                <li>Preset storms of set severity, the kind engineers design to.</li>
                <li>A storm you design yourself.</li>
                <li>Rain as radar is recording it now.</li>
              </ul>
              <p>It runs on your own computer&apos;s graphics card, in the browser.</p>
            </div>
          </div>
          <div className="card" style={{ padding: 24, borderTop: "3px solid var(--heat)" }}>
            <div className="kicker">heat</div>
            <h3 style={{ margin: "10px 0 12px" }}>HeatSim</h3>
            <div className="prose" style={{ fontSize: 14 }}>
              <p>
                Estimates the air temperature at street level, hour by hour, and how hot it feels outdoors
                in sun and in shade. It is a physics model of how streets, roofs, trees and air trade
                heat, with a small correction learned from street sensors in thirteen cities.
              </p>
              <ul>
                <li>Street air temperature, by day and by night.</li>
                <li>Outdoor comfort in sun, building shade and tree shade.</li>
              </ul>
              <p>
                Surface temperature as satellites measure it sits on the same shelf: measured, not
                modelled. HeatSim runs on a server.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section sunken kicker="what if" title="Try a project before you pay for it.">
        <div className="split-1-1" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>
              The projects on offer are ones a home owner can do: a rain garden, a French drain, taking up
              paving, rain barrels, planting trees, a lighter roof. You pick one, the model runs again, and
              you see what it is likely to change.
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
              understand the problem and what the options are likely to do.
            </p>
          </div>
          <LockedShelf kind="flood-whatif" />
        </div>
      </Section>

      <Section kicker="said plainly" title="Where this stands today.">
        <div className="prose">
          <ul>
            <li>
              <strong>Not on the site yet.</strong> Neither model can be run from this site today. To start,
              a report is run by hand when someone asks for one.
            </li>
            <li>
              <strong>Not validated for your address.</strong> Neither model has been checked against
              measurements at any customer&apos;s property. Results are screening-level and will be labelled
              with how much evidence stands behind each one.
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
              <strong>Methods paper: not published yet.</strong> A plain account of how each model works,
              what it has been tested against and its margins will be linked here. Until it exists, treat
              any result as a first look.
            </li>
          </ul>
        </div>
        <p className="screening-note" style={{ marginTop: 24 }}>
          <strong>A screening tool.</strong> Not an engineering study, and not for engineering decisions.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 10 }}>
          <Link href="/contact" className="btn btn-accent">Ask for a report <span className="arrow">→</span></Link>
          <Link href="/" className="btn">Look up the public record</Link>
        </div>
      </Section>

      <Footer />
    </>
  );
}
