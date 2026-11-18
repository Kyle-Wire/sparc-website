/**
 * Can this computer run the flood model? The arithmetic, kept apart from the
 * browser so it can be tested.
 *
 * Where the rule comes from: FloodSim at faf45a9, app/map.js line 161:
 *
 *   const maxSolverCells = () => device ? Math.floor(Math.min(
 *     device.limits.maxStorageBufferBindingSize, device.limits.maxBufferSize) / 36) : 0;
 *
 * and src/solver-gpu.js: tiled stepping (the faster path) needs at least
 * TILED_STORAGE_BUFFERS = 9 storage buffers per shader stage. FloodSim asks for
 * the high-performance adapter. This file copies those two rules as numbers,
 * not code: FloodSim's source is never copied into this repository.
 *
 * What this check does not know: how big the area around a given place has to
 * be. FloodSim draws its model over the watershed that drains to the place,
 * and that is only known once the place's terrain is read. So the answer is
 * "this computer can hold an area this big", and the run's own setup compares
 * it with the area it needs before anything is paid for.
 */

/** Bytes of GPU memory per solver cell, from FloodSim's own limit. */
export const BYTES_PER_CELL = 36;
/** Storage buffers per shader stage that FloodSim's tiled stepping needs. */
export const TILED_STORAGE_BUFFERS = 9;
/** Grid sizes FloodSim solves at, in metres. 1 m is the baseline. */
export const GRID_METRES = [1, 2, 4] as const;

export interface GpuLimits {
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  maxStorageBuffersPerShaderStage: number;
}

export interface GridFit {
  metres: number;
  /** Area this computer can model at this grid, in square kilometres. */
  areaKm2: number;
  /** The side of a square of that area, in metres. */
  sideMetres: number;
}

export interface FloodCapacity {
  /** Solver cells the largest buffer can hold. */
  cells: number;
  /** One entry per grid size. */
  fits: GridFit[];
  /** True when FloodSim can use its faster, tiled stepping. */
  tiled: boolean;
}

export function floodCapacity(l: GpuLimits): FloodCapacity {
  const bytes = Math.min(l.maxStorageBufferBindingSize, l.maxBufferSize);
  const cells = bytes > 0 ? Math.floor(bytes / BYTES_PER_CELL) : 0;
  const fits = GRID_METRES.map((m) => {
    const areaM2 = cells * m * m;
    return { metres: m, areaKm2: areaM2 / 1e6, sideMetres: Math.floor(Math.sqrt(areaM2)) };
  });
  return { cells, fits, tiled: l.maxStorageBuffersPerShaderStage >= TILED_STORAGE_BUFFERS };
}

/** What the visitor's browser told us, before any arithmetic. */
export type DeviceReport =
  | { kind: "no-webgpu" }
  | { kind: "no-adapter" }
  | { kind: "error"; message: string }
  | { kind: "ok"; gpu: string; limits: GpuLimits; capacity: FloodCapacity; fallback: boolean };

/** A sentence for each outcome. Kept here so the tests can read them. */
export function deviceVerdict(r: DeviceReport): string {
  switch (r.kind) {
    case "no-webgpu":
      return "This browser does not offer WebGPU, which the flood model needs. Chrome or Edge on a recent laptop or desktop usually does.";
    case "no-adapter":
      return "This browser offers WebGPU but found no graphics card to use. It may be switched off, or blocked on this device.";
    case "error":
      return `The check could not finish: ${r.message}`;
    case "ok":
      if (r.fallback)
        return "This browser is using a software stand-in for a graphics card. The flood model would run, but far too slowly to be useful.";
      if (r.capacity.cells === 0) return "This graphics card reported no room for the model.";
      return "This computer can run the flood model in the browser. The size it can hold is below.";
  }
}

/** Square kilometres in words a buyer can read: one decimal under ten. */
export function formatKm2(km2: number): string {
  if (km2 >= 10) return Math.round(km2).toLocaleString("en-US");
  return (Math.round(km2 * 10) / 10).toFixed(1);
}
