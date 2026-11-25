/**
 * One page per model (/models/<slug>), and the Models dropdown in the menu bar.
 *
 * Kyle, 25 Nov 2026 (thread "Redesign the website page layout"): a Models
 * overview page plus a page for each model, reached from a hover dropdown;
 * each page gets "some cool graphics ... an overview of each model, but in a
 * fun way" and "the variables that we're looking at in a small little table".
 * Every model gets an equal page (Ash must not read as "less than" because
 * wildfire is regional), Palm (hurricane) has one, and Bristlecone (the
 * checker) has one with a look of its own: tree rings, his favourite tree.
 *
 * Buyer names come from src/lib/model-names.ts (the grove). Engine names stay
 * in code and citations. The 'what goes in' tables name only inputs each
 * engine actually reads, checked on 25 Nov 2026 against:
 *   FloodSim   CLAUDE.md "Build pipeline" and "Forcing" (src/ingest.js: 3DEP,
 *              OSM, NLCD, SSURGO; src/storm.js Atlas 14; src/mrms.js; SWMM;
 *              src/compound.js tide and surge; src/streamstats.js rivers).
 *   HeatSim    README and src/heatsim/inputs.py (ESA WorldCover, GHSL built
 *              form, ERA5 from the Copernicus CDS, station observations);
 *              street.py (Overture footprints, Meta/WRI canopy height).
 *   InSAR      src/lib/engines.ts ground entry (Sentinel-1, NASA OPERA,
 *              GNSS ties, rings) and the USGS karst layer on the free map.
 *   WindSim    README (station records, WorldCover roughness per direction,
 *              terrain, buildings, 16 directions, Layer 1 gust chain).
 *   FireSim    README, firesim/real.py (LANDFIRE fuels and elevation, station
 *              weather, HRRR wind, building points) and rothermel.py.
 *   Hurricane  WindSim hurricane/ (HURDAT2 storm history, ERA5 training data,
 *              own weather model in hurricane/fm, ISD airport winds).
 *   Bristlecone gridzip-lab codelen/ and physlib (code length of misses,
 *              domain physics terms, shuffled-null guards).
 *
 * Copy is in finished form (Kyle, 23 Nov 2026). Test results stay on
 * /how-we-test, linked once per page, quietly.
 */
import { MODEL_NAMES, CHECKER_NAME } from "./model-names";

export type ModelSlug = "flood" | "heat" | "ground" | "wind" | "wildfire" | "hurricane" | "bristlecone";

export interface ModelVariable {
  /** What the model reads, in plain words. */
  v: string;
  /** What it does with it. */
  why: string;
  /** Where it comes from. */
  from: string;
}

export interface ModelPage {
  slug: ModelSlug;
  name: string;
  hazard: string;
  /** CSS colour token for the hazard. */
  color: string;
  /** One line for the dropdown and the overview. */
  line: string;
  /** The page's big promise. */
  title: string;
  lead: string;
  /** Why it has its name (from model-names.ts). */
  why: string;
  /** How it works, in three or four short steps. */
  steps: { t: string; b: string }[];
  /** What it tells you about a house. */
  tells: string[];
  /** What goes in. */
  variables: ModelVariable[];
  /** Things it never says. */
  never: string[];
  /** Where the work happens. */
  engine: string;
  /** Where its result shows up for a buyer. */
  where: string;
}

