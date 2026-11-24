// The worked example on /example: Sample A, a rowhouse block on South Street,
// Philadelphia. Every number below is copied from that property's evidence
// records in Climate Home Inspection (data/evidence/PHL-POC-001/records.json at
// main ede5fdf, read 24 Nov 2026), and every headline is what that repo's
// tools/report/headlines.py prints for those records. Nothing is typed from
// memory. Metric is converted to US units here, with the metric kept beside it.
//
// A sample never marks a real buyer's house: the map shows the block with no
// house picked out, and the address is withheld.
//
// Record ids are kept on each figure so the page can be re-checked against the
// records whenever the report is rebuilt.

export type LayerId = "air" | "surface" | "street" | "ground";

export interface Figure {
  big: string;
  small?: string;
  what: string;
  yardstick?: string;
  record: string;
}

export interface Layer {
  id: LayerId;
  n: string;
  name: string;
  hazard: string;
  headline: string;
  lead: string;
  figures: Figure[];
  level: string;
  page?: string;
}

export const SAMPLE_A = {
  name: "Sample A",
  place: "A rowhouse block on South Street, Philadelphia",
  pdf: "/samples/sample-report-a.pdf",
  block: "A 600 m by 524 m rectangle of the model (about 2,000 by 1,700 ft), 1 m detail",
};

export const LAYERS: Layer[] = [
  {
    id: "air",
    n: "01",
    name: "The air",
    hazard: "Wind",
    headline: "Storm gusts reach about 67 mph.",
    lead:
      "We took the strongest storms on record near the block, tropical storms, ordinary storms and thunderstorms since 1950, and ran the wind through the streets around the house at 2 m detail.",
    figures: [
      {
        big: "67 mph",
        small: "30 m/s",
        what: "gust at the house, 10 m up, in the strongest tropical storm on record here (Sandy, October 2012)",
        yardstick: "most likely 53 to 82 mph",
        record: "W2",
      },
      {
        big: "53 mph",
        what: "strongest street gust at head height within 25 m of the house (April 2020 thunderstorm)",
        yardstick: "between 26 and 60 mph once the model's own street error is carried over",
        record: "W5",
      },
      {
        big: "9 psf",
        what: "strongest average suction on a roof panel near the house, Sandy",
        yardstick: "between 5 and 13 psf; suction is what lifts shingles and siding",
        record: "W7",
      },
    ],
    level: "Limited evidence: modelled, with no wind measured at this block to check it.",
  },
  {
    id: "surface",
    n: "02",
    name: "The surface",
    hazard: "Heat",
    headline: "Shade feels 20 °F cooler.",
    lead:
      "Feels-like temperature (PET) puts sun, shade, wind and humidity into one number. It is not the air temperature, and the report never mixes the two.",
    figures: [
      {
        big: "20 °F",
        small: "11 °C",
        what: "how much cooler shade felt than sun near the house, 3 pm on the hottest day of July 2025",
        yardstick: "about 55 % of the ground was in building shade, 5 % in tree shade",
        record: "H10",
      },
      {
        big: "109 °F",
        small: "42.5 °C PET",
        what: "feels-like in the sun at 3 pm on a typical July day; 95 °F (34.8 °C) in building shade",
        yardstick: "a typical day's range, 103 to 114 °F",
        record: "H9",
      },
      {
        big: "15 %",
        what: "tree canopy within 100 m of the house",
        yardstick: "against 19 % for the neighbourhood and 24 % for the city",
        record: "H4",
      },
    ],
    level: "Canopy and surface heat are measured; feels-like and air temperature are modelled.",
  },
  {
    id: "street",
    n: "03",
    name: "The street",
    hazard: "Flood",
    headline: "Water stays at the curb.",
    lead:
      "We rained six design storms on every roof and street of the block, drains and sewers included, four ways each, then replayed the real rain of Ida.",
    figures: [
      {
        big: "0 of 24",
        what: "storms put water at the house's walls",
        yardstick: "six storm sizes, from 10-year to 500-year, four ways each",
        record: "F1",
      },
      {
        big: "3.5 in",
        small: "9 cm",
        what: "deepest water beside the house, at the rear",
        yardstick: "below the top of a sneaker",
        record: "F2",
      },
      {
        big: "56 ft",
        small: "17 m",
        what: "to the nearest water 6 in (15 cm) deep",
        yardstick: "about four car lengths",
        record: "F3",
      },
    ],
    level: "Limited evidence for the model runs; the FEMA zone and the post-Ida inspections are read from the public record.",
  },
  {
    id: "ground",
    n: "04",
    name: "The ground",
    hazard: "Settling",
    headline: "The ground here is holding still.",
    lead:
      "Ten years of satellite radar, 2016 to 2025, compared against the ground 500 m to 2 km away, plus the state's map of sinkholes and karst.",
    figures: [
      {
        big: "±0.01 in",
        small: "±0.3 mm a year",
        what: "the smallest yearly movement the satellite can detect here; the block shows none beyond it",
        yardstick: "a year's worth is about three sheets of paper",
        record: "G1",
      },
      {
        big: "0 in",
        small: "band −4 to +4 mm",
        what: "projected movement over about 9 years if the past rate holds",
        yardstick: "at most the thickness of three stacked dimes",
        record: "G5",
      },
      {
        big: "0",
        what: "recorded karst features within 2 km; not in a karst-prone area",
        yardstick: "Pennsylvania DCNR's inventory, which calls itself incomplete",
        record: "G6",
      },
    ],
    level: "Moderately supported: measured from space at a scale that fits the statement.",
  },
];

/** What the report will not say, from the records marked "insufficient information". */
export const NOT_SAID = [
  { record: "F7", text: "Whether water could enter the basement was not assessed. It needs the basement's floor drain, backflow valve and history." },
  { record: "H11", text: "How hot the house gets indoors was not assessed. It needs the roof insulation, the windows and whether the cooling works." },
  { record: "P3", text: "The first floor's height above the ground is not known, so nothing is said about water above floor level." },
];

export const FLOOD_YARDSTICKS = [
  { cls: "2–4 in", cm: "5–10 cm", what: "wet street, puddles at the drains" },
  { cls: "4–6 in", cm: "10–15 cm", what: "up to the top of a curb" },
  { cls: "6–12 in", cm: "15–30 cm", what: "over the curb, onto the sidewalk" },
  { cls: "12–20 in", cm: "30–50 cm", what: "up a front step" },
  { cls: "20 in +", cm: "50 cm +", what: "knee deep" },
];

export const HEAT_YARDSTICKS = [
  { cls: "under 95 °F", cm: "under 35 °C", what: "warm, bearable" },
  { cls: "95–106 °F", cm: "35–41 °C", what: "hot in the sun" },
  { cls: "106–117 °F", cm: "41–47 °C", what: "heat stress for most people" },
  { cls: "117–127 °F", cm: "47–53 °C", what: "strong heat stress" },
  { cls: "over 127 °F", cm: "over 53 °C", what: "extreme; get into shade" },
];

export const WIND_YARDSTICKS = [
  { cls: "under 30 %", cm: "", what: "sheltered, behind the rows" },
  { cls: "30–50 %", cm: "", what: "eased by the buildings" },
  { cls: "50–70 %", cm: "", what: "about half the storm" },
  { cls: "70–90 %", cm: "", what: "most of the storm" },
  { cls: "over 90 %", cm: "", what: "the full storm: open ground, funnels" },
];
