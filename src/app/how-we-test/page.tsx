import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { ReceiptsSection } from "@/components/marketing/Receipts";
import {
  AIJ_ROWS,
  GUST_BLIND,
  GUST_CALIBRATION,
  KIND_WORDS,
  PLAIN,
  TEST_ROWS,
  TEST_RUN_DATE,
  type GateRow,
  type TestKind,
  type TestRow,
} from "@/lib/copy/test-runs";

// How we test: one dated run of every test suite and benchmark, as it came
// out. Every figure is in src/lib/copy/test-runs.ts, which names the command
// behind each row. The rungs per quantity (the receipts) are the second section,
// from src/components/marketing/Receipts.tsx.

export const metadata = {
  title: "How we test",
  description: PLAIN.lead,
};

const pct = (v: number) => `${Math.round(v * 100)} %`;

function SuiteBar({ row }: { row: TestRow }) {
  const n = row.passed + row.failed + row.other;
  const parts = [
    { k: "passed", v: row.passed },
    { k: "failed", v: row.failed },
    { k: "other", v: row.other },
  ].filter((p) => p.v > 0);
  const words = [`${row.passed} passed`, row.failed ? `${row.failed} failed` : null, row.other ? `${row.other} other` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="tr-bar-wrap">
      <div className="tr-bar" role="img" aria-label={`${words}, of ${n} ${row.unit}`}>
        {parts.map((p) => (
          <i key={p.k} data-part={p.k} style={{ width: `${(p.v / n) * 100}%` }} />
        ))}
      </div>
      <span className="tr-count">
        {words} <small>of {n} {row.unit}</small>
      </span>
    </div>
  );
}

function GateChart({ rows, gate, title, from = 0 }: { rows: GateRow[]; gate: number; title: string; from?: number }) {
  const x = (v: number) => `${((v - from) / (1 - from)) * 100}%`;
  return (
    <figure className="tr-gate">
      <figcaption>{title}</figcaption>
      <div className="tr-gate-rows">
        {rows.map((r) => {
          const ok = r.value >= r.gate;
          return (
            <div key={r.label} className="tr-gate-row">
              <span className="tr-gate-label">
                {r.label}
                {r.note && <small>{r.note}</small>}
              </span>
              <span className="tr-gate-track">
                <i className="tr-gate-fill" data-ok={ok ? "true" : "false"} style={{ width: x(r.value) }} />
                {r.baseline !== undefined && <i className="tr-gate-base" style={{ left: x(r.baseline) }} title={`Average of nearby airports: ${pct(r.baseline)}`} />}
                <i className="tr-gate-line" style={{ left: x(gate) }} />
              </span>
              <span className="tr-gate-value">
                {pct(r.value)}{" "}
                <span className="verdict" data-verdict={ok ? "passed" : "failed"}>
                  {ok ? "pass" : "fail"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="tr-gate-key">
        Dashed line: the pass mark, {pct(gate)}, fixed before the run.
        {rows.some((r) => r.baseline !== undefined) && " Tick: what you get by simply averaging the nearby airports' gusts."}
      </p>
    </figure>
  );
}

const KINDS: TestKind[] = ["known-answer", "benchmark", "held-out"];

export default function HowWeTestPage() {
  return (
    <>
      <Nav />
      <PageHero kicker={`${PLAIN.kicker} · run of ${TEST_RUN_DATE}`} title={PLAIN.title} lead={PLAIN.lead} accent="var(--wind)" />

      <Section kicker="three kinds of test" title="What each kind of test can and can't tell you.">
        <div className="grid-3" style={{ gap: 18 }}>
          {KINDS.map((k) => (
            <div key={k} className="card tr-kind">
              <span className="kicker">{KIND_WORDS[k].label}</span>
              <p>{KIND_WORDS[k].shows}</p>
              <p className="tr-not">{KIND_WORDS[k].doesNot}</p>
            </div>
          ))}
        </div>
      </Section>

      <ReceiptsSection title="Where each reading in the report stands." />

      <Section kicker={`the run of ${TEST_RUN_DATE}`} title="Every suite, as it came out.">
        <div className="table-scroll">
          <table className="tr-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Test</th>
                <th>Kind</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {TEST_ROWS.map((r) => (
                <tr key={r.model + r.test} data-hazard={r.engine}>
                  <td>
                    <strong>{r.model}</strong>
                  </td>
                  <td>
                    {r.test}
                    <small>{r.note}</small>
                    <code>{r.source}</code>
                  </td>
                  <td>{KIND_WORDS[r.kind].label}</td>
                  <td>
                    <SuiteBar row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tr-key">
          <span><i data-part="passed" /> passed</span>
          <span><i data-part="failed" /> failed</span>
          <span><i data-part="other" /> other: no reference answer, not run, expected failure marked in advance, or needs a data host the test machine can&apos;t reach</span>
        </p>
      </Section>

      <Section sunken kicker="wind, in detail" title="The two wind benchmarks, against their pass marks.">
        <div className="split-1-1" style={{ alignItems: "start", gap: 28 }}>
          <GateChart rows={AIJ_ROWS} gate={0.66} title="Wind tunnel (AIJ): share of points within 25 % of the measured speed" />
          <div style={{ display: "grid", gap: 18 }}>
            <GateChart rows={GUST_CALIBRATION} gate={0.8} from={0.4} title="Storm gusts at airports left out, first six places (calibration: two rule fixes came after earlier runs)" />
            <GateChart rows={GUST_BLIND} gate={0.8} from={0.4} title={`Storm gusts, blind: new cities chosen by a published rule, ${TEST_RUN_DATE}`} />
          </div>
        </div>
        <p className="tr-gate-key" style={{ marginTop: 14 }}>
          Ordinary storms, not thunderstorms. The blind check is the one that counts: a model tuned on six places has to hold up on places it has never seen. It held at two new cities and missed at two, so storm gusts reach a report only at a place whose own check passed. New York could not be scored.
        </p>
      </Section>

      <section className="ink-band">
        <div className="wrap">
          <div className="hiw-head">
            <span className="kicker">said plainly</span>
            <h2>{PLAIN.failuresTitle}</h2>
          </div>
          <ul className="tr-fail-list">
            {PLAIN.failures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </section>

      <Section kicker="what we are" title="Screening, not engineering.">
        <div className="split-1-1" style={{ alignItems: "start", gap: 28 }}>
          <div className="prose">
            {PLAIN.stance.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="prose">
            <h3 style={{ marginTop: 0 }}>{PLAIN.limitsTitle}</h3>
            <ul>
              {PLAIN.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p>
              What each result in a report has passed, quantity by quantity, is on{" "}
              <a href="#receipts">the receipts</a>. What each model is: <Link href="/models">the models</Link>.
            </p>
          </div>
        </div>
        <p className="screening-note" style={{ marginTop: 24 }}>
          <strong>A screening tool.</strong> Not an engineering study, and not for engineering decisions.
        </p>
      </Section>

      <Footer />
    </>
  );
}