export const MODEL_PAGES: ModelPage[] = [
  {
    slug: "flood",
    name: MODEL_NAMES.flood.name,
    hazard: "Flood",
    color: "var(--flood)",
    line: "Where the water goes on your street in a hard storm.",
    title: "Every raindrop, followed down your street.",
    lead: "Alder builds the neighbourhood at one-metre detail from public data, rains a storm on it, and follows the water through the streets, yards and pipes until it stops. Then it reads the depth at the walls of the house.",
    why: MODEL_NAMES.flood.why,
    steps: [
      { t: "Build the block", b: "Ground height from the lidar survey, every building, the kerbs, the soils and what covers the ground, at one metre." },
      { t: "Rain on it", b: "Storms expected about once in 10, 100 and 500 years, as a hard hour or a long day, plus a real past storm replayed from radar." },
      { t: "Follow the water", b: "Water runs downhill, around buildings, into drains and pipes, and pools in the low spots, second by second." },
      { t: "Read the walls", b: "How deep it stands beside the house and in the street, in each storm, with a range on every depth." },
    ],
    tells: [
      "Whether water reaches the outside of the house",
      "How deep it stands beside the house and in the street",
      "How far away deeper water is",
      "How that changes from storm to storm",
      "What a rain garden or a French drain changes, in the model",
    ],
    variables: [
      { v: "Ground height", why: "Water runs downhill, so this decides almost everything", from: "USGS 3DEP lidar survey" },
      { v: "Buildings", why: "Water flows around them and roofs drain off them", from: "OpenStreetMap and national building outlines" },
      { v: "Streets and kerbs", why: "Streets are the channels water follows in a storm", from: "OpenStreetMap" },
      { v: "Land cover", why: "Grass slows water and soaks it up; paving speeds it on", from: "USGS National Land Cover Database" },
      { v: "Soils", why: "How fast rain soaks into the ground", from: "USDA soil survey (SSURGO)" },
      { v: "Storm rainfall", why: "How hard a 10, 100 or 500-year storm rains", from: "NOAA Atlas 14" },
      { v: "Past storms", why: "Rain as it actually fell, minute by minute", from: "NOAA radar rainfall (MRMS)" },
      { v: "Drains and pipes", why: "Where water leaves the street underground", from: "EPA SWMM, coupled to the surface" },
      { v: "Rivers, tide and surge", why: "Water arriving from outside the block", from: "USGS stream records, NOAA tide gauges" },
    ],
    never: [
      "Water above the first floor, unless the floor's height is known from a survey",
      "Anything about the basement",
      "A loss, a premium or a payback figure",
    ],
    engine: "FloodSim",
    where: "In every house report.",
  },
  {
    slug: "heat",
    name: MODEL_NAMES.heat.name,
    hazard: "Heat",
    color: "var(--heat)",
    line: "How hot the street gets, in sun and in shade, hour by hour.",
    title: "The street, through a hot day and the night after.",
    lead: "Ginkgo works out the air temperature on the street hour by hour, from the sun, the buildings, the trees and the paving around it. Then it works out how hot it feels to stand there, in sun, in building shade and under trees.",
    why: MODEL_NAMES.heat.why,
    steps: [
      { t: "Map the block", b: "Buildings and their heights, trees and their heights, paving, grass and water." },
      { t: "Bring in the weather", b: "Hourly weather for the place, checked each hour against the nearest official stations." },
      { t: "Balance the heat", b: "Sun in, heat stored in walls and paving, heat carried off by air and by plants, every hour, day and night." },
      { t: "Feel it", b: "Air temperature, and an outdoor comfort index (PET) that adds sun and shade to it." },
    ],
    tells: [
      "Street air temperature in the afternoon and at night",
      "How hot it feels in sun, in building shade and under trees",
      "How the block compares with the neighbourhood",
      "What trees, less paving or a cool roof change, in the model",
    ],
    variables: [
      { v: "Hourly weather", why: "Air temperature, humidity, wind and sunshine above the city", from: "ERA5 (Copernicus Climate Data Store)" },
      { v: "Weather stations", why: "Anchor the model to what was measured, each hour", from: "Official weather stations nearby" },
      { v: "What covers the ground", why: "Paving soaks up sun; grass and water cool", from: "ESA WorldCover" },
      { v: "Buildings", why: "Cast shade, store heat and trap it at night", from: "Overture Maps, GHSL built form" },
      { v: "Tree canopy", why: "Shade and cooling from leaves", from: "Meta and WRI canopy height map" },
      { v: "The sun's path", why: "Where sun and shade fall, hour by hour", from: "Worked out for the date and place" },
    ],
    never: [
      "A count of hot days",
      "Indoor temperature",
      "Surface, air and comfort temperatures mixed together",
    ],
    engine: "HeatSim",
    where: "In every house report.",
  },
  {
    slug: "ground",
    name: MODEL_NAMES.ground.name,
    hazard: "Ground movement",
    color: "var(--ground)",
    line: "Whether the ground under the house is moving, from space.",
    title: "Millimetres of movement, measured from orbit.",
    lead: "Yew reads years of satellite radar that passes over the same ground every few days, through cloud and at night. It measures whether the ground the house stands on is rising or sinking, and whether it moves with the land around it or on its own.",
    why: MODEL_NAMES.ground.why,
    steps: [
      { t: "Listen from orbit", b: "A radar satellite passes over the same ground on a regular schedule and records the distance to it." },
      { t: "Stack the years", b: "Years of passes are lined up, so tiny changes in distance become a rate of movement." },
      { t: "Compare with the neighbours", b: "The ground at the house is read against a near ring and a wide ring of ground around it." },
      { t: "Tie it down", b: "Readings are tied to GPS stations where the place has them, and each carries its range." },
    ],
    tells: [
      "Whether the ground moves with its surroundings or on its own",
      "Whether the rate is steady, or changed in a given year",
      "The seasonal swing, as the ground wets and dries",
      "Ten years ahead, with a band that widens",
    ],
    variables: [
      { v: "Satellite radar", why: "The distance to the ground, pass after pass", from: "Sentinel-1 (ESA Copernicus)" },
      { v: "Ground motion product", why: "A second, independent reading of the same ground", from: "NASA OPERA" },
      { v: "Surrounding ground", why: "A near ring and a wide ring to compare the house's ground with", from: "Worked out from the same radar" },
      { v: "GPS stations", why: "Fixed points that tie the radar to true movement", from: "Public GNSS stations" },
      { v: "Sinkhole-prone ground", why: "Where the rock below can dissolve", from: "USGS karst map" },
      { v: "Time", why: "Years of passes turn millimetres into a rate", from: "Every pass since the satellite started" },
    ],
    never: [
      "That ground is stable, has stopped or is safe",
      "A sudden collapse: radar shows slow movement, not an overnight drop",
      "Anything about the house's own foundation",
    ],
    engine: "our own radar processing",
    where: "In every house report.",
  },
  {
    slug: "wind",
    name: MODEL_NAMES.wind.name,
    hazard: "Wind",
    color: "var(--wind)",
    line: "How storm gusts squeeze between the buildings around you.",
    title: "Storm gusts, squeezed between the buildings.",
    lead: "Poplar starts from decades of airport wind records around the place and carries a storm's gusts in across the land. Then it models the wind between the buildings around the house, from every direction, where gaps and corners speed it up.",
    why: MODEL_NAMES.wind.why,
    steps: [
      { t: "Read the records", b: "Decades of gusts from the airport wind gauges around the place, storm type by storm type." },
      { t: "Carry them in", b: "Gusts slow over forests and towns and speed up over open ground and hills on the way to the block." },
      { t: "Build in 3D", b: "The buildings around the house, with the ground they stand on." },
      { t: "Blow from every side", b: "Wind from sixteen directions, so every gap, corner and sheltered yard shows up." },
    ],
    tells: [
      "Storm gusts for the block, with their range",
      "Where wind speeds up or drops between the buildings",
      "How that changes by wind direction and season",
      "Past storm tracks nearby, from the public record",
    ],
    variables: [
      { v: "Wind records", why: "Decades of measured gusts, by storm type", from: "NOAA airport weather stations" },
      { v: "Land cover upwind", why: "Forests and towns slow wind; open water and fields don't", from: "ESA WorldCover" },
      { v: "Terrain", why: "Hills and ridges speed wind up", from: "USGS 3DEP" },
      { v: "Buildings", why: "Gaps and corners funnel wind; walls shelter yards", from: "Public building outlines and heights" },
      { v: "Wind direction", why: "Each of sixteen directions is run on its own", from: "Weighted by how often each blows" },
    ],
    never: [
      "A damage estimate or a dollar loss",
      "Whether the house meets a building code",
    ],
    engine: "WindSim",
    where: "In every house report.",
  },
  {
    slug: "wildfire",
    name: MODEL_NAMES.fire.name,
    hazard: "Wildfire",
    color: "var(--fire)",
    line: "How a wildfire and its embers would travel toward the house.",
    title: "The fire front, the embers ahead of it, and the house.",
    lead: "Ash follows a wildfire across the land around a place from what grows there, the slope and the wind. It carries embers ahead of the flames and works out which houses the flames and embers can reach, and from which side.",
    why: MODEL_NAMES.fire.why,
    steps: [
      { t: "Read the land", b: "What grows there and how much of it, the slope, and the roads and clearings that can stop a fire." },
      { t: "Bring the wind", b: "Hour-by-hour wind, shaped by the hills, on a dry and windy day." },
      { t: "Spread the fire", b: "The front moves faster uphill and downwind, through grass, brush and tree crowns." },
      { t: "Throw the embers", b: "Embers lift ahead of the front and land on roofs, yards and the houses beyond." },
    ],
    tells: [
      "How fire would move across the land around the place, and how fast",
      "Where embers land ahead of the front",
      "Whether flames or embers reach the house, and from which side",
      "How that changes with stronger wind or drier fuel",
    ],
    variables: [
      { v: "Fuels", why: "What burns, and how fast: 40 types of grass, brush and timber", from: "LANDFIRE (USGS and US Forest Service)" },
      { v: "Slope", why: "Fire runs faster uphill", from: "LANDFIRE elevation" },
      { v: "Wind", why: "Pushes the front and carries embers", from: "NOAA HRRR wind, shaped by the terrain" },
      { v: "Dryness", why: "Dry fuel catches and spreads faster", from: "Weather stations nearby" },
      { v: "Embers", why: "Start new fires ahead of the front", from: "Carried by the modelled wind" },
      { v: "Houses", why: "How close they stand, and what they face", from: "Public building outlines" },
    ],
    never: [
      "That a house will or will not burn",
      "A damage estimate or a dollar loss",
      "Whether the house meets a fire code",
    ],
    engine: "FireSim",
    where: "In house reports for places wildfire can reach.",
  },
  {
    slug: "hurricane",
    name: "Palm",
    hazard: "Hurricane",
    color: "var(--hurricane)",
    line: "Our own hurricane model, from the open ocean to your coast.",
    title: "From the open ocean to your stretch of coast.",
    lead: "Palm is our own hurricane model, built from scratch. It learns how the atmosphere steers storms from decades of global weather, follows a storm toward the coast, and works out how hard its winds blow as it comes ashore.",
    why: "Palms bend almost flat in a hurricane and stand back up after it. Palm follows the storms that bend them.",
    steps: [
      { t: "Learn the sky", b: "Our own weather model learns how winds and pressure move, from decades of global weather." },
      { t: "Find the storm", b: "It tracks the storm's centre, its pressure and its winds as it moves." },
      { t: "Bring it ashore", b: "Where the storm crosses the coast, and how hard its winds blow over land." },
      { t: "Check it", b: "Its winds over land are scored against the gusts airport gauges actually measured." },
    ],
    tells: [
      "The storms that have passed near the place, and how strong they were",
      "How hurricane winds carry inland over the land around it",
      "Where its own storm tracks run, beside the official record",
    ],
    variables: [
      { v: "Storm history", why: "Every recorded Atlantic storm's track and strength", from: "NOAA HURDAT2, since 1851" },
      { v: "The atmosphere", why: "Winds and pressure at every height, around the world", from: "ERA5 (Copernicus)" },
      { v: "Steering winds", why: "The large-scale winds that push a storm along", from: "Worked out by our own weather model" },
      { v: "Coastline and land", why: "Storms weaken over land; rough ground slows their winds", from: "Land cover and terrain" },
      { v: "Airport winds", why: "Measured gusts to check its winds against", from: "NOAA airport weather stations" },
    ],
    never: [
      "Where a storm that is happening now will go: follow the National Hurricane Center",
      "When to evacuate or stay",
    ],
    engine: "our own hurricane model",
    where: "Our own research model for the storms that reach the coast.",
  },
  {
    slug: "bristlecone",
    name: CHECKER_NAME,
    hazard: "The checker",
    color: "var(--bristle)",
    line: "The model that checks every other model.",
    title: "The model that checks the others.",
    lead: "Bristlecone doesn't model a hazard. It reads every other model's misses against real measurements and asks one question: what physics would make these misses smaller? It is how our models find what they are missing.",
    why: "The oldest bristlecone pines are close to 5,000 years old, with every dry year and wet year packed into tight rings. Bristlecone packs a model's misses as tightly as it can, and reads what is left.",
    steps: [
      { t: "Gather the misses", b: "Where a model was compared with a real measurement, how far off it was, and where." },
      { t: "Pack them tight", b: "It writes those misses down as briefly as it can. Random misses can't be packed; misses with a pattern can." },
      { t: "Try the physics", b: "It tries formulas from the hazard's own physics, one at a time, and keeps the one that packs them tightest." },
      { t: "Name what's missing", b: "Only a formula that beats shuffled copies of the same data, in places it never saw, counts." },
    ],
    tells: [
      "Which piece of physics a model is missing, by name",
      "Whether a model's misses are just noise",
      "How many bits each model needs to describe the real world",
    ],
    variables: [
      { v: "A model's misses", why: "The gap between the model and what was measured", from: "Every test each model has faced" },
      { v: "Physics formulas", why: "A library of terms for each hazard: water, heat, ground, wind, fire, storms", from: "Written into Bristlecone, hazard by hazard" },
      { v: "Code length", why: "How many bits it takes to write the misses down", from: "Measured exactly, with a real coder" },
      { v: "Shuffled twins", why: "The same data scrambled, so luck can't pass for physics", from: "Made fresh for every test" },
      { v: "Held-out places", why: "A finding must work where it was never fitted", from: "Kept aside before each test" },
    ],
    never: [
      "Fit a number straight into a model: what it finds is a lead, then a protocol, then a test",
    ],
    engine: "gridzip-lab",
    where: "Behind every model on this site.",
  },
];

export function modelPage(slug: string): ModelPage | undefined {
  return MODEL_PAGES.find((m) => m.slug === slug);
}

/** The hazard models (everything except the checker), for the dropdown. */
export const HAZARD_MODELS = MODEL_PAGES.filter((m) => m.slug !== "bristlecone");
export const CHECKER_PAGE = MODEL_PAGES.find((m) => m.slug === "bristlecone")!;
