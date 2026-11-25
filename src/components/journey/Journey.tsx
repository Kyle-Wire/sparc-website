"use client";

import * as React from "react";
import Link from "next/link";
import { ENGINES, RUNS_ON_WORDS, SELF_SERVE_WORDS, type EngineId } from "@/lib/engines";
import type { DeviceReport } from "@/lib/device";
import { DeviceCheck } from "./DeviceCheck";

/**
 * The paid path, end to end, as a visitor will walk it: the place, a report or
 * runs of your own, which hazards, a device check, then what you will get.
 *
 * Nothing is on sale, so the last step sends a request to a person (the same
 * /api/waitlist route the contact form uses) instead of taking a payment. When
 * checkout exists it replaces that one step and nothing before it changes.
 *
 * Privacy (site-redesign-brief.md §8): the request carries the rounded block
 * from the page address, never the street address. If the work goes ahead the
 * address is asked for by email, and stays with the order.
 */

export type Mode = "report" | "self";

const MODES: { id: Mode; name: string; who: string; how: string[] }[] = [
  {
    id: "report",
    name: "The SPARC Labs Field Kit",
    who: "For someone buying a home. Bought once.",
    how: [
      "We run every model you pick for the neighbourhood around the property",
      "You get one report: findings first, each with its range, then what to check at the house and how sure the findings are",
      "Nothing to install, and any computer will do",
    ],
  },
  {
    id: "self",
    name: "Run it yourself",
    who: "For an owner trying projects over time. A subscription.",
    how: [
      "The flood model runs in your browser: pick a storm, watch the water, try a project",
      "Heat runs are queued on our server and land in your workspace",
      "Ground movement and wind are worked out for you, then yours to explore",
    ],
  },
];

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="journey-step" data-done={done ? "true" : undefined} aria-labelledby={`step-${n}`}>
      <div className="journey-step-num" aria-hidden>
        {n}
      </div>
      <div className="journey-step-body">
        <h2 id={`step-${n}`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function Journey({
  slug,
  initialHazards,
  reportOnSale = false,
}: {
  slug: string | null;
  initialHazards: EngineId[];
  /** True when checkout is switched on: a report is then bought on /report/buy, not requested. */
  reportOnSale?: boolean;
}) {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [picked, setPicked] = React.useState<Set<EngineId>>(
    () => new Set(initialHazards.length ? initialHazards : (["flood", "heat"] as EngineId[])),
  );
  const [device, setDevice] = React.useState<DeviceReport | null>(null);
  const [form, setForm] = React.useState({ name: "", email: "", note: "" });
  const [state, setState] = React.useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = React.useState("");

  const toggle = (id: EngineId) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = ENGINES.filter((e) => picked.has(e.id));
  const needsDevice = mode === "self" && picked.has("flood");
  const deviceOk = device?.kind === "ok" && !device.fallback && device.capacity.cells > 0;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const lines = [
      `Paid path request: ${mode === "self" ? "run it yourself (subscription)" : "a report (bought once)"}`,
      `Block: ${slug ?? "not given"}`,
      `Hazards: ${chosen.map((c) => c.hazard).join(", ") || "none picked"}`,
      needsDevice
        ? `Device check: ${device?.kind === "ok" ? `${device.gpu}; ${device.capacity.cells} cells${device.fallback ? "; software stand-in" : ""}` : (device?.kind ?? "not run")}`
        : null,
      form.note ? `Note: ${form.note}` : null,
    ].filter(Boolean);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, org: "", domain: "report", crs: "", reason: lines.join("\n") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setState("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  let n = 0;
  return (
    <div className="journey">
      <Step n={++n} title="The place" done={Boolean(slug)}>
        {slug ? (
          <p>
            The block at <span className="mono">{slug}</span>, from the place page you came from.{" "}
            <Link href={`/place/${slug}`}>Back to its public record</Link>
          </p>
        ) : (
          <p>
            Start from a place. <Link href="/map">Look one up</Link>, read its public record for free, and press
            “Get a report or run it yourself” on its page. You can also go on here without one and name the
            place in your note.
          </p>
        )}
        <p className="journey-aside">
          The property sits in the middle; what is modelled is the neighbourhood around it. We never need the
          street address to show you the public record. A report needs it, and we ask for it by email.
        </p>
      </Step>

      <Step n={++n} title="A report, or run it yourself" done={mode !== null}>
        <div className="journey-modes" role="radiogroup" aria-label="How you want to use the models">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              className="journey-mode card"
              data-on={mode === m.id ? "true" : undefined}
              onClick={() => setMode(m.id)}
            >
              <span className="journey-mode-name">{m.name}</span>
              <span className="journey-mode-who">{m.who}</span>
              <ul>
                {m.how.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </Step>

      <Step n={++n} title="Which hazards" done={picked.size > 0}>
        <div className="journey-hazards">
          {ENGINES.map((e) => (
            <label key={e.id} className="journey-hazard card" data-on={picked.has(e.id) ? "true" : undefined}>
              <input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} />
              <span className="journey-hazard-text">
                <span className="journey-hazard-name">
                  <span className="hazard-mark" data-hazard={e.id} aria-hidden />
                  {e.hazard} <span className="journey-engine">· {e.name}</span>
                </span>
                <span className="journey-hazard-where">
                  {RUNS_ON_WORDS[e.runsOn]}
                  {mode === "self" ? ` · ${SELF_SERVE_WORDS[e.selfServe]}` : ""}
                </span>
                <span className="journey-hazard-sum">{e.findings.slice(0, 2).join(". ")}.</span>
              </span>
            </label>
          ))}
        </div>
      </Step>

      {needsDevice && (
        <Step n={++n} title="Can this computer run the flood model?" done={deviceOk}>
          <DeviceCheck onResult={setDevice} />
        </Step>
      )}

      <Step n={++n} title="What you will get">
        {chosen.length === 0 ? (
          <p>Pick at least one hazard above.</p>
        ) : (
          <div className="journey-get">
            {chosen.map((e) => (
              <div key={e.id} className="journey-get-row">
                <h3>
                  <span className="hazard-mark" data-hazard={e.id} aria-hidden />
                  {e.hazard}
                </h3>
                {e.free && (
                  <p className="journey-aside" style={{ marginTop: 0 }}>
                    <strong>Free with every report:</strong> {e.free.join("; ")}.
                  </p>
                )}
                <div className="journey-get-cols">
                  <div>
                    <div className="kicker">{e.free ? "you read, paid" : "you read"}</div>
                    <ul>
                      {e.findings.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="kicker">{mode === "self" ? "you choose" : "we run"}</div>
                    <ul>
                      {e.choices.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="kicker">it will never say</div>
                    <ul>
                      {e.never.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {e.held && <p className="journey-aside">{e.held}</p>}
              </div>
            ))}
            <p className="journey-aside">
              No model result is checked at the house it describes, and the report says so once, at the back, with an
              evidence level for every finding set by fixed rules. A note beside a number marks anything unusual
              about it. Nothing is called validated unless it has been compared with a measurement at that place. <Link href="/report/sample">See how a report is laid out</Link>
              {mode === "self" ? (
                <>
                  {" "}
                  or <Link href="/workspace">the workspace you would use</Link>.
                </>
              ) : (
                "."
              )}
            </p>
          </div>
        )}
      </Step>

      {reportOnSale && mode === "report" ? (
        <Step n={++n} title="Order it">
          <p>
            The SPARC Labs Field Kit can be ordered now. You pay once, when it is ready, and it lands in your account.{" "}
            <Link href="/report/sample">See how a report is laid out</Link> first if you like.
          </p>
          <Link className="btn btn-accent" href={slug ? `/report/buy?place=${slug}` : "/report/buy"}>
            Order the SPARC Field Kit <span className="arrow">→</span>
          </Link>
        </Step>
      ) : (
      <Step n={++n} title="Send the request">
        <p className="screening-note">
          <strong>Nothing is on sale yet, and nothing is charged here.</strong> For now each report is run by hand.
          A person reads your request, tells you what can and cannot be modelled at your place, and gives any price
          in writing before anything is agreed.
        </p>
        {state === "ok" ? (
          <div className="journey-sent card" role="status">
            <strong>Thank you, we have it.</strong> A person will reply to {form.email}.
          </div>
        ) : (
          <form className="journey-form" onSubmit={send}>
            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <label className="label" htmlFor="j-name">Name</label>
                <input id="j-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="j-email">Email</label>
                <input id="j-email" className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label" htmlFor="j-note">What are you trying to decide? (optional)</label>
                <textarea
                  id="j-note"
                  className="input"
                  style={{ minHeight: 90, resize: "vertical" }}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="No street address here, please. If we go ahead we will ask for it by email."
                />
              </div>
            </div>
            {state === "error" && <p className="journey-error">{error}</p>}
            <button type="submit" className="btn btn-accent" disabled={state === "sending" || !mode || picked.size === 0}>
              {state === "sending" ? "Sending…" : "Send the request"} <span className="arrow">→</span>
            </button>
            {(!mode || picked.size === 0) && (
              <p className="journey-aside">Choose a report or runs of your own, and at least one hazard, first.</p>
            )}
          </form>
        )}
      </Step>
      )}
    </div>
  );
}