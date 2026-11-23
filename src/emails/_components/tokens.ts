// Hex values copied from src/styles/tokens.css. Email clients do not support
// CSS variables, so brand tokens are duplicated here. If a value changes in
// tokens.css, mirror it here.

export const color = {
  // Working hues (tokens.css, 23 Nov 2026: "Mono plus one accent").
  crimson: "#cc331f", // --crimson, 5.17:1 under white text
  flood: "#0b6a88",
  heat: "#cc331f",
  ground: "#7a4f12",
  wind: "#3f6b4e",
  // True greys, as on the site.
  ink: "#141414",
  ink2: "#2a2a2a",
  paper: "#f5f5f4",
  paper2: "#ebebea",
  paper3: "#d6d6d5",
  line: "#c4c4c3",
  rule: "#737372",
  muted: "#5c5c5b",
  white: "#ffffff",
} as const;

export const font = {
  sans:
    "Inter, 'Neue Haas Grotesk', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
  mono:
    "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

// The four hazard colours, in the site's order, as the strip at the top of
// every email (the site's HazardBar). Cells, not a gradient: Outlook drops
// CSS gradients.
export const HAZARD_STRIP = [color.flood, color.heat, color.ground, color.wind] as const;
