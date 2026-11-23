import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PlaceSearch } from "@/components/place/PlaceSearch";
import { HazardBar, Stamp } from "@/components/marketing/brand";
import { CLOSER, HERO, NEVER, RECEIPTS, REMEMBERS, STEPS, TWO_QUESTIONS } from "@/lib/copy/marketing";

// The marketing page. The home page is the map and nothing else (Kyle,
// map-first-brief.md s.3), so this is where someone arriving from a link, a
// post or a search learns what the site is before they search.
//
// Its order is the conversion path in docs/design/brand-and-conversion.md s.4:
// curiosity (what your block remembers) -> the free/paid line -> the steps ->
// trust (receipts, and what we will never say) -> one action. Every word is
// in src/lib/copy/; nothing here holds a figure. The receipts come from
// src/lib/copy/receipts.ts.

export const metadata = {
  title: "How it works",
  description: HERO.lead,
};

function LotDrawing() {
  // A house inside its dashed property line, with the four hazards reaching
  // in from outside it: the brand's one idea, drawn.
  return (
    <div className="hiw-lot" aria-hidden>
      <svg viewBox="0 0 440 320">
        <rect className="lot-line" x="110" y="70" width="220" height="180" rx="2" />
        <path className="house" d="M180 200 V150 L220 118 L260 150 V200 Z" />
        <text className="label" x="110" y="62">property line</text>
        <path className="f" d="M20 286 C 70 270, 90 300, 140 284 S 210 270, 250 288" />
        <path className="f" d="M40 304 C 90 290, 120 318, 170 302" />
        <path className="h" d="M380 30 L360 58 M410 54 L384 74 M396 10 L388 42" />
        <path className="g" d="M300 300 L322 282 L338 296 L362 270 L380 286 L420 250" />
        <path className="w" d="M16 120 C 60 112, 70 136, 104 128 M10 150 C 54 142, 64 166, 98 158 M24 180 C 58 174, 68 190, 92 186" />
        <text className="label" x="20" y="316">flood</text>
        <text className="label" x="378" y="96">heat</text>
        <text className="label" x="372" y="312">ground</text>
        <text className="label" x="16" y="104">wind</text>
      </svg>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <Nav active="how" />

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
          <LotDrawing />
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

      <section>
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

      <section style={{ background: "var(--paper-2)" }} id="receipts">
        <div className="wrap hiw-proof">
          <div>
            <Stamp tone="accent">{RECEIPTS.kicker}</Stamp>
            <h2>{RECEIPTS.title}</h2>
            <p className="lead">{RECEIPTS.short}</p>
          </div>
          <Link href="/how-we-test#receipts" className="btn">
            See every test, failures included <span className="arrow">→</span>
          </Link>
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
            <Link href="/" className="btn">
              Or explore the map
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
