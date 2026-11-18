// Copies FEMA's own legend for the flood zone layer the maps draw.
//
//   node scripts/fetch-fema-legend.mjs
//
// Writes src/data/fema-flood-zones-legend.json: each label and swatch exactly
// as FEMA's National Flood Hazard Layer map service publishes them (layer 28,
// "Flood Hazard Zones"), with the date it was read. The map draws that layer
// as FEMA's server renders it, so the legend has to be FEMA's too. Run it again
// if FEMA changes its symbols.

import { writeFileSync, mkdirSync } from "node:fs";

const NFHL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const LAYER = 28;

// FEMA's server drops connections when busy, so it is asked up to four times.
let body;
for (let i = 0; i < 4 && !body; i++) {
  try {
    const res = await fetch(`${NFHL}/legend?f=json`, { signal: AbortSignal.timeout(30_000) });
    if (res.ok) body = await res.json();
    else console.warn(`FEMA answered ${res.status}`);
  } catch (e) {
    console.warn(`try ${i + 1}: ${e.cause?.code ?? e.message}`);
  }
  if (!body) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
}
if (!body) throw new Error("FEMA did not answer");
const layer = body.layers?.find((l) => l.layerId === LAYER);
if (!layer) throw new Error(`layer ${LAYER} is not in FEMA's legend`);

const out = {
  source: `${NFHL}/legend?f=json`,
  layer: LAYER,
  layerName: layer.layerName,
  read: new Date().toISOString().slice(0, 10),
  items: layer.legend.map((x) => ({ label: x.label, image: `data:${x.contentType};base64,${x.imageData}` })),
};
mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/data/fema-flood-zones-legend.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.items.length} items, read ${out.read}`);
