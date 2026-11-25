import { share, type Step } from "@/lib/house/progress";
import "./house.css";

const WHEN = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) : "";

/** "Your house is being built": each model step lights up as the order runner finishes it. */
export function ProgressTracker({ steps, title, note }: { steps: Step[]; title: string; note: string }) {
  const done = Math.round(share(steps) * 100);
  return (
    <div className="hx-card" aria-label="Progress of your report">
      <div className="kicker">Your house is being built · {done}%</div>
      <h3>{title}</h3>
      <p>{note}</p>
      <div className="hx-meter" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${done}%` }} />
      </div>
      <ol className="hx-track">
        {steps.map((s) => (
          <li key={s.key} data-state={s.state}>
            <span className="hx-tick" aria-hidden>
              {s.state === "done" ? "✓" : s.state === "skipped" ? "–" : ""}
            </span>
            <span>
              <b>{s.label}</b>
              <span className="what">
                {s.state === "skipped" ? "Not run for this place; the report says why." : s.what}
              </span>
            </span>
            <span className="when">
              {s.state === "done" ? WHEN(s.at) || "done" : s.state === "running" ? "running now" : s.state === "skipped" ? "not run" : "waiting"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
