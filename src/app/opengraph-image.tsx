import { ImageResponse } from "next/og";
import { COMPANY, DOMAIN } from "@/lib/brand";
import { HERO } from "@/lib/copy/marketing";

// The link preview for every page that has none of its own: ink ground, the
// hazard bar, the brand's one question. Colours are the hazard and ink tokens
// of src/styles/tokens.css, written out because an image is not styled by CSS.

export const alt = `${COMPANY}: ${HERO.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#141414";
const PAPER = "#f5f5f4";
const MUTED = "#bdbdbc";
const HAZARDS = ["#0b6a88", "#cc331f", "#7a4f12", "#3f6b4e"];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: INK, color: PAPER, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {HAZARDS.map((c) => (
            <div key={c} style={{ width: 64, height: 12, background: c, borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.03em", maxWidth: 980 }}>{HERO.title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: MUTED }}>
          <span>Flood · heat · ground · wind, for any US block. Free to look up.</span>
          <span style={{ color: PAPER }}>{DOMAIN}</span>
        </div>
      </div>
    ),
    size,
  );
}
