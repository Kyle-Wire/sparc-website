import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/lib/seo";
import { Nav, Footer } from "@/components/shell/Shell";
import { BlockViewer } from "@/components/example/BlockViewer";
import { LAYERS, NOT_SAID, SAMPLE_A } from "@/lib/example/sample-a";
import "@/styles/example.css";

// A complete worked example: one block, every layer, the way a buyer gets it.
// Sample A (PHL-POC-001, South Street) in the report's layout from concept B,
// "How your land works" (Kyle adopted it 23 Nov 2026): air, surface, street,
// ground, each opening with its answer. The numbers and headlines come from
// src/lib/example/sample-a.ts, which copies them from the property's evidence
// records; the 3D block is the package's viewer (src/components/example/BlockViewer.tsx).
// A sample never marks a buyer's house, and this page marks none.

export const metadata: Metadata = withPage("/example", {
  title: "A worked example: how one block works",
  description:
    "One Philadelphia block, start to finish: wind, heat, flood and the ground under it, each with its answer, in 3D you can explore. The same models and the same report a buyer gets, address withheld.",
});

const HAZARD_COLOUR: Record<string, string> = {
  air: "var(--wind)",
  surface: "var(--heat)",
  street: "var(--flood)",
  ground: "var(--ground)",
};

export default function ExamplePage() {
  return (
    <>
      <Nav active="models" />
      <main id="main">
        <section className="ex-hero">
          <div className="wrap">
            <div className="kicker">A worked example · {SAMPLE_A.name} · South Street, Philadelphia</div>
            <h1>How your land works.</h1>
            <p className="lead">
              One real block, run through every model we have, the same way a paid report is made. Four layers, top to
              bottom: the air, the surface, the street and the ground. Each opens with its answer. The address is withheld
              and no house is marked.
            </p>
            <div className="ex-answers">
              {LAYERS.map((l) => (
                <a key={l.id} href={`#${l.id}`}>
                  <span>{l.hazard}</span>
                  <strong>{l.headline}</strong>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="ex-sec" aria-labelledby="block-h">
          <div className="wrap">
            <div className="ex-kick">The block in 3D</div>
            <h2 id="block-h">Look around the block.</h2>
            <p className="lead">
              {SAMPLE_A.block}, with every building at its recorded height. Pick a layer, then point at any spot to read
              it. It is the same 3D block that comes in every house package, and it works from the drive with no internet.
            </p>
            <BlockViewer />
          </div>
        </section>

        {LAYERS.map((l) => (
          <section key={l.id} id={l.id} className="ex-sec" aria-labelledby={`${l.id}-h`}>
            <div className="wrap ex-layer">
              <div>
                <div className="ex-kick">
                  <i style={{ background: HAZARD_COLOUR[l.id] }} aria-hidden />
                  {l.n} · {l.name} · {l.hazard}
                </div>
                <h2 id={`${l.id}-h`}>{l.headline}</h2>
                <p className="lead">{l.lead}</p>
                <p className="ex-level">{l.level}</p>
              </div>
              <ul className="ex-figs">
                {l.figures.map((f) => (
                  <li key={f.record}>
                    <div>
                      <span className="ex-big">{f.big}</span>
                      {f.small && <span className="ex-small">{f.small}</span>}
                    </div>
                    <div>
                      <span className="ex-what">{f.what}</span>
                      {f.yardstick && <span className="ex-yard">{f.yardstick}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <section className="ex-sec" aria-labelledby="box-h">
          <div className="wrap">
            <div className="ex-kick">What the buyer gets</div>
            <h2 id="box-h">The report, the maps, and the block to keep.</h2>
            <div className="ex-box">
              <div>
                <h3>The report</h3>
                <p>Every finding with its range, in plain words, and how sure each one is, said once at the back.</p>
              </div>
              <div>
                <h3>The maps and the 3D block</h3>
                <p>Print plates for each layer and this block in 3D, on a drive that opens with no internet.</p>
              </div>
              <div>
                <h3>What it will not say</h3>
                <p>Some questions need someone at the house. The report names them and what would settle each.</p>
              </div>
            </div>
            <ul className="ex-not">
              {NOT_SAID.map((n) => (
                <li key={n.record}>{n.text}</li>
              ))}
            </ul>
            <div className="ex-pdf">
              <a href={SAMPLE_A.pdf} className="btn" download>
                Download the printed sample (PDF)
              </a>
              <Link href="/report/sample" className="btn">
                Read the sample reports page by page
              </Link>
              <Link href="/start" className="btn btn-accent">
                Get the report for your house <span className="arrow">→</span>
              </Link>
            </div>
            <p className="ex-src">
              Flood: FloodSim, NOAA Atlas 14, USGS 3DEP. Heat: HeatSim with ERA5 and ERA5-Land (Copernicus, CC BY 4.0),
              Landsat. Wind: WindSim, NOAA station records and storm tracks. Ground: OPERA DISP-S1 from Sentinel-1
              (Copernicus), Pennsylvania DCNR. Buildings: Overture Maps, © OpenStreetMap contributors (ODbL). Trees: Meta and
              WRI canopy height (CC BY 4.0). How each model is tested: <Link href="/how-we-test">how we test</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
