// The keys for the public map layers, as each publisher draws them.
//
// Every colour below was read from the publisher's own legend service on
// 22 November 2026, not picked by us: the map shows their tiles, so the key
// has to be theirs too (docs/design/data-ramps.md: "data colour never
// decorates"; map-first-brief.md s.2: layers keep their publishers' colours).
//
//   FEMA flood zones   hazards.fema.gov .../NFHL/MapServer/legend?f=json, layer 28
//                      (also copied whole by scripts/fetch-fema-legend.mjs)
//   Sea level rise     coast.noaa.gov .../dc_slr/slr_{1,3,6}ft/MapServer/legend?f=json
//                      (layers 0 "Low-lying Areas" and 1 "Depth", the same at every height)
//   Tree canopy        www.mrlc.gov geoserver GetLegendGraphic, format=application/json,
//                      layer nlcd_tcc_conus_2021_v2021-4 (a colour per whole percent)
//   Paving             the same, layer NLCD_2021_Impervious_L48
//   Landslides         tiles.arcgis.com .../US_Landslide_Susceptibility/MapServer/legend?f=json
//                      (classes 1 to 5, the same colours for every region)
//   Faults             earthquake.usgs.gov .../haz/Qfaults/MapServer/legend?f=json, layers 21, 22
//
// The words beside each colour are the publisher's, shortened. Nothing here
// is SPARC Labs model output.

export type Rgb = readonly [number, number, number];

export interface LegendClass {
  /** The publisher's own colour, as its legend gives it. */
  color: string;
  label: string;
}

export type LegendSpec =
  /** Fixed classes, each a swatch. */
  | { kind: "classes"; classes: LegendClass[]; shape?: "fill" | "line" }
  /** A continuous quantity: stops from low to high, with tick labels. */
  | { kind: "ramp"; stops: { at: number; color: string }[]; ticks: number[]; unit: string; lowWord?: string; highWord?: string }
  /** FEMA's own swatch images (hatched patterns cannot be a flat colour). */
  | { kind: "fema" }
  /** A drawn line of our own, for records we draw ourselves (storm tracks). */
  | { kind: "track" };

export type LayerKey = "fema" | "slr" | "canopy" | "paving" | "landslide" | "faults" | "tracks";
export type Hazard = "flood" | "heat" | "ground" | "storm";

export interface LayerInfo {
  key: LayerKey;
  hazard: Hazard;
  /** Short name for the chip. */
  chip: string;
  /** Full name for the legend title. */
  title: string;
  /** What the colour means, in one line. */
  what: string;
  publisher: string;
  vintage: string;
  /** How fine the publisher's map is, said plainly. */
  grain: string;
  legend: LegendSpec;
  /** Below this map zoom the publisher's server draws nothing. */
  minZoom?: number;
  /** True when hovering can read a class off the publisher's tile. */
  hoverable: boolean;
}

export const HAZARD_WORDS: Record<Hazard, string> = {
  flood: "Flood",
  heat: "Heat",
  ground: "Ground",
  storm: "Storms",
};

/* NLCD colour maps, every tenth entry of the publisher's 101-entry map. The
   entry for 0 is transparent in both, so "none" draws as no colour. */
export const CANOPY_STOPS = [
  { at: 10, color: "#bcc6bc" },
  { at: 20, color: "#a9bba9" },
  { at: 30, color: "#92b092" },
  { at: 40, color: "#7da77d" },
  { at: 50, color: "#699c69" },
  { at: 60, color: "#529052" },
  { at: 70, color: "#3d853d" },
  { at: 80, color: "#2a792a" },
  { at: 90, color: "#136d13" },
  { at: 100, color: "#006200" },
];

export const PAVING_STOPS = [
  { at: 10, color: "#d6bcbc" },
  { at: 20, color: "#dba8a8" },
  { at: 30, color: "#dd9393" },
  { at: 40, color: "#e27c7c" },
  { at: 50, color: "#e86868" },
  { at: 60, color: "#ea5151" },
  { at: 70, color: "#f23d3d" },
  { at: 80, color: "#ed82ed" },
  { at: 90, color: "#c64fed" },
  { at: 100, color: "#9e21ed" },
];

export const LANDSLIDE_CLASSES: LegendClass[] = [
  { color: "#fbd575", label: "1 · lowest" },
  { color: "#f7a814", label: "2" },
  { color: "#f18181", label: "3" },
  { color: "#e72124", label: "4" },
  { color: "#72100f", label: "5 · highest" },
];

/* NOAA's depth ramp runs from its "High" end (dark) to "Low" (light). */
export const SLR_DEPTH = { deep: "#3814a2", mid: "#468ee2", shallow: "#b7e5f2" };
export const SLR_LOW_LYING = "#55ff00";

/* Fault lines by when they last moved. USGS draws the line style by how well
   the location is known; the colour is the age, which is what is shown here. */
