import { test } from "node:test";
import assert from "node:assert/strict";
import { readPixel, tileBbox3857, tilePixel, tileUrl } from "./map-reading";
import { CANOPY_STOPS, FAULT_CLASSES, LANDSLIDE_CLASSES, LAYERS, PAVING_STOPS, rampGradient } from "./map-legends";

test("tile and pixel under a point match the web-mercator scheme", () => {
  // Null Island sits on the corner of the four zoom-1 tiles.
  const t = tilePixel(0.0001, -0.0001, 1, 256);
  assert.deepEqual([t.x, t.y], [1, 1]);
  assert.equal(t.px, 0);
  assert.equal(t.py, 0);
  // Philadelphia at zoom 14, against the OpenStreetMap slippy-map formula
  // x = (lon + 180) / 360 · 2^z, y = (1 − ln(tan φ + sec φ) / π) / 2 · 2^z: 4771.48, 6206.03.
  const p = tilePixel(-75.158, 39.943, 14, 256);
  assert.deepEqual([p.x, p.y], [4771, 6206]);
  assert.ok(p.px >= 0 && p.px < 256 && p.py >= 0 && p.py < 256);
});

test("a tile's bbox spans the world at zoom 0", () => {
  const [minX, minY, maxX, maxY] = tileBbox3857(0, 0, 0).split(",").map(Number);
  assert.ok(Math.abs(minX + 20037508.34) < 1);
  assert.ok(Math.abs(maxY - 20037508.34) < 1);
  assert.ok(Math.abs(maxX - minX - 2 * 20037508.34) < 1);
  assert.ok(Math.abs(maxY - minY - 2 * 20037508.34) < 1);
});

test("tile URLs fill both kinds of template", () => {
  assert.equal(tileUrl("https://a/{z}/{y}/{x}", { z: 3, x: 2, y: 5 }), "https://a/3/5/2");
  assert.match(tileUrl("https://a?bbox={bbox-epsg-3857}", { z: 0, x: 0, y: 0 }), /^https:\/\/a\?bbox=-20037508\.\d+,-20037508/);
});

test("canopy and paving colours read back as their own stop", () => {
  CANOPY_STOPS.forEach((s, i) => {
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(s.color.slice(k, k + 2), 16));
    assert.deepEqual(readPixel("canopy", [r, g, b, 255]), { text: `About ${s.at}% tree canopy`, index: i });
  });
  PAVING_STOPS.forEach((s, i) => {
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(s.color.slice(k, k + 2), 16));
    assert.equal(readPixel("paving", [r, g, b, 255])?.index, i);
  });
  assert.match(readPixel("canopy", [255, 255, 255, 0])!.text, /No tree canopy/);
});

test("landslide classes read back in order, and the ends say so", () => {
  LANDSLIDE_CLASSES.forEach((c, i) => {
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(c.color.slice(k, k + 2), 16));
    assert.equal(readPixel("landslide", [r, g, b, 255])?.index, i);
  });
  assert.match(readPixel("landslide", [251, 213, 117, 255])!.text, /lowest/);
  assert.match(readPixel("landslide", [114, 16, 15, 255])!.text, /highest/);
});

test("FEMA's translucent zone colours read by their colour, not their alpha", () => {
  assert.match(readPixel("fema", [0, 229, 255, 77])!.text, /^1% annual chance/);
  assert.match(readPixel("fema", [255, 129, 0, 77])!.text, /^0\.2% annual chance/);
  assert.match(readPixel("fema", [0, 0, 0, 0])!.text, /Click to read the zone/);
  // A grey levee hatch is not named rather than guessed.
  assert.equal(readPixel("fema", [109, 109, 109, 77]), null);
});

test("sea level rise reads water, low-lying ground and dry ground", () => {
  assert.match(readPixel("slr", [56, 20, 162, 255], { slrFeet: 3 })!.text, /Under water at 3 ft/);
  assert.match(readPixel("slr", [183, 229, 242, 255], { slrFeet: 3 })!.text, /Under water/);
  assert.match(readPixel("slr", [85, 255, 0, 255])!.text, /Low-lying/);
  assert.match(readPixel("slr", [0, 0, 0, 0], { slrFeet: 6 })!.text, /Above the sea at 6 ft/);
});

test("layers with no hover reading return none", () => {
  assert.equal(readPixel("faults", [255, 0, 0, 255]), null);
  assert.equal(readPixel("tracks", [0, 0, 0, 255]), null);
  for (const l of LAYERS) assert.equal(l.hoverable, !["faults", "tracks"].includes(l.key), l.key);
});

test("every legend has words, and ramps run low to high", () => {
  for (const l of LAYERS) {
    assert.ok(l.title && l.what && l.publisher, l.key);
    if (l.legend.kind === "ramp") {
      const at = l.legend.stops.map((s) => s.at);
      assert.deepEqual(at, [...at].sort((a, b) => a - b), l.key);
      assert.ok(l.legend.unit.length > 0);
    }
  }
  assert.equal(FAULT_CLASSES.length, 6);
  assert.match(rampGradient(CANOPY_STOPS), /^linear-gradient\(to right, #bcc6bc 10\.0%/);
});
