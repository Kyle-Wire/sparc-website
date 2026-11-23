import { test } from "node:test";
import assert from "node:assert/strict";
import { BYTES_PER_CELL, deviceVerdict, floodCapacity, formatKm2 } from "./device";

// WebGPU's own defaults: a 128 MiB storage binding and a 256 MiB buffer, eight
// storage buffers per stage (W3C WebGPU, Candidate Recommendation Draft of
// 16 November 2026, §3.6.2 "Limits", opened 18 November 2026).
const DEFAULTS = { maxStorageBufferBindingSize: 134217728, maxBufferSize: 268435456, maxStorageBuffersPerShaderStage: 8 };

test("cells come from the smaller of the two buffer limits, 36 bytes a cell", () => {
  const c = floodCapacity(DEFAULTS);
  assert.equal(c.cells, Math.floor(134217728 / BYTES_PER_CELL));
  assert.equal(c.cells, 3728270);
  const flipped = floodCapacity({ ...DEFAULTS, maxStorageBufferBindingSize: 268435456, maxBufferSize: 134217728 });
  assert.equal(flipped.cells, c.cells);
});

test("each coarser grid holds four times the area of the one before", () => {
  const [one, two, four] = floodCapacity(DEFAULTS).fits;
  assert.deepEqual([one.metres, two.metres, four.metres], [1, 2, 4]);
  assert.ok(Math.abs(one.areaKm2 - 3.72827) < 1e-5);
  assert.ok(Math.abs(two.areaKm2 / one.areaKm2 - 4) < 1e-9);
  assert.ok(Math.abs(four.areaKm2 / one.areaKm2 - 16) < 1e-9);
  assert.equal(one.sideMetres, 1930);
});

test("tiled stepping needs nine storage buffers per stage", () => {
  assert.equal(floodCapacity(DEFAULTS).tiled, false);
  assert.equal(floodCapacity({ ...DEFAULTS, maxStorageBuffersPerShaderStage: 9 }).tiled, true);
});

test("no memory means no cells, not a negative or NaN", () => {
  const c = floodCapacity({ maxStorageBufferBindingSize: 0, maxBufferSize: 0, maxStorageBuffersPerShaderStage: 0 });
  assert.equal(c.cells, 0);
  assert.equal(c.fits[0].sideMetres, 0);
});

test("a software stand-in is called too slow, even with room to spare", () => {
  const capacity = floodCapacity(DEFAULTS);
  assert.match(deviceVerdict({ kind: "ok", gpu: "SwiftShader", limits: DEFAULTS, capacity, fallback: true }), /too slowly/);
  assert.match(deviceVerdict({ kind: "ok", gpu: "nvidia", limits: DEFAULTS, capacity, fallback: false }), /can run/);
  assert.match(deviceVerdict({ kind: "no-webgpu" }), /Chrome or Edge/);
});

test("areas read as a buyer would say them", () => {
  assert.equal(formatKm2(3.72827), "3.7");
  assert.equal(formatKm2(59.65), "60");
  assert.equal(formatKm2(0.04), "0.0");
});
