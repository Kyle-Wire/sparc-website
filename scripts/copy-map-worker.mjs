/**
 * Copies the map library's worker script into public/ so the site can serve it.
 *
 * Run: node scripts/copy-map-worker.mjs   (runs by itself before `dev` and `build`)
 *
 * Why this exists: maplibre-gl 6 ships its tile worker as a separate file and
 * looks for it next to its own script. Once the library is bundled into the
 * app that location no longer exists, so the place map tells the library where
 * the worker is (setWorkerUrl in src/components/place/PlaceMap.tsx) and this
 * script puts the file there.
 *
 * Why not commit the copy: it would silently fall out of step with the
 * installed package on the next upgrade. public/vendor/ is git-ignored and
 * rebuilt from node_modules every time.
 *
 * Why version 6 at all: every release up to 6.4.0 carries a critical advisory
 * (GHSA-jrc7-96c5-q579), so the older single-file builds are not an option.
 */

import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const FROM = join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const TO = join(process.cwd(), "public", "vendor", "maplibre-gl-worker.mjs");

try {
  statSync(FROM);
} catch {
  console.error(`copy-map-worker  FAILED  ·  ${FROM} not found. Run npm ci first.`);
  process.exit(1);
}

mkdirSync(dirname(TO), { recursive: true });
copyFileSync(FROM, TO);
console.log("copy-map-worker  ok  ·  public/vendor/maplibre-gl-worker.mjs");
