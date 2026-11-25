"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { readPlan, writePlan, type PlanItem } from "@/lib/house/plan";
import { formatDepth } from "@/lib/house/flood-lab";

/** The plan: fixes saved from the lab, with what each changed. */
export function PlanCard({ storageKey, labHref }: { storageKey: string; labHref: string | null }) {
  const [items, setItems] = React.useState<PlanItem[]>([]);
  React.useEffect(() => {
    const load = () => setItems(readPlan(storageKey));
    load();
    window.addEventListener("sparc-plan", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("sparc-plan", load);
      window.removeEventListener("storage", load);
    };
  }, [storageKey]);

  const remove = (id: string) => writePlan(storageKey, items.filter((i) => i.id !== id));

  return (
    <div className="hx-card">
      <div className="kicker">Your plan{items.length ? ` · ${items.length} saved` : ""}</div>
      {items.length ? (
        <table className="hx-table">
          <thead>
            <tr>
              <th>Fix</th>
              <th>Water against the house</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const w = formatDepth(i.wall);
              const wo = i.without ? `${formatDepth(i.without[0]).big}–${formatDepth(i.without[1]).big}` : null;
              return (
                <tr key={i.id}>
                  <td>
                    <b>{i.fix}</b>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{i.storm}</div>
                  </td>
                  <td>
                    {w.big}
                    {wo && <div style={{ fontSize: 12.5, color: "var(--muted)" }}>with nothing built: {wo}</div>}
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i.id)} aria-label={`Remove ${i.fix}`}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ marginTop: 8 }}>
          Nothing saved yet. Try a fix in the what-if lab and press “Save to my plan”: it lands here with what it changed.
        </p>
      )}
      <p style={{ marginTop: 12, fontSize: 13 }}>
        Also on every plan: a <b>backwater valve</b> on the sewer line ($200 to $1,000, HomeServe cost guide). The surface model
        can’t test it, because it works inside the pipes. Some water utilities install one free: ask yours.
      </p>
      {labHref && (
        <p style={{ marginTop: 12 }}>
          <Link className="btn btn-sm" href={labHref as Route}>
            Open the what-if lab
          </Link>
        </p>
      )}
    </div>
  );
}
