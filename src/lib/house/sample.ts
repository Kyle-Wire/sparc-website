/**
 * Sample A as the paid account shows it: the public demo at /example/account.
 * Headlines and figures are copied from src/lib/example/sample-a.ts, which
 * copies them from the property's evidence records (CHI tools/report/headlines.py).
 * A sample never marks the house, and this one names no address.
 */
import { LAYERS } from "@/lib/example/sample-a";
import type { HouseBundle } from "./types";

const head = (id: string) => LAYERS.find((l) => l.id === id)?.headline ?? "";

export const SAMPLE_HOUSE: HouseBundle = {
  kind: "sparc-house",
  version: 1,
  label: "Sample A · a South Street row house",
  about: "A Philadelphia row house with a small paved yard at the back. Every model was run for this house alone.",
  report: "1.0",
  hazards: [
    {
      key: "flood",
      headline: head("street"),
      line: "None of 24 design storms put water at the walls. The deepest beside the house is 3.5 in, at the rear.",
      lab: "ready",
    },
    {
      key: "heat",
      headline: head("surface"),
      line: "Feels like 109 °F in the sun at 3 PM on a typical July day, and 95 °F in building shade. That is PET, not the air temperature.",
      lab: "soon",
      when: "January",
    },
    {
      key: "ground",
      headline: head("ground"),
      line: "Ten years of satellite radar show no movement beyond the ±0.01 in a year it can detect here.",
      lab: "explore",
    },
    {
      key: "wind",
      headline: head("air"),
      line: "At the house, 10 m up, in the strongest tropical storm on record here (Sandy, 2012). Most likely 53 to 82 mph.",
      lab: "soon",
      when: "2027",
    },
    {
      key: "fire",
      headline: "Not run for this block",
      line: "Ash, our wildfire model, runs where wildland meets homes. It was not run for this city block.",
      lab: "not_here",
    },
  ],
  floodLab: { offered: true },
};
