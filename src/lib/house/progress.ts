/**
 * The "your house is being built" tracker. An order's status says where it is
 * in buying and delivery; report_orders.progress says which model steps are
 * done (scripts/report-order.ts progress, written by the order runner).
 */

export const STEPS = [
  { key: "place", label: "Your place set up", what: "The block is drawn at 1 m from open terrain, buildings and land cover." },
  { key: "flood", label: "Flood", what: "Six design storms and a past storm, on every roof and street." },
  { key: "heat", label: "Heat", what: "A month of hot weather, hour by hour, at street level." },
  { key: "ground", label: "Ground", what: "Ten years of satellite radar over the block." },
  { key: "wind", label: "Wind", what: "The strongest storms on record, run through the streets." },
  { key: "review", label: "A person checks it", what: "Every number and map is read before it reaches you." },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
export type StepState = "waiting" | "running" | "done" | "skipped";
export interface Step {
  key: StepKey;
  label: string;
  what: string;
  state: StepState;
  at: string | null;
}

type Progress = Partial<Record<string, { state?: string; at?: string }>> | null | undefined;

/** The tracker's rows for an order. A delivered order shows every step done. */
export function stepsFor(status: string, progress: Progress): Step[] {
  const delivered = ["delivered", "charging", "payment_failed", "refunded"].includes(status);
  const rows: Step[] = STEPS.map((s) => {
    const p = progress?.[s.key];
    const state: StepState = delivered
      ? p?.state === "skipped" ? "skipped" : "done"
      : p?.state === "done" || p?.state === "running" || p?.state === "skipped" ? p.state : "waiting";
    return { key: s.key, label: s.label, what: s.what, state, at: typeof p?.at === "string" ? p.at : null };
  });
  // An order a person has started but with no step written yet: the first step is under way.
  if (!delivered && status === "in_progress" && rows.every((r) => r.state === "waiting")) rows[0].state = "running";
  return rows;
}

/** How far along, 0..1, for a bar. Skipped steps count as done. */
export function share(steps: Step[]): number {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.state === "done" || s.state === "skipped").length;
  const half = steps.filter((s) => s.state === "running").length * 0.5;
  return (done + half) / steps.length;
}

export const STEP_KEYS: string[] = STEPS.map((s) => s.key);
