"use client";

import * as React from "react";
import { deviceVerdict, floodCapacity, formatKm2, type DeviceReport, type GpuLimits } from "@/lib/device";

/**
 * The device check: can this computer run the flood model before anyone pays.
 *
 * It asks the browser for its graphics card the way FloodSim does (WebGPU, the
 * high-performance adapter) and reads the card's own limits. Every figure it
 * prints is the visitor's device reporting on itself; nothing is modelled and
 * nothing is sent anywhere. The arithmetic is in src/lib/device.ts.
 */

// WebGPU's types are not in this project's TypeScript lib; only the few
// fields read here are described.
type Adapter = {
  limits: GpuLimits;
  info?: { vendor?: string; architecture?: string; description?: string; isFallbackAdapter?: boolean };
  isFallbackAdapter?: boolean;
};
type Gpu = { requestAdapter(o?: { powerPreference?: string }): Promise<Adapter | null> };

async function check(): Promise<DeviceReport> {
  const gpu = (navigator as Navigator & { gpu?: Gpu }).gpu;
  if (!gpu) return { kind: "no-webgpu" };
  try {
    const a = await gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!a) return { kind: "no-adapter" };
    const limits: GpuLimits = {
      maxStorageBufferBindingSize: Number(a.limits.maxStorageBufferBindingSize),
      maxBufferSize: Number(a.limits.maxBufferSize),
      maxStorageBuffersPerShaderStage: Number(a.limits.maxStorageBuffersPerShaderStage),
    };
    const info = a.info ?? {};
    const name = [info.vendor, info.architecture].filter(Boolean).join(" · ") || info.description || "a graphics card";
    const fallback = Boolean(info.isFallbackAdapter ?? a.isFallbackAdapter);
    return { kind: "ok", gpu: name, limits, capacity: floodCapacity(limits), fallback };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export function DeviceCheck({ onResult }: { onResult?: (r: DeviceReport) => void }) {
  const [report, setReport] = React.useState<DeviceReport | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    const r = await check();
    setReport(r);
    setBusy(false);
    onResult?.(r);
  }

  const ok = report?.kind === "ok" && !report.fallback && report.capacity.cells > 0;

  return (
    <div className="device-check card">
      <div className="kicker">device check · flood model</div>
      <p className="device-lead">
        The flood model runs on your own graphics card, in the browser. This asks your browser what card it
        has and how much it can hold. It runs here, on this computer, and sends nothing to us.
      </p>
      <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? "Checking…" : report ? "Check again" : "Check this computer"}
      </button>

      {report && (
        <div className="device-result" data-ok={ok ? "true" : "false"} role="status">
          <p className="device-verdict">
            <strong>{ok ? "Yes." : "Not on this device."}</strong> {deviceVerdict(report)}
          </p>
          {report.kind === "ok" && (
            <>
              <dl className="device-facts">
                <div>
                  <dt>Graphics card, as the browser names it</dt>
                  <dd>{report.gpu}</dd>
                </div>
                <div>
                  <dt>Largest block of memory it allows</dt>
                  <dd>{Math.floor(Math.min(report.limits.maxStorageBufferBindingSize, report.limits.maxBufferSize) / 2 ** 20).toLocaleString("en-US")} MB</dd>
                </div>
                <div>
                  <dt>Faster, tiled stepping</dt>
                  <dd>{report.capacity.tiled ? "Available" : "Not available; the model steps the whole area at once, which is slower"}</dd>
                </div>
              </dl>
              {ok && (
                <table className="plain-table device-table">
                  <caption>The largest area this computer can model at each level of detail</caption>
                  <thead>
                    <tr>
                      <th>Detail</th>
                      <th>Area</th>
                      <th>A square about</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.capacity.fits.map((f) => (
                      <tr key={f.metres}>
                        <td>{f.metres} m{f.metres === 1 ? " (the baseline)" : ""}</td>
                        <td>{formatKm2(f.areaKm2)} km²</td>
                        <td>{f.sideMetres.toLocaleString("en-US")} m across</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="device-aside">
                The area a run needs depends on the land that drains to the place, so it is only known once the
                place&apos;s terrain is read. The run&apos;s setup compares the two before anything is paid for.
                At two and four metres the depths are mapped back onto the one-metre ground.
              </p>
            </>
          )}
          {!ok && (
            <p className="device-aside">
              You can still order a report: we run the flood model on our own machine and send you the result.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
