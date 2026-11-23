import Link from "next/link";
import { Stamp } from "@/components/marketing/brand";
import { RECEIPTS } from "@/lib/copy/marketing";
import { RECEIPTS as RECEIPT_ROWS, RECEIPTS_AS_OF, RUNG_WORDS, visibleReceipts, type Rung, type Verdict } from "@/lib/copy/receipts";
import { engine } from "@/lib/engines";

// The receipts: where each quantity a report carries stands, rung by rung,
// failures at the same size as passes. Every line comes from
// src/lib/copy/receipts.ts. Lives on /how-we-test#receipts (moved from
// /how-it-works on 23 Nov 2026: Kyle found it odd on the landing content page).

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

export function ReceiptsSection({ title = RECEIPTS.title }: { title?: string }) {
  return (
      <section style={{ background: "var(--paper-2)" }} id="receipts">
        <div className="wrap">
          <div className="hiw-head">
            <Stamp tone="accent">{RECEIPTS.kicker}</Stamp>
            <h2>{title}</h2>
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
            <Link href="/models">the models</Link>.
          </p>
        </div>
      </section>

  );
}
