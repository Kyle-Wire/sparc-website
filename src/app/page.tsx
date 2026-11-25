import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PlaceSearch } from "@/components/place/PlaceSearch";
import { HazardBar, Stamp } from "@/components/marketing/brand";
import { HeroTimelapse } from "@/components/marketing/HeroTimelapse";
import { AFTER, CLOSER, HERO, NEVER, REMEMBERS, SIMULATE, STEPS, TWO_QUESTIONS } from "@/lib/copy/marketing";

// The landing page. Until 25 Nov 2026 the home page was the map and this page
// lived at /how-it-works. Kyle, 25 Nov 2026, after showing the site to a
// friend: "how it works should really be the landing page ... landing on the
// map is a little disorienting if you don't really know what's happening."
// So this is now "/", and the map is at /map under the same menu bar as every
// other page. /how-it-works redirects here (next.config.ts). The one action
// is "Look up your home" (Kyle: "it should just be to look up their home"),
// then "See a sample report".
//
// Its order is the conversion path in docs/design/brand-and-conversion.md s.4:
// curiosity (what your block remembers) -> the free/paid line -> the steps ->
// trust (what we will never say) -> one action. The test record lives on
// /how-we-test, linked from the footer and the FAQ, not pushed here (Kyle,
// 23 Nov 2026: proof stays available for anyone who wants it, never in a
// buyer's face). Every word is
// in src/lib/copy/; nothing here holds a figure.

// The landing page keeps the site-wide title from the root layout.
const { title: _t, ...landingMeta } = withPage("/", { title: "How it works", description: HERO.lead });
void _t;
export const metadata: Metadata = { ...landingMeta, description: HERO.lead };

// The hero's picture is the time-lapse (src/components/marketing/HeroTimelapse.tsx):
// an illustrated town that goes through every hazard we model and folds into the
// SPARC Labs cube. It replaced the street kit's block drawing
// (public/brand/block-iso.svg, still used in print) on 24 Nov 2026 (Kyle: "a large
// neighborhood with forests ... a time lapse ... then it all compresses into the
// floating fluid cell in the logo").

export default function LandingPage() {
  return (
    <>
      <Nav active="how" />
      <main id="main">

      <section className="hiw-hero" id="search">
        <div className="wrap hiw-hero-grid">
          <div>
            <HazardBar size="lg" />
            <h1>{HERO.title}</h1>
            <p className="lead">{HERO.lead}</p>
            <div className="hiw-search">
              <PlaceSearch help={HERO.searchHelp} />
            </div>
          </div>
          <HeroTimelapse />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="hiw-head">
            <Stamp>{REMEMBERS.kicker}</Stamp>
            <h2>{REMEMBERS.title}</h2>
            <p className="lead">{REMEMBERS.lead}</p>
          </div>
          <ul className="remembers" style={{ padding: 0, margin: 0 }}>
            {REMEMBERS.items.map((it) => (
              <li key={it.q} data-hazard={it.hazard}>
                <strong>{it.q}</strong>
                <small>{it.src}</small>
              </li>
            ))}
          </ul>
          <div className="remembers-cta">
            <a href="#search" className="btn btn-accent">
              {TWO_QUESTIONS.free.cta} <span className="arrow">→</span>
            </a>
            <Link href="/data">Every source, with its date</Link>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="hiw-head">
            <Stamp>{TWO_QUESTIONS.kicker}</Stamp>
            <h2>{TWO_QUESTIONS.title}</h2>
          </div>
          <div className="two-q">
            <div>
              <Stamp tone="muted">{TWO_QUESTIONS.free.tag}</Stamp>
              <h3>{TWO_QUESTIONS.free.name}</h3>
              <p className="q">{TWO_QUESTIONS.free.question}</p>
              <ul>
                {TWO_QUESTIONS.free.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="actions">
                <a href="#search" className="btn">
                  {TWO_QUESTIONS.free.cta} <span className="arrow">→</span>
                </a>
              </div>
            </div>
            <div>
              <Stamp tone="accent">{TWO_QUESTIONS.paid.tag}</Stamp>
              <h3>{TWO_QUESTIONS.paid.name}</h3>
              <p className="q">{TWO_QUESTIONS.paid.question}</p>
              <ul>
                {TWO_QUESTIONS.paid.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="actions">
                <Link href="/report/sample" className="btn btn-accent">
                  {TWO_QUESTIONS.paid.cta} <span className="arrow">→</span>
                </Link>
                <Link href="/pricing" className="btn btn-ghost">
                  Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="simulate">
        <div className="wrap">
          <div className="hiw-head">
            <Stamp tone="accent">{SIMULATE.kicker}</Stamp>
            <h2>{SIMULATE.title}</h2>
            <p className="lead">{SIMULATE.lead}</p>
          </div>
          <div className="hiw-vs">
            <div className="hiw-vs-col">
              <h3>{SIMULATE.lookup.name}</h3>
              <ul>
                {SIMULATE.lookup.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="hiw-vs-col hiw-vs-ours">
              <h3>{SIMULATE.simulation.name}</h3>
              <ul>
                {SIMULATE.simulation.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="steps3 steps4">
            {SIMULATE.items.map((s) => (
              <div key={s.n}>
                <span className="n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24 }}>
            <Link href="/models">
              {SIMULATE.more} <span className="arrow">→</span>
            </Link>
          </p>
        </div>
      </section>

      <section style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="hiw-head">
            <Stamp>{STEPS.kicker}</Stamp>
            <h2>{STEPS.title}</h2>
          </div>
          <div className="steps3">
            {STEPS.items.map((s) => (
              <div key={s.n}>
                <span className="n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="after">
        <div className="wrap">
          <div className="hiw-head">
            <Stamp>{AFTER.kicker}</Stamp>
            <h2>{AFTER.title}</h2>
            <p className="lead">{AFTER.lead}</p>
          </div>
          <div className="steps3">
            {AFTER.items.map((s) => (
              <div key={s.n}>
                <span className="n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
          <p className="screening-note" style={{ marginTop: 24 }}>{AFTER.note}</p>
        </div>
      </section>

      <section className="ink-band">
        <div className="wrap">
          <div className="hiw-head">
            <span className="kicker">{NEVER.kicker}</span>
            <h2>{NEVER.title}</h2>
          </div>
          <div className="never">
            {NEVER.items.map((n) => (
              <div key={n.t}>
                <h3>{n.t}</h3>
                <p>{n.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap closer">
          <HazardBar />
          <h2>{CLOSER.title}</h2>
          <p className="lead">{CLOSER.lead}</p>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <a href="#search" className="btn btn-accent">
              {CLOSER.cta} <span className="arrow">→</span>
            </a>
            <Link href="/map" className="btn">
              Or explore the map
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </>
  );
}
