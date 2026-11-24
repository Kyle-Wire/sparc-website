/**
 * Receipts: what each model has and has not passed.
 *
 * Owned by the validation thread. The words follow climate-home-inspection
 * docs/validation/VALIDATION-STATUS.md (21 Nov 2026, at 4c25efc) and
 * docs/validation/VALIDATION-PLAN.md (22 Nov 2026). Every receipt names the
 * file its number comes from. Rules:
 * - A failure is a receipt. Failed and not-run checks are shown beside passes.
 * - `evidence: "stated"` means only prose says it; no result file holds it.
 * - A receipt with `shipsWhen` is hidden until `live` is set true by hand,
 *   after the work it names is merged. Use `visibleReceipts()` to read.
 * - The rung is per quantity, never per model and never a score for a house.
 * - Change a number here only when its source file changes.
 */
import type { EngineId } from "../engines";

export const RECEIPTS_AS_OF = "2026-11-22";

/** The four-rung ladder (VALIDATION-STATUS.md §2). */
export type Rung = 0 | 1 | 2 | 3;

export const RUNG_WORDS: Record<Rung, { label: string; meaning: string }> = {
  0: { label: "Held back", meaning: "A check hasn't passed, so it isn't shown in reports." },
  1: { label: "Exploratory", meaning: "Passes its solver tests; no real-world check has met its own bar yet." },
  2: { label: "Screening-checked", meaning: "Met its bar against real measurements in places like this one, held out." },
  3: { label: "Field-checked here", meaning: "Compared with a measurement at this place and passed a mark set in advance." },
};

/** Solver: against exact answers, wind tunnels, flumes or other programs. Real world: against a measurement. */
export type CheckKind = "solver" | "real-world-elsewhere" | "real-world-our-places";
export type Verdict = "passed" | "failed" | "not-run";

export interface Receipt {
  verdict: Verdict;
  kind: CheckKind;
  /** One plain sentence, buyer words. */
  text: string;
  /** Where the number comes from (repo path). */
  source: string;
  /** "shown": a result file holds it. "stated": only prose does. */
  evidence: "shown" | "stated";
  /** If set, hidden until `live` is true. */
  shipsWhen?: string;
  live?: boolean;
}

export interface QuantityReceipts {
  engine: EngineId;
  quantity: string;
  rung: Rung;
  /** Optional qualifier, e.g. where the rung holds. */
  rungNote?: string;
  receipts: Receipt[];
  /** The next check that would move the rung (VALIDATION-PLAN.md step id). */
  next: string;
}

const VS = "climate-home-inspection/docs/validation/VALIDATION-STATUS.md";

