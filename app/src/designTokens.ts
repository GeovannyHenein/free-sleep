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
// `hairline` is the top inner highlight that makes a surface look like it
// catches light from above; it does most of the work in selling depth.
export const shadow = {
  card: '0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.24)',
  raised: '0 2px 6px rgba(0, 0, 0, 0.45), 0 12px 32px rgba(0, 0, 0, 0.32)',
  float: '0 8px 24px rgba(0, 0, 0, 0.5), 0 24px 64px rgba(0, 0, 0, 0.36)',
  hairline: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  hairlineStrong: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  // Pressed controls sink: the highlight flips to an inner shadow from above.
  pressed: 'inset 0 2px 6px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Surface treatments. Buttons and cards are built from a vertical gradient
 * plus a top hairline rather than a flat fill — that pairing is what reads as
 * a physical, moulded object instead of a coloured rectangle.
 */
export const surfaceTreatment = {
  raised: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.012) 42%, rgba(0,0,0,0.10) 100%)',
  control: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.14) 100%)',
  // Frosted glass for cards; pairs with backdropFilter.
  glass: 'linear-gradient(155deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 38%, rgba(255,255,255,0) 70%)',
} as const;

export const blur = {
  glass: 'blur(20px) saturate(140%)',
  nav: 'blur(28px) saturate(160%)',
} as const;

/**
 * Motion. Springy curves for anything the user physically manipulates, and a
 * deliberately fast `press` so a tap registers before the finger lifts.
 */
export const motion = {
  press: '90ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '140ms cubic-bezier(0.32, 0.72, 0, 1)',
  base: '240ms cubic-bezier(0.32, 0.72, 0, 1)',
  slow: '420ms cubic-bezier(0.32, 0.72, 0, 1)',
  // Slight overshoot — used where an element should feel spring-loaded.
  spring: '420ms cubic-bezier(0.34, 1.4, 0.64, 1)',
} as const;

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Accent glow behind the hero temperature readout. */
export const glow = (color: string, intensity = 1) =>
  `0 0 ${20 * intensity}px ${hexToRgba(color, 0.28 * intensity)}, `
  + `0 0 ${52 * intensity}px ${hexToRgba(color, 0.13 * intensity)}`;

export const font = {
  family: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  // Tabular figures keep temperature readouts from shifting width as they tick.
  numeric: '"Inter", system-ui, -apple-system, sans-serif',
} as const;

/**
 * Type scale.
 *
 * Deliberately bimodal, in the Whoop mould: readouts are very large and very
 * tight, while every supporting label is small, uppercase and widely tracked.
 * The gap between the two is the hierarchy — there is no mid-sized tier
 * competing with the hero number.
 */
export const type = {
  hero: {
    fontSize: 'clamp(2.75rem, 11vw, 3.5rem)',
    fontWeight: 680,
    letterSpacing: '-0.045em',
    lineHeight: 0.95,
    fontVariantNumeric: 'tabular-nums',
  },
  display: {
    fontSize: '2rem',
    fontWeight: 640,
    letterSpacing: '-0.035em',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  metric: {
    fontSize: '1.375rem',
    fontWeight: 620,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    fontVariantNumeric: 'tabular-nums',
  },
  // Small caps used for every supporting label. The wide tracking is what
  // makes them read as instrument annotations rather than body copy.
  label: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.14em',
    lineHeight: 1.35,
    textTransform: 'uppercase' as const,
  },
  labelTight: {
    fontSize: '0.75rem',
    fontWeight: 550,
    letterSpacing: '0.01em',
    lineHeight: 1.4,
  },
} as const;
