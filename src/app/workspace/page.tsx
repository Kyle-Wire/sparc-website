import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker, PageHero } from "@/components/marketing/page-shell";
import { Em, Placeholder, PlaceholderPlot, PlaceholderTrack } from "@/components/system/placeholder";
import { engine, RUNS_ON_WORDS, SELF_SERVE_WORDS, type EngineId } from "@/lib/engines";

export const metadata: Metadata = { title: "The workspace (preview)" };

// What a subscriber would see after signing in: one place at a time, a row per
// hazard, each with the choices they make, the run in progress and the
// findings it would give. Nothing here has run. Every panel is drawn in the
// placeholder register, so there is no digit in any of them and the build's
// design gates check that (npm run check:placeholders, and :rendered after a
// build). The steps beside each panel are the flow, in words.

const FLOW: Record<EngineId, string[]> = {
  flood: [
    "Pick a storm, or design one.",
    "The setup reads the terrain around the place and checks the area against what your computer can hold.",
    "Watch the water move through the streets as the model runs on your graphics card.",
    "Read the findings, each with its range.",
    "Try a project and run it again, side by side with the first run.",
  ],
  heat: [
    "Pick a hot spell or a typical summer month.",
    "The run is queued on our server. You can close the page.",
    "When it is ready it lands here, and you get an email if you asked for one.",
    "Read day and night apart, and sun against shade.",
    "Try a project; it is shown as a change across the neighbourhood with its range.",
  ],
  ground: [
    "We read NASA's ground-motion product for the place, and our own full processing when it is ready.",
    "The ground at the house is set against a near ring and a wide ring before anything is shown.",
    "If the checks flag something, the section waits for a person to review it and says so.",
    "Explore the map and the record of movement over the years.",
    "See the movement ten years ahead against the wide ring, with its band.",
  ],
  wind: [
    "We work out the wind through the neighbourhood from every direction.",
    "It is put together with the local wind record, season by season.",
    "Explore the map at street level and at roof level.",
  ],
  fire: [
    "We read the fuels, slope and weather records for the land around the place.",
    "Fire is run across it over a range of winds, with embers carried ahead of the front.",
    "Explore where flames and embers reach, and which side of the house they come from.",
  ],
};

function Slots({ items }: { items: string[] }) {
  return (
    <div className="shelf-slots">
      {items.map((label) => (
        <div key={label} className="shelf-slot">
          <span>{label}</span>
          <PlaceholderTrack height={8} />
          <span className="shelf-slot-value">
            <Em />
          </span>
        </div>
      ))}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="ws-chips" aria-hidden>
      {items.map((c) => (
        <span key={c} className="ws-chip">
          {c}
        </span>
      ))}
    </div>
  );
}

function HazardWorkspace({ id }: { id: EngineId }) {
  const e = engine(id);
  return (
    <section className="hazard-row" id={id}>
      <div className="wrap">
        <Kicker>
          {RUNS_ON_WORDS[e.runsOn]} · {SELF_SERVE_WORDS[e.selfServe]}
        </Kicker>
        <h2>
          <span className="hazard-mark" data-hazard={id} aria-hidden />
          {e.hazard} <span className="journey-engine">· {e.name}</span>
        </h2>
        <p className="lead">{e.where}</p>

        <div className="ws-grid">
          <ol className="ws-flow">
            {FLOW[id].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <div className="ws-panels">
            <Placeholder
              label={`${e.hazard.toLowerCase()} · choose`}
              note="Layout only. These are the choices a subscriber makes before a run. None of them can be made from the site yet."
            >
              <Chips items={e.choices} />
            </Placeholder>

            <Placeholder
              label={`${e.hazard.toLowerCase()} · the run`}
              note="Layout only. Nothing has run, so nothing is drawn. A run's map and its progress would sit here."
            >
              <PlaceholderPlot height={180} ariaLabel={`Where the ${e.hazard.toLowerCase()} map would go. Nothing has run, so nothing is drawn.`} />
              <div style={{ marginTop: 12 }}>
                <PlaceholderTrack height={8} />
              </div>
            </Placeholder>

            <Placeholder
              label={`${e.hazard.toLowerCase()} · findings`}
              note="Layout only. Each finding would carry its figure, its range and its sentence, with a note when something about it is unusual. No finding exists for any place."
            >
              <Slots items={e.findings} />
            </Placeholder>

            {e.whatIf.length > 0 ? (
              <Placeholder label={`${e.hazard.toLowerCase()} · what if`} note={`Layout only. Nothing has been modelled. ${e.whatIfNote}`}>
                <Slots items={e.whatIf} />
              </Placeholder>
            ) : (
              <p className="ws-none">{e.whatIfNote}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WorkspacePage() {
  return (
    <>
      <Nav active="models" />
      <main id="main">
      <PageHero
        kicker="preview · nothing runs here yet"
        title="The workspace a subscriber would use."
        lead="One place at a time, a row for each hazard: what you choose, the run as it happens, the findings with how sure each one is, and projects to try. This page shows the layout only."
        accent="var(--flood)"
      />

      <section className="compact">
        <div className="wrap">
          <p className="screening-note">
            <strong>A preview, not a product.</strong> No model can be run from this site today, and no panel on this
            page holds a result. It is here so you can see what paying would get you before anything is on sale.{" "}
            <Link href="/start">Ask for a report</Link> to have the models run for your place by hand.
          </p>
        </div>
      </section>

      <HazardWorkspace id="flood" />
      <HazardWorkspace id="heat" />
      <HazardWorkspace id="ground" />
      <HazardWorkspace id="wind" />
      <HazardWorkspace id="fire" />

      <section className="hazard-row" id="history">
        <div className="wrap">
          <Kicker>kept for you</Kicker>
          <h2>Run history</h2>
          <p className="lead">
            Every run is kept with its storm or season, its settings and its findings, and can be opened again or
            set beside another. The full flood workbench, for those who want every setting, stays one click away.
          </p>
          <Placeholder label="runs · this place" note="Layout only. No run has been kept for any place, because none has run.">
            <div className="ws-history" aria-hidden>
              {["Flood", "Flood, with a project", "Heat", "Ground movement", "Wind"].map((r) => (
                <div key={r} className="ws-history-row">
                  <span>{r}</span>
                  <span className="mono">
                    <Em />
                  </span>
                  <span className="mono">
                    <Em />
                  </span>
                </div>
              ))}
            </div>
          </Placeholder>
          <div className="row" style={{ marginTop: 24 }}>
            <Link href="/start" className="btn btn-accent">
              Get a report or run it yourself <span className="arrow">→</span>
            </Link>
            <Link href="/report/sample" className="btn">
              How a report is laid out
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </>
  );
}