export const RECEIPTS: QuantityReceipts[] = [
  {
    engine: "flood",
    quantity: "Water depth on the street in heavy rain",
    rung: 1,
    receipts: [
      { verdict: "passed", kind: "solver", evidence: "shown", text: "88 of 94 of the UK Environment Agency's 2D flood benchmark checks, against the spread of the professional packages.", source: "FloodSim/benchmarks/ea/results/score.txt" },
      { verdict: "passed", kind: "solver", evidence: "shown", text: "22 of 22 exact pipe-and-street cases.", source: "FloodSim/benchmarks/gatec/coupled/score.md" },
      { verdict: "passed", kind: "solver", evidence: "shown", text: "Median difference under a centimetre from HEC-RAS (the US Army Corps model) on four of the same benchmark tests.", source: "FloodSim/benchmarks/gatec/results/hecras-ea.json" },
      { verdict: "failed", kind: "real-world-elsewhere", evidence: "shown", text: "Against measured flood levels in real storms elsewhere, mostly beside rivers, it was off by 0.6 to 0.85 m. Its own bar is 0.15 m.", source: "FloodSim/benchmarks/validation/history.json; FloodSim/docs/ACCEPTANCE.md:49" },
      { verdict: "failed", kind: "real-world-our-places", evidence: "stated", text: "In a Louisiana test tract it put water against almost no house where FEMA paid rain claims.", source: "climate-home-inspection/docs/validation/THIRD-PLACE-NATIONAL.md:64" },
      { verdict: "not-run", kind: "real-world-our-places", evidence: "stated", text: "No flood depth has been measured at any house we report on.", source: `${VS} §1.1` },
    ],
    next: "F2: score against New York's FloodNet street flood sensors, held out, against the 0.15 m bar.",
  },
  {
    engine: "heat",
    quantity: "Street air temperature at night",
    rung: 2,
    rungNote: "In temperate cities elsewhere. In Philadelphia it is exploratory: no street sensor here has been compared.",
    receipts: [
      { verdict: "passed", kind: "solver", evidence: "shown", text: "55 of 58 hand-worked physics cases with known answers.", source: "HeatSim/sandbox/results/20261117T195458Z_5f0afed.md" },
      { verdict: "passed", kind: "real-world-elsewhere", evidence: "shown", text: "At night, an hourly error of about 1.46 K (2.6 °F) across 13 temperate cities, each held out whole, against 1.86 K for the weather station alone. None is in Philadelphia. Those street sensors also helped develop the model, so this is a development score.", source: "HeatSim/validation/results/rescore/b_0.5.0_hybrid_absolute.json; HeatSim/docs/model_card.md:39-41" },
      { verdict: "not-run", kind: "real-world-our-places", evidence: "stated", text: "Not yet checked against a street sensor in Philadelphia.", source: `${VS} §1.3` },
    ],
    next: "H1: score against weather stations around Philadelphia the model never used (NJ and Delaware networks).",
  },
  {
    engine: "heat",
    quantity: "Street air temperature in the afternoon",
    rung: 1,
    receipts: [
      { verdict: "failed", kind: "real-world-elsewhere", evidence: "shown", text: "In the afternoon it does no better than the weather station alone (1.47 K against 1.43 K).", source: "HeatSim/validation/results/rescore/b_0.5.0_hybrid_absolute.json" },
    ],
    next: "H3: Sundial's daytime model must beat the station alone in held-out cities.",
  },
  {
    engine: "heat",
    quantity: "PET (outdoor comfort) and radiant temperature",
    rung: 1,
    receipts: [
      { verdict: "passed", kind: "solver", evidence: "shown", text: "PET matches the reference pythermalcomfort library within 0.24 K over 2,400 conditions.", source: "HeatSim/experiments/out/pet_oracle_agreement.json" },
      { verdict: "not-run", kind: "real-world-elsewhere", evidence: "stated", text: "PET and radiant temperature have never been compared with a measurement.", source: "HeatSim/docs/validation.md:62-65" },
    ],
    next: "H4: compare with published globe-thermometer measurements, held out.",
  },
  {
    engine: "ground",
    quantity: "Ground movement under the block, against the ground around it",
    rung: 1,
    rungNote: "At one of our three test places. Held back at the other two, where the planted-movement test failed.",
    receipts: [
      { verdict: "passed", kind: "real-world-elsewhere", evidence: "stated", text: "The engine's own record shows a pass against 7 GNSS stations around Houston (about 3 mm a year). The result files behind it are being restored.", source: "insar_pipeline/evidence.yaml:40-57" },
      { verdict: "failed", kind: "real-world-elsewhere", evidence: "stated", text: "Its checks against GNSS in Oklahoma, California and at an Australian mine did not pass.", source: "insar_pipeline/evidence.yaml:78-208" },
      { verdict: "passed", kind: "solver", evidence: "shown", text: "A planted-movement test passed at one of our three test places and failed at two.", source: "climate-home-inspection/docs/validation/GROUND-POC-RESULTS.md:92-111" },
      { verdict: "not-run", kind: "real-world-our-places", evidence: "stated", text: "No GNSS station has checked it at any place we report on.", source: "climate-home-inspection/docs/validation/GROUND-POC-RESULTS.md:87-91" },
    ],
    next: "G3: compare with the nearest GNSS stations (HKG3, NJRS) on wider areas.",
  },
  {
    engine: "wind",
    quantity: "Storm gusts at the block (regional layer)",
    rung: 0,
    rungNote: "Not in reports yet.",
    receipts: [
      { verdict: "passed", kind: "real-world-elsewhere", evidence: "shown", text: "For ordinary storms (not thunderstorms), gusts carried in to an airport left out of the set landed within 25 % of what it measured for 87 to 98 % of storm-and-airport pairs, at six places. This run came after two rule fixes, so a blind re-check is next.", source: "WindSim/docs/validation.md, \"Layer 1\", run 4", shipsWhen: "WindSim PR 7 (Layer 1) is merged", live: true },
      { verdict: "failed", kind: "real-world-elsewhere", evidence: "shown", text: "Thunderstorm gusts passed at Miami only.", source: "WindSim/docs/validation.md, \"Layer 1\", run 4", shipsWhen: "WindSim PR 7 (Layer 1) is merged", live: true },
      { verdict: "failed", kind: "real-world-elsewhere", evidence: "shown", text: "The blind re-check, at five new cities chosen by a rule written first: ordinary storms passed at Washington and Atlanta but missed at Houston and Los Angeles (78 and 79 %, against 80 %). Thunderstorms failed at all three cities that had them. New York could not be scored.", source: "WindSim/docs/validation.md, \"Layer 1: A3 blind results\"", shipsWhen: "WindSim PR 9 (blind check) is merged", live: true },
      { verdict: "not-run", kind: "real-world-our-places", evidence: "stated", text: "The step from an airport into a city street hasn't been tested; that needs an anemometer in the city.", source: "WindSim PR 7" },
    ],
    next: "W3: carry storm gusts into a report only at places whose own held-out check passed, labelled so.",
  },
  {
    engine: "wind",
    quantity: "Wind between the buildings (street model)",
    rung: 0,
    receipts: [
      { verdict: "passed", kind: "solver", evidence: "shown", text: "Passes the one-building wind-tunnel case (AIJ Case A) on both engines.", source: "WindSim/benchmarks/aij_case_a/R1_kEpsilon/aij_case_a.json" },
      { verdict: "failed", kind: "solver", evidence: "shown", text: "Fails every wind-tunnel case with more than one building, so it stays out of reports.", source: "WindSim/docs/validation/rans_case_c_d10; WindSim/docs/validation.md:220-221" },
    ],
    next: "W8: pass the full AIJ wind-tunnel set under VDI 3783-9 (66 % hit rate).",
  },
];

/** Receipts safe to render now: drops anything waiting on unmerged work. */
export function visibleReceipts(q: QuantityReceipts): Receipt[] {
  return q.receipts.filter((r) => !r.shipsWhen || r.live === true);
}

export function receiptsFor(engine: EngineId): QuantityReceipts[] {
  return RECEIPTS.filter((q) => q.engine === engine);
}
