// The place page's two conversion pieces (docs/design/brand-and-conversion.md s.5).
//
// Both follow map-first-brief.md s.7: the free record is whole, the paid link
// names one open question per hazard, and nothing pressures. The meter counts
// real lookups: a record is "answered" when its source answered, whatever it
// said, so a quiet block and a busy block fill the meter the same way.

import Link from "next/link";
import { METER, OPEN_QUESTION } from "@/lib/copy/marketing";

type Hazard = keyof typeof OPEN_QUESTION;

/** One line at the end of a hazard's free section: what the record cannot say. */
export function OpenQuestion({ hazard }: { hazard: Hazard }) {
  return (
    <div className="open-question" data-hazard={hazard}>
      <span className="stamp" data-tone={hazard}>
        open question
      </span>
      <p>{OPEN_QUESTION[hazard]}</p>
      <Link href="/report/sample">
        See a sample report <span className="arrow">→</span>
      </Link>
    </div>
  );
}

export function RecordMeter({ answered, place }: { answered: boolean[]; place: string }) {
  const read = answered.filter(Boolean).length;
  const open = Object.keys(OPEN_QUESTION).length;
  return (
    <div className="record-meter" aria-label={`${METER.read(read, answered.length)}; ${METER.open(open)}`}>
      <span className="stamp" data-tone="muted">
        {METER.label}
      </span>
      <div>
        <div className="bar" aria-hidden>
          {[...answered].sort((a, b) => Number(b) - Number(a)).map((ok, i) => (
            <i key={`r${i}`} data-state={ok ? "read" : "missing"} />
          ))}
          {Array.from({ length: open }, (_, i) => (
            <i key={`o${i}`} data-state="open" />
          ))}
        </div>
        <p className="words" style={{ margin: "6px 0 0" }}>
          <strong>{METER.read(read, answered.length)}</strong> · {METER.open(open)}
        </p>
      </div>
      <Link href={{ pathname: "/start", query: { place } }}>
        {METER.openLink} <span className="arrow">→</span>
      </Link>
    </div>
  );
}
