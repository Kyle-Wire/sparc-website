import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/lib/seo";
import { Nav, Footer } from "@/components/shell/Shell";
import { AcornViewer } from "@/components/acorn/AcornViewer";

export const metadata: Metadata = withPage("/acorn", {
  title: "Acorn, the home sensor",
  description: "Acorn is SPARC Labs' small home sensor: heat, rain, wind and ground movement measured at your own house. Coming soon.",
});

// The sensor's page (Kyle, 25 Nov 2026: a "coming soon" page with a 3D
// exploded drawing, and the name Acorn: "simple and it feels small, that
// people won't really pay attention to them or notice them"). The sensor is a
// separate future product and never takes the Field Kit name (CHI D65). What
// it measures follows the plan in project files business/07-sensor-product.md
// and the rev A board in sensor-hardware/. No price, no date: nothing is built
// or ordered yet (Kyle, 23 Nov 2026: home sensors parked, "coming soon" only).

const PARTS = [
  { t: "Air temperature and humidity", b: "In a white sun shield, so it reads the air, not the sun on the box." },
  { t: "Rain", b: "How hard it rained at your house, not at the airport miles away." },
  { t: "Wind", b: "Gusts at your yard, to check the wind model where you live." },
  { t: "Air pressure", b: "Storms announce themselves in pressure first." },
  { t: "Tilt", b: "Tiny changes in the ground's tilt, beside what the satellite sees." },
  { t: "Its own power", b: "A small solar cap and a battery. No wires to run." },
];

export default function AcornPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="mp-hero">
          <div className="wrap mp-hero-grid">
            <div>
              <span className="acorn-soon">Coming soon</span>
              <h1 className="mp-name">Acorn</h1>
              <p className="mp-title">A small sensor that measures your own yard.</p>
              <p className="mp-lead">
                Acorn sits quietly in your yard and measures what our models work out: the heat, the rain, the wind and
                the ground under you. Your readings are yours, always, and they make the models better for everyone on
                your street.
              </p>
              <p className="mp-why">Small, easy to overlook, and the start of something that grows.</p>
            </div>
            <figure style={{ margin: 0 }}>
              <AcornViewer />
              <figcaption className="mp-caption">A drawing of the planned Acorn, opening to show what is inside.</figcaption>
            </figure>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">what it measures</div>
            <h2 style={{ margin: "8px 0 20px" }}>Six things, at your house.</h2>
            <div className="acorn-parts">
              {PARTS.map((p) => (
                <div key={p.t}>
                  <h3>{p.t}</h3>
                  <p>{p.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: "var(--paper-2)" }}>
          <div className="wrap mp-two">
            <div>
              <div className="kicker">how it will come</div>
              <h2 style={{ margin: "8px 0 16px" }}>Two ways, when it is ready.</h2>
              <ul className="mp-tells">
                <li>
                  <span>
                    <strong>Storm Ahead with Acorn.</strong> Storm Ahead reads your own yard as a storm passes.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>The SPARC Labs Field Kit with Acorn.</strong> Your house report, with a sensor that keeps
                    checking it.
                  </span>
                </li>
              </ul>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="kicker">your data</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, margin: "10px 0 0" }}>
                You see everything your Acorn measures. We never sell it without your permission.
              </p>
              <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/contact" className="btn btn-accent">
                  Tell me when it&apos;s ready <span className="arrow">→</span>
                </Link>
                <Link href="/storm-ahead" className="btn">
                  Storm Ahead
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
