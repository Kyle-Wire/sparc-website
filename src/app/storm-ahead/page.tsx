import type * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { withPage } from "@/lib/seo";
import { Nav, Footer } from "@/components/shell/Shell";
import { StormAheadArt, STORM_STAGES } from "@/components/models/ModelArt";

export const metadata: Metadata = withPage("/storm-ahead", {
  title: "Storm Ahead",
  description: "When an official forecast puts a storm on course for your area, Storm Ahead runs your house's own models for it. First year free with every SPARC Labs Field Kit report, then $79 a year.",
});

// Storm Ahead's own page (Kyle, 25 Nov 2026: "storm ahead can be like its own
// page ... it works, it functions ... the subscription aspect"; price: "first
// year free with report, and then 79 a year", shown here and on /pricing).
// What it does and its voice rules are the concept and the poller in Climate
// Home Inspection (D59, tools/stormahead/): official status first, never
// contradict it, an evacuation order is the only message, and never the words
// safe, all clear, stay or leave. The poller reads official feeds every ten
// minutes (Task Scheduler job, memory storm-ahead).

const STAGE_COLORS = ["var(--line)", "var(--amber-ink)", "var(--fire)", "var(--heat)", "var(--flood)"];

export default function StormAheadPage() {
  return (
    <>
      <Nav active="storm" />
      <main id="main">
        <section className="mp-hero">
          <div className="wrap">
            <div className="mp-badge">
              <i style={{ background: "var(--flood)" }} aria-hidden />
              storm ahead · for your house
            </div>
            <h1 className="mp-name" style={{ fontSize: "clamp(40px, 5.4vw, 68px)" }}>When a storm is coming, your house&apos;s models run.</h1>
            <p className="mp-lead" style={{ maxWidth: 760 }}>
              Storm Ahead reads the official forecasts for your area around the clock. When one puts a hurricane, a
              flash flood or a damaging wind storm on course for you, it runs your house&apos;s own flood and wind
              models on that storm, before it arrives, and tells you plainly what they show.
            </p>
            <figure style={{ margin: "28px 0 0" }}>
              <StormAheadArt />
              <figcaption className="mp-caption">An illustration of the five stages, not a forecast.</figcaption>
            </figure>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">five stages</div>
            <h2 style={{ margin: "8px 0 20px" }}>Quiet most of the year. Busy when it counts.</h2>
            <div className="sa-stages">
              {STORM_STAGES.map((s, i) => (
                <div key={s.t} className="sa-stage" style={{ ["--sc" as string]: STAGE_COLORS[i] } as React.CSSProperties}>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: "var(--paper-2)" }}>
          <div className="wrap mp-two">
            <div>
              <div className="kicker">how it talks to you</div>
              <h2 style={{ margin: "8px 0 16px" }}>The official word comes first. Always.</h2>
              <ul className="mp-tells">
                <li>Every message opens with what the National Weather Service or the National Hurricane Center has issued.</li>
                <li>It never contradicts them. When they and our models differ, they win.</li>
                <li>If an evacuation order covers your area, that is the only thing the message says.</li>
                <li>It tells you what the models show for your block, in plain words, with their range.</li>
              </ul>
              <div className="kicker" style={{ marginTop: 28 }}>what it never says</div>
              <ul className="mp-tells mp-never" style={{ marginTop: 10 }}>
                <li>That you are safe, or that it is all clear</li>
                <li>Whether to stay or leave: that is for your local officials</li>
              </ul>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="kicker">price</div>
              <div className="sa-price" style={{ margin: "10px 0 6px" }}>
                <strong>Free</strong>
                <span>for the first year, with every SPARC Labs Field Kit report</span>
              </div>
              <div className="sa-price">
                <strong>$79</strong>
                <span>a year after that, if you choose to keep it</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
                It watches the house your report is for, using the models already built for it. Nothing renews unless
                you choose to.
              </p>
              <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Link href="/start" className="btn btn-accent">
                  Get a report <span className="arrow">→</span>
                </Link>
                <Link href="/pricing" className="btn">
                  All plans
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">coming next</div>
            <h2 style={{ margin: "8px 0 12px" }}>Storm Ahead, with an Acorn in your yard.</h2>
            <p className="mp-lead">
              Acorn is our small home sensor. With one in your yard, Storm Ahead reads rain, wind and water at your own
              house as the storm passes. <Link href="/acorn">Meet Acorn</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
