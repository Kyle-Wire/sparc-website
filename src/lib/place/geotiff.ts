// A reader for one kind of TIFF and no other: a single band of 8-bit values,
// not compressed, stored in tiles or strips. That is what the MRLC land cover
// server returns for a small coverage request (checked 17 Nov 2026), and it
// is all this site needs. Anything else comes back as null, and the caller
// reports the record as not loaded rather than guessing.
//
// Written for this file from the TIFF 6.0 layout; no code is taken from
// FloodSim's reader or any other project.

export interface ByteGrid {
  width: number;
  height: number;
  /** Row 0 is the northern edge. */
  values: Uint8Array;
}

const TAG = {
  width: 256,
  height: 257,
  bits: 258,
  compression: 259,
  samples: 277,
  stripOffsets: 273,
  rowsPerStrip: 278,
  tileWidth: 322,
  tileHeight: 323,
  tileOffsets: 324,
} as const;

export function readByteGrid(buffer: ArrayBuffer): ByteGrid | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) return null;
  const mark = String.fromCharCode(bytes[0], bytes[1]);
  if (mark !== "II" && mark !== "MM") return null;
  const little = mark === "II";
  const view = new DataView(buffer);
  if (view.getUint16(2, little) !== 42) return null;

  const dir = view.getUint32(4, little);
  if (dir + 2 > bytes.length) return null;
  const count = view.getUint16(dir, little);

  /** Every value of a tag, for the SHORT and LONG types this file uses. */
  const tags = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const at = dir + 2 + i * 12;
    if (at + 12 > bytes.length) return null;
    const tag = view.getUint16(at, little);
    const type = view.getUint16(at + 2, little);
    const n = view.getUint32(at + 4, little);
    const size = type === 3 ? 2 : type === 4 ? 4 : 0;
    if (!size) continue;
    const start = n * size <= 4 ? at + 8 : view.getUint32(at + 8, little);
    if (start + n * size > bytes.length) return null;
    const out: number[] = [];
    for (let k = 0; k < n; k++) {
      out.push(size === 2 ? view.getUint16(start + k * 2, little) : view.getUint32(start + k * 4, little));
    }
    tags.set(tag, out);
  }

  const one = (t: number) => tags.get(t)?.[0];
  const width = one(TAG.width);
  const height = one(TAG.height);
  if (!width || !height) return null;
  if ((one(TAG.bits) ?? 8) !== 8 || (one(TAG.compression) ?? 1) !== 1 || (one(TAG.samples) ?? 1) !== 1) return null;

  const values = new Uint8Array(width * height);

  const tileOffsets = tags.get(TAG.tileOffsets);
  if (tileOffsets) {
    const tw = one(TAG.tileWidth);
    const th = one(TAG.tileHeight);
    if (!tw || !th) return null;
    const across = Math.ceil(width / tw);
    for (let t = 0; t < tileOffsets.length; t++) {
      const x0 = (t % across) * tw;
      const y0 = Math.floor(t / across) * th;
      for (let y = 0; y < th && y0 + y < height; y++) {
        const from = tileOffsets[t] + y * tw;
        const len = Math.min(tw, width - x0);
        if (len <= 0) continue;
        if (from + len > bytes.length) return null;
        values.set(bytes.subarray(from, from + len), (y0 + y) * width + x0);
      }
    }
    return { width, height, values };
  }

  const stripOffsets = tags.get(TAG.stripOffsets);
  if (!stripOffsets) return null;
  const rows = one(TAG.rowsPerStrip) ?? height;
  for (let s = 0; s < stripOffsets.length; s++) {
    const y0 = s * rows;
    const len = Math.min(rows, height - y0) * width;
    if (len <= 0) continue;
    if (stripOffsets[s] + len > bytes.length) return null;
    values.set(bytes.subarray(stripOffsets[s], stripOffsets[s] + len), y0 * width);
  }
  return { width, height, values };
}
