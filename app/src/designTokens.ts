/**
 * Design tokens — the single source of truth for the visual language.
 *
 * theme.ts consumes these to build the MUI theme; components should read colors
 * from the theme where possible and reach in here only for things MUI has no
 * slot for (profile accents, elevation surfaces, motion curves).
 */

// Surfaces — a warm-neutral ramp rather than pure black, so stacked cards
// read as distinct layers instead of merging into the background.
export const surface = {
  base: '#0B0C0E',
  raised: '#141619',
  overlay: '#1B1E22',
  hover: '#22262B',
  border: '#25292F',
  borderStrong: '#343A42',
} as const;

export const textColor = {
  primary: '#F2F4F7',
  secondary: '#A2AAB6',
  tertiary: '#6C7482',
  disabled: '#454C57',
} as const;

// Profile accents. Deliberately low-saturation so two panels can sit next to
// each other without the screen turning into a color clash.
export const accent = {
  geo: '#7C9EF5',
  geoSoft: 'rgba(124, 158, 245, 0.14)',
  jess: '#E3A0C8',
  jessSoft: 'rgba(227, 160, 200, 0.14)',
} as const;

// Thermal ramp — cool to warm. Used by the temperature color helper.
// Avoids a grey midpoint: the bed's usual 80–90°F range should still read as
// warm, so the neutral stop leans amber rather than slate.
export const thermal = {
  cold: '#4DA3F5',
  cool: '#63B4E0',
  neutral: '#D9B87A',
  warm: '#E89A5C',
  hot: '#DE6553',
} as const;

export const status = {
  success: '#5BC98C',
  warning: '#E3B341',
  error: '#E5695F',
  info: '#6EA8F0',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Soft, wide shadows — depth without the heavy Material drop-shadow look.
export const shadow = {
  card: '0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.24)',
  raised: '0 2px 6px rgba(0, 0, 0, 0.45), 0 12px 32px rgba(0, 0, 0, 0.32)',
} as const;

export const motion = {
  fast: '140ms cubic-bezier(0.32, 0.72, 0, 1)',
  base: '240ms cubic-bezier(0.32, 0.72, 0, 1)',
  slow: '420ms cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

export const font = {
  family: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  // Tabular figures keep temperature readouts from shifting width as they tick.
  numeric: '"Inter", system-ui, -apple-system, sans-serif',
} as const;
