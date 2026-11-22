import * as React from "react";

// The brand's two marks (src/styles/brand.css, docs/design/brand-and-conversion.md s.3).

/** Four segments, flood, heat, ground, wind, always in that order. Decoration only. */
export function HazardBar({ size }: { size?: "lg" }) {
  return (
    <span className="hazard-bar" data-size={size} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export type StampTone = "accent" | "muted" | "flood" | "heat" | "ground" | "wind";

/** The inspector's tag: a mono, upper-case label in a 1 px frame. The words carry the meaning. */
export function Stamp({ children, tone }: { children: React.ReactNode; tone?: StampTone }) {
  return (
    <span className="stamp" data-tone={tone}>
      {children}
    </span>
  );
}
