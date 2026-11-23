/**
 * The four engines behind the paid shelves, in one place.
 *
 * The models page, the place page, the order flow (/start) and the workspace
 * preview (/workspace) all read this list, so a sentence about an engine is
 * written once. A new hazard is a new entry here and a new row on the place
 * page (site-redesign-brief.md §4: hazards as rows, three shelves each).
 *
 * Where each sentence comes from. Every engine is SPARC Labs' own, kept in its
 * own repository. Each was opened on 18 November 2026 at the commit given.
 *
 *   FloodSim       README at faf45a9: a 2D urban flood model that builds a 1 m
 *                  model from open data and solves shallow-water flow on the
 *                  graphics card in the browser (WebGPU). Design storms from
 *                  NOAA Atlas 14; past rain from radar (MRMS).
 *   HeatSim        README at b3d8626: hourly street air temperature, humidity
 *                  and PET (in sun, building shade and tree shade) on a 300 m
 *                  grid; scenarios for trees, depaving, cool roofs and cool
 *                  pavement. The model card rules out "this measure cools this
 *                  street by X".
 *   insar_pipeline README at 3612eda: ground movement from Sentinel-1 radar,
 *                  processed end to end on one workstation, compared with the
 *                  site's own undisturbed ground, graded against GNSS stations,
 *                  and refusing readings it has failed on (fast mining
 *                  subsidence). Kyle's own repository only (Climate Inspection
 *                  DECISIONS.md D25). Insar_Pipeline_KF is never opened.
 *                  What is free and what is paid, the hundred-metre reading,
 *                  the rings, "detectable from", the research label on the
 *                  seasonal swing, the ten-year band with no damage threshold,
 *                  the review hold and the words never used: Climate
 *                  Inspection DECISIONS.md D38 and D39 (18 November 2026).
 *   WindSim        README and docs/design.md at cc15851: winds through urban
 *                  terrain on OpenFOAM, on a workstation. Its outputs include
 *                  Hazus damage ratios and an optional dollar loss; this site
 *                  shows neither (no dollar figures, brief §9). Kyle: wind on
 *                  this site is "a map of seasonal movement, not a detailed
 *                  model" (brief §4).
 *
 * What this file may NOT say: that any engine is validated for a place, that
 * any is on sale or runnable from the site today, any run time, any price.
 * An error figure appears only as the engine's own, with where it was
 * measured (climate-home-inspection docs/validation/VALIDATION-STATUS.md
 * §3.3). Words revised 22 November 2026 against that file at 4c25efc; the
 * sources are listed in docs/copy/SITE-COPY.md. What each engine passed and
 * failed lives in src/lib/copy/receipts.ts, not here.
 */

export type EngineId = "flood" | "heat" | "ground" | "wind";

/** Where the computing happens, which decides what a visitor can do alone. */
export type RunsOn = "your-gpu" | "our-server" | "our-workstation";

export interface Engine {
  id: EngineId;
  /** The hazard, as a row title on a place page. */
  hazard: string;
  /** The engine's own name. */
  name: string;
  runsOn: RunsOn;
  /** Where it runs, in a sentence for a buyer. */
  where: string;
  /** One or two sentences: what it does, without a number. */
  summary: string;
  /** What every report carries for this hazard at no charge. Omitted where
   *  nothing is free yet. */
  free?: string[];
  /** What a buyer reads on the Modelled shelf (directive §4, §13). */
  findings: string[];
  /** The choices a paying user makes before a run. Words only: these are
   *  drawn inside placeholder panels, which may hold no digit. */
  choices: string[];
  /** What-if projects. Empty means none is offered. */
  whatIf: string[];
  /** A sentence on what the what-if shelf is, when there is one. */
  whatIfNote: string;
  /** Things this engine's results will never be used to say on this site. */
  never: string[];
  /** Can a subscriber start a run themself, or is it run for them? */
  selfServe: "run-it-yourself" | "queued-for-you" | "run-for-you";
  /** What an order shows when a section is held back for review. */
  held?: string;
  /** The status line, honest about today. */
  status: string;
  /** Repository and the commit the sentences above were read at. */
  source: { repo: string; commit: string };
}

