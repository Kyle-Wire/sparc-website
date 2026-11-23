import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PlaceSearch } from "@/components/place/PlaceSearch";
import { HazardBar, Stamp } from "@/components/marketing/brand";
import { CLOSER, HERO, NEVER, RECEIPTS, REMEMBERS, STEPS, TWO_QUESTIONS } from "@/lib/copy/marketing";
import { RECEIPTS as RECEIPT_ROWS, RECEIPTS_AS_OF, RUNG_WORDS, visibleReceipts, type Rung, type Verdict } from "@/lib/copy/receipts";
import { engine } from "@/lib/engines";

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

const VERDICT: Record<Verdict, string> = { passed: "passed", failed: "failed", "not-run": "not run yet" };

function Rungs({ rung }: { rung: Rung }) {
  return (
    <span className="rung-dots" role="img" aria-label={`${RUNG_WORDS[rung].label}, rung ${rung} of 3`}>
      {[1, 2, 3].map((r) => (
        <i key={r} data-on={rung >= r ? "true" : "false"} />
      ))}
      <b>{RUNG_WORDS[rung].label}</b>
    </span>
  );
}

export default function HowItWorksPage() {
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
        <div className="wrap">
          <div className="hiw-head">
            <Stamp tone="accent">{RECEIPTS.kicker}</Stamp>
            <h2>{RECEIPTS.title}</h2>
            <p className="lead">{RECEIPTS.lead}</p>
          </div>
          <div className="receipts">
            {RECEIPT_ROWS.map((q) => (
              <div key={q.quantity} className="receipt" data-hazard={q.engine}>
                <div className="receipt-name">
                  <strong>{q.quantity}</strong>
                  <small>{engine(q.engine).name}</small>
                </div>
                <div className="rungs">
                  <Rungs rung={q.rung} />
                  {q.rungNote && <span className="rung-note">{q.rungNote}</span>}
                </div>
                <div className="receipt-body">
                  <ul className="receipt-list">
                    {visibleReceipts(q).map((r) => (
                      <li key={r.text}>
                        <span className="verdict" data-verdict={r.verdict}>
                          {VERDICT[r.verdict]}
                        </span>
                        <span>
                          {r.text}
                          {r.evidence === "stated" && <em className="stated"> From the engine&apos;s own record; no result file shows it yet.</em>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="next">{q.next}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="ladder">
            {([0, 1, 2, 3] as Rung[]).map((r) => (
              <div key={r}>
                <b>{RUNG_WORDS[r].label}</b>
                {RUNG_WORDS[r].meaning}
              </div>
            ))}
          </div>
          <p className="receipts-src">
            As of {RECEIPTS_AS_OF}. Each rung is for one quantity, never a score for a model or a house. From the validation audit in the Climate Home Inspection repository
            (docs/validation/VALIDATION-STATUS.md), which names the file behind every line. Failures are listed at the same size as passes, on purpose. More on each model:{" "}
            <Link href="/models">the models</Link>. Every test we ran, as it came out: <Link href="/how-we-test">how we test</Link>.
          </p>
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

      </main>

      <Footer />
    </>
  );
}
