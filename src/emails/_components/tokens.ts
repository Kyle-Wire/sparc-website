// Hex values copied from src/styles/tokens.css. Email clients do not support
// CSS variables, so brand tokens are duplicated here. If a value changes in
// tokens.css, mirror it here.

export const color = {
  // Brand ramp
  purple: "#602468",
  magenta: "#9e337d",
  pink: "#e94d9b",
  red: "#e94461",
  crimson: "#e73c25",
  orange: "#e76c25",
  amber: "#e79024",
  gold: "#f0b632",
  yellow: "#fbdd46",
  // Warm neutrals
  ink: "#1a1416",
  ink2: "#2b2327",
  paper: "#f7f4ee",
  paper2: "#ede8dd",
  paper3: "#d8d3c6",
  line: "#c9c2b3",
  muted: "#6e6358",
  white: "#ffffff",
} as const;

export const font = {
  sans:
    "Inter, 'Neue Haas Grotesk', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
  mono:
    "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

// Brand gradient ramp. Used as a thin top stripe in the layout header.
export const GRADIENT_RAMP =
  `linear-gradient(90deg, ${color.purple} 0%, ${color.magenta} 14%, ${color.pink} 28%, ` +
  `${color.red} 42%, ${color.crimson} 56%, ${color.orange} 70%, ${color.amber} 82%, ` +
  `${color.gold} 92%, ${color.yellow} 100%)`;
