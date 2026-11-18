"use client";

import { useEffect } from "react";

/**
 * The mist: the one decorative colour of the cabinet frame, carried over from
 * the InSAR Pipeline app (insar_pipeline/app/app_assets/app.js, mist()).
 *
 * A small interferogram, 64 x 24 pixels, of two subsiding point sources
 * (Mogi: u = d / (r^2 + d^2)^1.5) on a slight tilt, with speckle. Its wrapped
 * phase is coloured round one cycle and washed out toward the paper, then
 * blown up without smoothing and set as --mist on the root.
 *
 * Decoration only. It is drawn from the formula, never from a place's data,
 * and it never encodes anything: the brand-ramp rule in tokens.css applies to
 * it the same way (no text colour, no control boundary, no data encoding).
 * Until it is drawn, --mist is the plain gradient in cabinet.css.
 */
export function Mist() {
  useEffect(() => {
    const W = 64;
    const H = 24;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(W, H);
    const wheel = [
      [63, 102, 196],
      [47, 151, 190],
      [79, 179, 165],
      [147, 194, 94],
      [230, 195, 90],
      [224, 135, 77],
      [196, 90, 132],
    ];
    // x, y, depth, fringes at the peak
    const src = [
      [16, 14, 7, 3.2],
      [47, 9, 9, 2.4],
    ];
    // The paper (#f7f4ee) the fringes are washed toward.
    const paper = [247, 244, 238];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let ph = 0.012 * x + 0.02 * y; // the tilt
        for (const [sx, sy, d, n] of src) {
          ph += n * Math.pow((d * d) / ((x - sx) ** 2 + (y - sy) ** 2 + d * d), 1.5);
        }
        ph += (rnd() - 0.5) * 0.12; // speckle
        const f = (ph - Math.floor(ph)) * wheel.length;
        const k = Math.floor(f);
        const t = f - k;
        const a = wheel[k];
        const b = wheel[(k + 1) % wheel.length];
        const i = (y * W + x) * 4;
        for (let j = 0; j < 3; j++) {
          img.data[i + j] = Math.round(0.42 * (a[j] + (b[j] - a[j]) * t) + 0.58 * paper[j]);
        }
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    // Blown up here, block by block, with a faint seam between pixels: a
    // browser smooths a background picture it scales, and the pixels are the point.
    const S = 16;
    const big = document.createElement("canvas");
    big.width = W * S;
    big.height = H * S;
    const bg = big.getContext("2d");
    if (!bg) return;
    bg.imageSmoothingEnabled = false;
    bg.drawImage(c, 0, 0, W * S, H * S);
    bg.fillStyle = "rgba(26, 20, 22, 0.07)";
    for (let x = 0; x < W; x++) bg.fillRect(x * S, 0, 1, H * S);
    for (let y = 0; y < H; y++) bg.fillRect(0, y * S, W * S, 1);
    document.documentElement.style.setProperty("--mist", `url(${big.toDataURL()})`);
  }, []);
  return null;
}
