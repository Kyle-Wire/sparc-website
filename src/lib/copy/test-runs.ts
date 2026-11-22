/**
 * Test runs: every suite we ran on one day, as it came out.
 *
 * Owned by the validation thread, beside receipts.ts. receipts.ts says what
 * each quantity has passed over time (the rung); this file says what one
 * dated run of every test suite and benchmark returned. Rules:
 * - Every row names the command and the repository it ran in.
 * - A failure is a row at the same size as a pass. Nothing is dropped.
 * - "other" is anything that is neither: no reference answer, not run,
 *   expected failure marked in advance, or a test that needs a data host the
 *   test machine can't reach. Its note says which.
 * - Change a number only by running the suite again and changing the date.
 * Source write-up: climate-home-inspection/docs/validation/TEST-RUN-2026-11-22.md
 */
import type { EngineId } from "../engines";

export const TEST_RUN_DATE = "22 November 2026";

export type TestKind = "known-answer" | "benchmark" | "held-out";

export const KIND_WORDS: Record<TestKind, { label: string; shows: string; doesNot: string }> = {
  "known-answer": {
    label: "Known answers",
    shows:
      "We build a scene whose answer is worked out by hand or by exact maths: rain on a tilted street, a hot patch in a steady wind, a made-up town where we plant a sinkhole. The model has to give that answer back. This shows the code does what the physics says.",
    doesNot: "It does not show the physics is enough for a real street.",
  },
  benchmark: {
    label: "Public benchmarks",
    shows:
      "Tests published by others, where established professional programs have already been scored: the UK Environment Agency's flood benchmarks and the Architectural Institute of Japan's wind-tunnel cases. This shows how we compare with tools engineers already use.",
    doesNot: "Laboratory and benchmark scenes are simpler than a real neighbourhood.",
  },
  "held-out": {
    label: "Held-out measurements",
    shows:
      "Real measurements the model never saw while it was built, with the pass mark written down before the data is opened. This shows how far off the model has been in places like yours.",
    doesNot: "It still is not a measurement at your house.",
  },
};

export interface TestRow {
  engine: EngineId | "pipeline";
  /** Which model or tool, as a buyer would name it. */
  model: string;
  test: string;
  kind: TestKind;
  passed: number;
  failed: number;
  other: number;
  /** What a count is: "suites", "checks", "cases", "towns". */
  unit: string;
  note: string;
  /** Repository and command. */
  source: string;
}

export const TEST_ROWS: TestRow[] = [
  { engine: "flood", model: "FloodSim", test: "Unit test suites", kind: "known-answer", passed: 53, failed: 0, other: 0, unit: "suites",
    note: "Every CPU suite: exact solutions, mass balance, pipes, rainfall, reports.", source: "FloodSim · npm test" },
  { engine: "flood", model: "FloodSim", test: "Physics verification", kind: "known-answer", passed: 450, failed: 155, other: 38, unit: "checks",
    note: "Exact answers and volume books mostly pass (398 of 434). Most failures are simplified street-drain and pipe rules scored against fuller references, known gaps written down before the run. 4 of 4 deliberately wrong inputs were caught.",
    source: "FloodSim · node benchmarks/physics/run.mjs" },
  { engine: "flood", model: "FloodSim", test: "UK Environment Agency 2D benchmarks", kind: "benchmark", passed: 88, failed: 6, other: 0, unit: "checks",
    note: "Inside the spread of the professional packages on 88 of 94 measures. Run on a graphics card on 25 Oct 2026, rescored today. Two misses on a laboratory dam break, four on a river-floodplain test.",
    source: "FloodSim · node benchmarks/ea/score.mjs" },
  { engine: "heat", model: "HeatSim", test: "Unit tests", kind: "known-answer", passed: 132, failed: 0, other: 1, unit: "tests",
    note: "The one other needs a buildings data host the test machine can't reach.", source: "HeatSim 0.6.1 · pytest" },
  { engine: "heat", model: "HeatSim", test: "Known-answer sandbox", kind: "known-answer", passed: 47, failed: 3, other: 4, unit: "cases",
    note: "Each answer and pass rule fixed before the case ran. All three failures were predicted beforehand: heat carried past the edge of a city patch, a plume 0.3 % over its 5 % limit, and bone-dry soil still giving up a little water.",
    source: "HeatSim 0.6.1 · python -m sandbox.run" },
  { engine: "wind", model: "WindSim", test: "Unit tests", kind: "known-answer", passed: 224, failed: 0, other: 2, unit: "tests",
    note: "One needs a data host the test machine can't reach; one needs a graphics card.", source: "WindSim · pytest" },
  { engine: "wind", model: "WindSim street model", test: "AIJ wind-tunnel cases", kind: "benchmark", passed: 2, failed: 4, other: 0, unit: "case and engine pairs",
    note: "Passes the single building on both engines. Fails every case with more than one building, so street-level wind stays out of reports.",
    source: "WindSim · windsim rescore (post hoc) and docs/validation.md" },
  { engine: "wind", model: "WindSim storm gusts", test: "Blind check at five new cities", kind: "held-out", passed: 2, failed: 5, other: 1, unit: "place and storm-type checks",
    note: "Cities chosen by a rule written and published before any of their data was read. Ordinary storms pass at Washington and Atlanta and fail at Houston and Los Angeles; thunderstorms fail at all three cities that had them; New York could not be scored (no airport in its exposure class).",
    source: "WindSim · windsim layer1 check, amendment A3" },
  { engine: "ground", model: "SPARC InSAR", test: "Synthetic towns", kind: "known-answer", passed: 4, failed: 0, other: 0, unit: "towns",
    note: "Quiet ground read as quiet; a planted sinkhole found with the year it started; a whole area sinking found; a faulty reference point caught and held back.",
    source: "climate-home-inspection · tools/gate4/synthetic.py" },
  { engine: "pipeline", model: "Report pipeline", test: "Report and evidence tests", kind: "known-answer", passed: 469, failed: 0, other: 6, unit: "tests",
    note: "The six others are expected failures marked in advance.", source: "climate-home-inspection · pytest" },
  { engine: "pipeline", model: "codelen scorer", test: "Self-tests", kind: "known-answer", passed: 16, failed: 0, other: 1, unit: "tests",
    note: "The scorer that will rate every model's stated range in bits. One cross-check needs a repository that isn't on the test machine.", source: "gridzip-lab · python -m codelen.test_codelen" },
];