export const ENGINES: Engine[] = [
  {
    id: "flood",
    hazard: "Flood",
    name: "FloodSim",
    runsOn: "your-gpu",
    where: "On your own computer's graphics card, in Chrome or Edge. Nothing heavy runs on our side.",
    summary:
      "Builds a model of the neighbourhood at one-metre detail from public data (the terrain survey, building outlines, streets, land cover, soils and the official rainfall statistics) and follows the water through it, street by street. One metre is the detail of the map, not its accuracy: against measured flood levels in other places FloodSim was off by 0.6 to 0.85 m, so every result is labelled exploratory.",
    findings: [
      "Whether water reaches the outside of the house",
      "How deep it stands beside the house and in the street",
      "How far away deeper water is",
      "How that changes from storm to storm",
    ],
    choices: [
      "A storm expected about once in ten years",
      "A storm expected about once in a hundred years",
      "A storm expected about once in five hundred years",
      "Each one as a single hard hour, or spread over a whole day",
      "A named past storm, replayed from radar",
      "A storm you design yourself",
    ],
    whatIf: ["Rain garden", "French drain", "Paving taken up", "Rain barrels", "Permeable paving"],
    whatIfNote:
      "Things one owner can do. The model runs again with the project in place and shows what changes in the model. It is not a measurement, a design or a promise.",
    never: [
      "Water above the first floor, unless the floor's height is known from a survey",
      "Anything about the basement",
      "A loss, a premium or a payback figure",
    ],
    selfServe: "run-it-yourself",
    status: "The engine works on a desktop. It is not in the site yet.",
    source: { repo: "Kyle-Wire/FloodSim", commit: "faf45a9" },
  },
  {
    id: "heat",
    hazard: "Heat",
    name: "HeatSim",
    runsOn: "our-server",
    where: "On our server. You choose the run; it is queued and you are told when it is ready.",
    summary:
      "Models street-level air temperature hour by hour, and PET, an outdoor comfort index, in sun, in building shade and in tree shade. The air temperature has been checked against street sensors in other cities, not yet in Philadelphia; PET has not been checked against any measurement. Surface temperature measured by satellite sits on the same shelf, as a measurement rather than a model.",
    findings: [
      "Surface temperature of the block against the neighbourhood, measured from above",
      "Street air temperature in the afternoon",
      "Street air temperature at night",
      "Outdoor comfort (PET) in sun against shade, modelled",
    ],
    choices: ["A recent hot spell", "A typical summer month", "Day and night shown apart"],
    whatIf: ["Trees planted", "Paving taken up", "Cool roof", "Cool pavement"],
    whatIfNote:
      "Shown as a change across the neighbourhood, not as a promise about one street. The model's own card rules out saying a measure cools a street by a set amount.",
    never: [
      "A count of hot days",
      "Indoor temperature",
      "Surface, air and comfort temperatures mixed or averaged together",
    ],
    selfServe: "queued-for-you",
    status: "The engine runs from a command line. It is not on a server yet.",
    source: { repo: "Kyle-Wire/HeatSim", commit: "b3d8626" },
  },
  {
    id: "ground",
    hazard: "Ground movement",
    name: "SPARC InSAR",
    runsOn: "our-workstation",
    where:
      "On our workstation. The radar for the place is gathered and processed for you; you then read and explore the result.",
    summary:
      "Reads how the ground has moved over years from satellite radar, which passes over the same ground on a regular repeat schedule, through cloud and at night. Each reading describes the ground the house stands on, averaged over about a hundred metres around it, not the house itself. Readings are along the satellite's line of sight, not straight up and down, and have not yet been checked against a GNSS station at any place we report on.",
    free: [
      "Whether the ground the house stands on moves toward or away from the satellite, against the ground around it, from NASA's OPERA ground-motion product, with its range and its label",
      "The USGS map of ground prone to sinkholes",
    ],
    findings: [
      "Whether that ground moves with its surroundings or on its own, against a near ring and a wide ring",
      "Whether the rate is steady, or a change detectable from a given year, with the rates before and after",
      "The seasonal swing, labelled research until it passes its test",
      "Ten years ahead: the ground at the house against the wide ring, with a band that widens",
    ],
    choices: ["The years of radar to read", "Our own full processing of the place, beside NASA's product"],
    whatIf: ["Ten years ahead, against the wide ring"],
    whatIfNote:
      "The measured movement of the ground at the house against its wide surroundings, carried forward ten years with a band that widens. It names no point at which damage begins: radar blended over a block cannot measure strain across one house.",
    never: [
      "That ground is stable, has stopped or is safe; only whether it moves beyond what the satellite can detect there",
      "A sudden collapse: radar shows slow movement, not an overnight drop",
      "A number where the checks refuse a reading; the section says why instead",
      "Anything about the house's own foundation, or when damage would begin",
    ],
    held:
      "A ground section can be held for a person to review, for example when the ground at the house moves on its own or a new rate appears. The order then shows it as in review, not as failed. Our own full processing takes one to two days for a place and is shared by every property near it, so a paid order may wait on it.",
    selfServe: "run-for-you",
    status:
      "In every house report. Each reading carries its range and its label; what it has been checked against, and how it did, is on How we test.",
    source: { repo: "Kyle-Wire/insar_pipeline", commit: "3612eda" },
  },
  {
    id: "wind",
    hazard: "Wind",
    name: "WindSim",
    runsOn: "our-workstation",
    where: "On our workstation. Wind is worked out for the neighbourhood from every direction, then shown to you as a map.",
    summary:
      "Two layers. The first carries a storm's gusts in from the airport anemometers around a place, through the land cover upwind. The second models wind between the buildings, scored against wind-tunnel measurements.",
    findings: [
      "How wind moves through the neighbourhood, season by season",
      "Storm gusts for the block, carried in from nearby airport records, with their range",
      "Wind between the buildings around the house, with its range",
      "Past storm tracks nearby, from the public record",
    ],
    choices: ["A season", "Street level or roof level", "A named past storm, later"],
    whatIf: [],
    whatIfNote: "Being considered: how planting changes the wind near the house. Not offered yet.",
    never: [
      "A damage estimate or a dollar loss",
      "Whether the house meets a building code",
    ],
    selfServe: "run-for-you",
    status: "In every house report. Each finding carries its range and its label; what the model has been checked against, and how it did, is on How we test.",
    source: { repo: "Kyle-Wire/WindSim", commit: "cc15851" },
  },
];

export function engine(id: EngineId): Engine {
  const e = ENGINES.find((x) => x.id === id);
  if (!e) throw new Error(`no engine ${id}`);
  return e;
}

export const RUNS_ON_WORDS: Record<RunsOn, string> = {
  "your-gpu": "Your computer",
  "our-server": "Our server",
  "our-workstation": "Our workstation",
};

export const SELF_SERVE_WORDS: Record<Engine["selfServe"], string> = {
  "run-it-yourself": "You run it",
  "queued-for-you": "You choose, we queue it",
  "run-for-you": "We run it, you explore it",
};