export const FAULT_CLASSES: LegendClass[] = [
  { color: "#ff0000", label: "Moved in the last 150 years" },
  { color: "#ffaa00", label: "Last 15,000 years" },
  { color: "#55ff00", label: "Last 130,000 years" },
  { color: "#0000ff", label: "Last 750,000 years" },
  { color: "#000000", label: "Last 1.6 million years" },
  { color: "#ffff00", label: "Age not given" },
];

/* The flat colours inside FEMA's swatches (alpha 77 of 255 in its images). */
export const FEMA_COLOURS: { color: string; zone: string; sfha: boolean }[] = [
  { color: "#00e5ff", zone: "1% annual chance flood hazard (the 100-year floodplain)", sfha: true },
  { color: "#ff0000", zone: "Regulatory floodway", sfha: true },
  { color: "#ff8100", zone: "0.2% annual chance flood hazard (the 500-year floodplain)", sfha: false },
  { color: "#f2e574", zone: "Area of undetermined flood hazard", sfha: false },
];

export const LAYERS: LayerInfo[] = [
  {
    key: "fema",
    hazard: "flood",
    chip: "Flood zones",
    title: "FEMA flood zones",
    what: "FEMA's map for insurance and building rules. Not a forecast of where water goes.",
    publisher: "FEMA, National Flood Hazard Layer",
    vintage: "current effective maps",
    grain: "drawn to the parcel scale, from town zoom in",
    legend: { kind: "fema" },
    minZoom: 11,
    hoverable: true,
  },
  {
    key: "slr",
    hazard: "flood",
    chip: "Sea level rise",
    title: "Sea level rise",
    what: "Where NOAA maps the sea at the highest daily tides if it stood this much higher than today.",
    publisher: "NOAA Office for Coastal Management",
    vintage: "Sea Level Rise Viewer",
    grain: "coastal areas only",
    legend: {
      kind: "classes",
      classes: [
        { color: SLR_DEPTH.deep, label: "Under water, deeper" },
        { color: SLR_DEPTH.shallow, label: "Under water, shallower" },
        { color: SLR_LOW_LYING, label: "Low-lying, not connected to the sea" },
      ],
    },
    hoverable: true,
  },
  {
    key: "canopy",
    hazard: "heat",
    chip: "Tree canopy",
    title: "Tree canopy",
    what: "Share of each 30 m square of ground covered by tree crowns.",
    publisher: "USFS and MRLC, National Land Cover Database",
    vintage: "2021",
    grain: "30 m squares, lower 48 states",
    legend: { kind: "ramp", stops: CANOPY_STOPS, ticks: [0, 50, 100], unit: "% canopy" },
    hoverable: true,
  },
  {
    key: "paving",
    hazard: "heat",
    chip: "Paving",
    title: "Paving and buildings",
    what: "Share of each 30 m square that sheds water: roofs, roads and lots.",
    publisher: "USGS and MRLC, National Land Cover Database",
    vintage: "2021",
    grain: "30 m squares, lower 48 states",
    legend: { kind: "ramp", stops: PAVING_STOPS, ticks: [0, 50, 100], unit: "% paved or built" },
    hoverable: true,
  },
  {
    key: "landslide",
    hazard: "ground",
    chip: "Landslides",
    title: "Landslide susceptibility",
    what: "How prone the slopes are to landslides, in five classes. About the area, not the lot.",
    publisher: "USGS (Mirus et al. 2024)",
    vintage: "2024",
    grain: "90 m squares",
    legend: { kind: "classes", classes: LANDSLIDE_CLASSES },
    hoverable: true,
  },
  {
    key: "faults",
    hazard: "ground",
    chip: "Faults",
    title: "Faults",
    what: "Faults that have moved in the last 1.6 million years, coloured by when they last moved.",
    publisher: "USGS, Quaternary Fault and Fold Database",
    vintage: "2020 release",
    grain: "lines as mapped, from state zoom in",
    legend: { kind: "classes", classes: FAULT_CLASSES, shape: "line" },
    minZoom: 6,
    hoverable: false,
  },
  {
    key: "tracks",
    hazard: "storm",
    chip: "Storm tracks",
    title: "Storm tracks",
    what: "Paths of the tropical storms and hurricanes listed on this page. The map zooms out to show them.",
    publisher: "NOAA National Hurricane Center, HURDAT2",
    vintage: "as listed below",
    grain: "the storm's centre, every six hours",
    legend: { kind: "track" },
    hoverable: false,
  },
];

export function layerInfo(key: LayerKey): LayerInfo {
  const l = LAYERS.find((x) => x.key === key);
  if (!l) throw new Error(`no layer ${key}`);
  return l;
}

/** A CSS gradient through a ramp's stops, 0 at the left. */
export function rampGradient(stops: { at: number; color: string }[]): string {
  const max = stops[stops.length - 1].at;
  return `linear-gradient(to right, ${stops.map((s) => `${s.color} ${((s.at / max) * 100).toFixed(1)}%`).join(", ")})`;
}
