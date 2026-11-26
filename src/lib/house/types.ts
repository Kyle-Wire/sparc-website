/**
 * The paid account's view of one house: what the order runner uploads next to
 * the report (scripts/report-order.ts house) and what the dashboard reads.
 *
 * Every headline comes from Climate Home Inspection's headline rules
 * (tools/report/headlines.py), never typed here. A hazard that does not apply
 * to the house still appears, with its reason: a label, not a switch.
 */

export type HazardKey = "flood" | "heat" | "ground" | "wind" | "fire";

/** What the what-if lab can do for a hazard on this house. */
export type LabState =
  | "ready" // live controls for this house
  | "explore" // a record to explore; the model measures, it does not test fixes
  | "soon" // planned; the card says when
  | "not_here"; // the hazard does not apply here

export interface HazardFinding {
  key: HazardKey;
  /** The report's headline for this hazard, or why there is none. */
  headline: string;
  /** One plain sentence under it. */
  line: string;
  lab: LabState;
  /** When lab is "soon": a plain month or year, e.g. "January" or "2027". */
  when?: string;
}

export interface HouseBundle {
  kind: "sparc-house";
  version: 1;
  /** A short label the buyer recognises; never the street address on a sample. */
  label: string;
  /** One line describing the house, e.g. "Row house, two storeys, small paved yard". */
  about: string;
  /** Report version shown on the dashboard, e.g. "1.0". */
  report: string;
  hazards: HazardFinding[];
  /** Whether the flood lab passed its study for this house (D46: offered only then). */
  floodLab: { offered: boolean; why?: string };
}

export const HAZARD_ORDER: HazardKey[] = ["flood", "heat", "ground", "wind", "fire"];

/** Is this a bundle the dashboard can show? Rejects anything malformed rather than half-drawing it. */
export function isHouseBundle(x: unknown): x is HouseBundle {
  if (!x || typeof x !== "object") return false;
  const b = x as Partial<HouseBundle>;
  if (b.kind !== "sparc-house" || b.version !== 1 || typeof b.label !== "string" || !Array.isArray(b.hazards)) return false;
  const labs: LabState[] = ["ready", "explore", "soon", "not_here"];
  return b.hazards.every(
    (h) =>
      !!h && HAZARD_ORDER.includes(h.key) && typeof h.headline === "string" && typeof h.line === "string" && labs.includes(h.lab),
  );
}