export interface GateRow {
  label: string;
  /** Share within the tolerance, 0 to 1. */
  value: number;
  gate: number;
  /** The plain comparison, if one was scored: share within 25 % for the average of nearby airports. */
  baseline?: number;
  note?: string;
}

/** AIJ wind tunnel, share of points within 25 % (VDI 3783-9). Gate 66 %. */
export const AIJ_ROWS: GateRow[] = [
  { label: "A · one building · RANS", value: 0.71, gate: 0.66 },
  { label: "A · one building · LBM", value: 0.747, gate: 0.66 },
  { label: "B · one wide slab · RANS", value: 0.612, gate: 0.66, note: "18 Nov record, earlier tolerance" },
  { label: "C · 3×3 blocks · RANS", value: 0.375, gate: 0.66 },
  { label: "C · 3×3 blocks · LBM, blind", value: 0.394, gate: 0.66 },
  { label: "D · tower among blocks · RANS", value: 0.515, gate: 0.66, note: "18 Nov record, earlier tolerance" },
];

/** Layer 1 storm gusts, share of storm-and-airport pairs within 25 %. Gate 80 % (and median within 15 %). */
export const GUST_CALIBRATION: GateRow[] = [
  { label: "South St, Philadelphia", value: 0.87, gate: 0.8, baseline: 0.88 },
  { label: "NE Philadelphia", value: 0.9, gate: 0.8, baseline: 0.9 },
  { label: "Dallas-Fort Worth", value: 0.89, gate: 0.8, baseline: 0.91 },
  { label: "Miami", value: 0.98, gate: 0.8, baseline: 0.98 },
  { label: "Chicago", value: 0.94, gate: 0.8, baseline: 0.94 },
  { label: "Denver", value: 0.94, gate: 0.8, baseline: 0.94 },
];

export const GUST_BLIND: GateRow[] = [
  { label: "Los Angeles", value: 0.786, gate: 0.8, baseline: 0.803 },
  { label: "Houston", value: 0.784, gate: 0.8, baseline: 0.784, note: "hurricanes not separated" },
  { label: "Washington", value: 0.926, gate: 0.8, baseline: 0.938 },
  { label: "Atlanta", value: 0.871, gate: 0.8, baseline: 0.857 },
];

export const PLAIN = {
  kicker: "how we test",
  title: "Every model is tested where the answer is already known.",
  lead:
    "Before a model says anything about a street, it has to give back answers we already know: made-up scenes with exact solutions, public benchmarks other modellers are scored on, and real measurements it never saw. This is every test we ran on one day, failures at the same size as passes.",
  stance: [
    "We are an environmental screening service, not an engineering firm. Our models have been built and tested on synthetic storms, exact physics and public benchmarks, and what they show about a property is what that tested physics says about the neighbourhood around it.",
    "That is not a promise that a flood, a heatwave or a storm will do any particular thing to a house. It is not a survey, an inspection or a stamped engineering study, and it does not replace one.",
    "What it can give you is a level of confidence and the right questions to ask, before you've signed anything, from someone with no stake in the sale.",
  ],
  failuresTitle: "What failed, plainly.",
  failures: [
    "Flood: simplified street-drain rules miss their fuller references in about two of every three checks. Against measured flood levels in real storms, mostly beside rivers, FloodSim was off by 0.6 to 0.85 m against its own 0.15 m bar.",
    "Heat: three sandbox cases fail, each predicted before it ran. In the afternoon HeatSim does no better than the nearest weather station.",
    "Wind, street model: fails every wind-tunnel case with more than one building, reading street speeds about 1.3 times too high (LBM) or 0.64 times too low (RANS). It is not in any report.",
    "Wind, storm gusts: on the blind check at new cities, ordinary storms passed at two of four (Washington, Atlanta) and missed the 80 % mark by one to two points at Houston and Los Angeles. Thunderstorm gusts failed everywhere they were tested. The model does no better than simply averaging the nearby airports' gusts.",
    "Ground: the planted-movement test passed at one of our three real test places and failed at two, so ground readings there are held back.",
  ],
  limitsTitle: "What testing does not prove.",
  limits: [
    "Nothing here was measured at a house we report on. Every result in a report says how much stands behind it.",
    "A pass on a synthetic town or a wind tunnel shows the method can be right. It does not show it is right on your street.",
    "We never change a pass mark after seeing a result, and a failure is published as a result.",
  ],
};
