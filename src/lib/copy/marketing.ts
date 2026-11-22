// Marketing words, in one place.
//
// Layout lives in the components; the words a visitor reads on the marketing
// pages live here, so the copy can be rewritten without touching layout.
// Owner: the writer (project thread "Write website copy with honest voice").
// First draft by the branding thread, 22 Nov 2026, to the brief in
// docs/design/brand-and-conversion.md.
//
// Rules every line here keeps (climate-home-inspection
// docs/validation/VALIDATION-STATUS.md s.3.1, and docs/design/map-first-brief.md s.7):
//   - never "predict", "accurate", "validated" (of a result), "safe", "risk score" (ours),
//     "will flood", "likely", a dollar figure, a premium, a loss, or a hot-day count;
//   - free readings describe the area, never the house;
//   - model results are "exploratory" until a measurement of the same thing agrees;
//   - no pressure devices: no countdowns, no "only n left", no fake viewers, no fake reviews.
// A line that needs a number gets it from data at render time, never typed here.

export const HERO = {
  kicker: "how it works",
  title: "Your inspector checks the house. Who checks the block?",
  lead:
    "Water, heat, shifting ground and wind don't stop at the property line. Look up what public agencies " +
    "have on record about any US block, free. Then, if you want it, get our models' read on one house.",
  searchHelp: "Free. No account. We use the address to find the block, then we drop it.",
};

/** Questions the free record answers. Each is a register we read, named by its publisher. */
export const REMEMBERS = {
  kicker: "what your block remembers",
  title: "Every block has a past. Most people never get to read it.",
  lead:
    "It's all public. It's just scattered across a dozen agency websites that weren't built for people buying a house. " +
    "We put it on one page.",
  items: [
    { q: "Is it in a FEMA flood zone?", src: "FEMA · National Flood Hazard Layer", hazard: "flood" },
    { q: "Have people nearby made flood insurance claims?", src: "FEMA · OpenFEMA claims, by census tract", hazard: "flood" },
    { q: "How many federal disasters has the county been through?", src: "FEMA · disaster declarations", hazard: "storm" },
    { q: "Which hurricanes and tropical storms passed close?", src: "NOAA · HURDAT2 storm tracks", hazard: "wind" },
    { q: "Is the ground higher or lower than the streets around it?", src: "USGS · 3D Elevation Program", hazard: "flood" },
    { q: "How far is the nearest mapped fault or landslide?", src: "USGS · faults and landslide inventory", hazard: "ground" },
    { q: "How much of the block is trees, and how much is pavement?", src: "USGS and partners · NLCD 2021", hazard: "heat" },
    { q: "How does FEMA rate the tract across eighteen hazards?", src: "FEMA · National Risk Index", hazard: "storm" },
  ],
} as const;

export const TWO_QUESTIONS = {
  kicker: "free, and paid",
  title: "Two different questions. So the free part never has to hold back.",
  free: {
    name: "The block record",
    tag: "free · no account · any US address",
    question: "What's on public record around here?",
    points: [
      "Every public record we can read, in full. Nothing blurred, nothing behind a sign-up.",
      "Plain-English cards with the source and date on each one.",
      "Questions to take to the seller, the inspector and the insurer.",
      "Save places and compare up to four, kept in your own browser.",
    ],
    cta: "Look up a block",
  },
  paid: {
    name: "The house report",
    tag: "paid · one house",
    question: "What do our models say about this house?",
    points: [
      "Our flood, heat, ground movement and wind models, run for the neighbourhood with your house in the middle.",
      "Findings first, with a label on each saying how much evidence stands behind it.",
      "What to check at the house, and the limits of every finding, one click away.",
    ],
    cta: "See a sample report",
  },
};

export const STEPS = {
  kicker: "three steps",
  title: "From an address to something you can act on.",
  items: [
    { n: "01", t: "Type an address", b: "Any address in the US. We find the block and forget the house number." },
    { n: "02", t: "Read the record", b: "Flood, heat, ground and wind, as the agencies publish them, each with where it came from." },
    { n: "03", t: "Ask the models, if you want", b: "The house report runs our own models around one property. Look at the sample before you decide." },
  ],
};

export const RECEIPTS = {
  kicker: "our receipts",
  title: "We grade our own homework. In public.",
  lead:
    "A model is only as good as what it's been checked against. Here's where each of ours stands today, " +
    "including the parts that haven't passed yet. We'd rather you hear it from us.",
};

export const NEVER = {
  kicker: "the fine print, in big print",
  title: "Things we will never tell you.",
  items: [
    { t: "That a house is safe.", b: "No model can promise that. Anyone who does is selling something." },
    { t: "A dollar figure for a disaster.", b: "No expected losses, no premiums, no payback. We show what happened and what the models show." },
    { t: "A risk score we made up.", b: "FEMA's ratings are shown as FEMA's. We don't invent a number and paint it red." },
    { t: "That a result is validated before it's measured.", b: "Every model result says how much evidence stands behind it." },
    { t: "Your address, to anyone.", b: "Links carry the block, not the house. Saved places stay in your browser." },
  ],
};

export const CLOSER = {
  title: "Go on. Look up the place you've been wondering about.",
  lead: "Your street, the house you're about to offer on, the place you grew up. A first look takes a few seconds.",
  cta: "Look up an address",
};

/** The one line at the end of each free hazard section on a place page:
 *  what the record cannot say, and that the report models it
 *  (docs/design/map-first-brief.md s.7 rule 3). */
export const OPEN_QUESTION: Record<"flood" | "heat" | "ground" | "wind", string> = {
  flood: "The flood map shows the zone. It can't say how deep water gets beside this house in a hard storm. The house report models that.",
  heat: "Land cover shows trees and pavement. It can't say how hot the air gets on this street on a summer night. The house report models that.",
  ground: "Fault and landslide maps show what's nearby. They can't say whether the ground under this house is moving. The house report reads that from satellite radar.",
  wind: "FEMA counts storms for the whole tract. It can't say how wind moves between these buildings. The house report will model that once our wind model passes its checks.",
};

/** The record meter at the top of a place page (endowed progress, honestly counted). */
export const METER = {
  label: "this block's record",
  read: (n: number, of: number) => `${n} of ${of} public records answered`,
  open: (n: number) => `${n} questions only a model can answer`,
  openLink: "What the report adds",
};
