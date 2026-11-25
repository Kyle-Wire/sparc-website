import type { Route } from "next";
import Link from "next/link";
import { MODEL_NAMES } from "@/lib/model-names";
import { HAZARD_ORDER, type HazardFinding, type HouseBundle, type HazardKey } from "@/lib/house/types";
import { PlanCard } from "./PlanCard";
import "./house.css";

const COLOUR: Record<HazardKey, string> = {
  flood: "var(--flood)",
  heat: "var(--heat)",
  ground: "var(--ground)",
  wind: "var(--wind)",
  fire: "var(--fire)",
};
const HAZARD_WORD: Record<HazardKey, string> = { flood: "Flood", heat: "Heat", ground: "Ground", wind: "Wind", fire: "Wildfire" };

export interface Download {
  label: string;
  href: string | null;
  note?: string;
}

export interface StormCard {
  /** Stage words, e.g. "Quiet" or "Watching: high tide Thursday". */
  title: string;
  text: string;
  /** Colour of the dot. */
  tone: "quiet" | "watching" | "preparing";
  foot: string;
}

/**
 * "Your house": the first page a buyer sees after delivery. One finding per
 * hazard, each with a way into the what-if lab, then the plan, the downloads
 * and the updates. Shared by the signed-in account and the public demo.
 */
export function HouseDashboard({
  house,
  hello,
  kicker,
  labHref,
  downloads,
  storm,
  updates,
  planKey,
}: {
  house: HouseBundle;
  hello: string;
  kicker: string;
  labHref: string | null;
  downloads: Download[];
  storm: StormCard;
  updates: string[];
  planKey: string;
}) {
  const byKey = new Map(house.hazards.map((h) => [h.key, h]));
  const hazards = HAZARD_ORDER.map((k) => byKey.get(k)).filter((h): h is HazardFinding => !!h);
  const dot = storm.tone === "quiet" ? "var(--wind)" : storm.tone === "watching" ? "var(--amber-ink)" : "var(--heat)";
  return (
    <div className="hx">
      <div className="hx-bar" aria-hidden>
        {HAZARD_ORDER.map((k) => (
          <i key={k} style={{ background: COLOUR[k] }} />
        ))}
      </div>
      <div className="hx-hello">
        <div>
          <div className="kicker">{kicker}</div>
          <h2>{hello}</h2>
          <p>{house.about}</p>
        </div>
        <div className="hx-card" aria-label="Storm Ahead">
          <div className="kicker">Storm Ahead</div>
          <h3>
            <span className="hx-dot" style={{ ["--c" as string]: dot }} aria-hidden />
            {storm.title}
          </h3>
          <p>{storm.text}</p>
          <p className="mono" style={{ fontSize: 11, marginTop: 10, color: "var(--muted)" }}>
            {storm.foot}
          </p>
        </div>
      </div>

      <div className="hx-hazards">
        {hazards.map((h) => (
          <HazardCard key={h.key} h={h} labHref={labHref} />
        ))}
      </div>

      <div className="hx-row3">
        <PlanCard storageKey={planKey} labHref={labHref} />
        <div className="hx-card">
          <div className="kicker">Downloads</div>
          <ul className="hx-list">
            {downloads.map((d) => (
              <li key={d.label}>
                {d.href ? <a href={d.href}>{d.label}</a> : <span style={{ color: "var(--muted)" }}>{d.label}</span>}
                {d.note && <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{d.note}</div>}
              </li>
            ))}
          </ul>
        </div>
        <div className="hx-card">
          <div className="kicker">Updates</div>
          <ul className="hx-list">
            {updates.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HazardCard({ h, labHref }: { h: HazardFinding; labHref: string | null }) {
  const name = MODEL_NAMES[h.key].name;
  const lab =
    h.lab === "ready" && labHref ? (
      <Link className="btn btn-accent btn-sm" href={labHref as Route}>
        Try fixes →
      </Link>
    ) : null;
  const foot =
    h.lab === "ready"
      ? labHref
        ? "Fixes ready to test"
        : "What-if lab not offered for this house"
      : h.lab === "explore"
        ? "Measured, not modelled: nothing to test"
        : h.lab === "soon"
          ? `Fixes to test from ${h.when ?? "later"}`
          : "Shown for every house";
  return (
    <article className="hx-card hx-hazard" data-lab={h.lab} style={{ ["--c" as string]: COLOUR[h.key] }}>
      <div className="kicker">
        {HAZARD_WORD[h.key]} · {name}
      </div>
      <h3>{h.headline}</h3>
      <p>{h.line}</p>
      <div className="hx-foot">
        {lab}
        <span className="mono">{foot}</span>
      </div>
    </article>
  );
}
