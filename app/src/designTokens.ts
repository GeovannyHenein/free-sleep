/**
 * Design tokens — the single source of truth for the visual language.
 *
 * The governing idea: this is a bedside object, not a dashboard. It is read in
 * a dark room, briefly, by someone who is either about to sleep or just woke
 * up. Every value here is chosen to emit as little light as possible while
 * staying legible, and to feel warm rather than clinical.
 *
 * theme.ts consumes these to build the MUI theme; components reach in here for
 * things MUI has no slot for (profile accents, the ember, motion curves).
 */

/**
 * Surfaces.
 *
 * Pure black page with near-black cards, in the Whoop mould: depth comes from
 * the fill difference alone, with no borders. On OLED the black is genuinely
 * off, so a card reads as a lit panel floating on nothing.
 */
export const surface = {
  base: '#000000', // page — true black
  raised: '#111111', // cards
  overlay: '#1A1A1A', // controls sitting on a card
  hover: '#222222',
  border: '#1F1F1F', // used sparingly; cards themselves are borderless
  borderStrong: '#2E2E2E',
} as const;

export const textColor = {
  primary: '#FFFFFF',
  secondary: '#9E9E9E', // 6.6:1 on black
  // Carries real content (the side differential, priming status), so it has
  // to clear 4.5:1 — and against the #111 card, not just the page. #7A7A7A
  // measured 4.89 on black but only 4.40 on a card, so it is nudged up.
  tertiary: '#7E7E7E', // 5.1:1 on page, 4.6:1 on card
  disabled: '#4A4A4A', // non-informational only
} as const;

// Profile accents — one per person, carried across the whole app.
export const accent = {
  geo: '#7C9EF5',
  geoSoft: 'rgba(124, 158, 245, 0.14)',
  jess: '#E3A0C8',
  jessSoft: 'rgba(227, 160, 200, 0.14)',
} as const;

// Thermal ramp — cool to warm, used for temperature values only.
export const thermal = {
  cold: '#5FA8E8',
  cool: '#7FB4D8',
  neutral: '#D4B486',
  warm: '#E0955F',
  hot: '#D66A55',
} as const;

export const status = {
  success: '#79B88E',
  warning: '#D9A84E',
  error: '#D57468',
  info: '#7FA6D8',
} as const;

// Generous rounding, following the reference's soft-UI family.
export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// Shadows are deep and soft. In a dark room the shadow does less work than the
// light does, so these stay subtle and the ember carries the depth.
export const shadow = {
  card: '0 2px 8px rgba(0, 0, 0, 0.45), 0 12px 32px rgba(0, 0, 0, 0.3)',
  raised: '0 4px 12px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.35)',
  // Top hairline: the surface catching what little light there is.
  hairline: 'inset 0 1px 0 rgba(255, 240, 230, 0.05)',
  hairlineStrong: 'inset 0 1px 0 rgba(255, 240, 230, 0.09)',
  pressed: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
} as const;

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Parse `#rgb`, `#rrggbb`, or `rgb(r, g, b)` into channels.
 *
 * The thermal helper interpolates and so returns `rgb(...)`, while the token
 * palette is hex — anything blending the two has to accept both.
 */
function parseColor(color: string): [number, number, number] {
  const rgbMatch = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  const h = color.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Blend two colours. `t` of 0 returns `from`, 1 returns `to`. */
export function mixHex(from: string, to: string, t: number) {
  const [r1, g1, b1] = parseColor(from);
  const [r2, g2, b2] = parseColor(to);
  const ch = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${ch(r1, r2)}, ${ch(g1, g2)}, ${ch(b1, b2)})`;
}

/**
 * The ember — the signature element.
 *
 * Each side's card is lit from its inner edge, the edge that faces the other
 * person, mirroring where the two zones meet in the actual bed. The light is
 * the state: dark when the side is off, steady while holding temperature, and
 * slowly breathing while the pump is actively working toward a target.
 *
 * Colour blends the thermal value toward the person's accent, so temperature
 * and identity are readable in the same glance without reading a number.
 */
export const ember = {
  /**
   * The light's colour: mostly the person's accent, pulled a little toward the
   * current thermal reading.
   *
   * Weighted heavily to the accent on purpose. An even blend lands on a
   * desaturated middle — around 84°F the thermal value is near-neutral, and
   * mixing that halfway with blue produces grey. Identity has to survive the
   * blend, so temperature only tints it.
   */
  color: (thermalColor: string, accentColor: string) =>
    mixHex(accentColor, thermalColor, 0.3),
  /** Breath cycle for a side that is actively heating or cooling. */
  breathDuration: '3400ms',
} as const;

/**
 * Motion. Slow and soft — nothing in a bedroom should snap. The press curve is
 * quick enough that a tap registers before the finger lifts.
 */
export const motion = {
  press: '110ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '180ms cubic-bezier(0.32, 0.72, 0, 1)',
  base: '320ms cubic-bezier(0.32, 0.72, 0, 1)',
  slow: '560ms cubic-bezier(0.32, 0.72, 0, 1)',
  spring: '440ms cubic-bezier(0.34, 1.28, 0.64, 1)',
} as const;

export const font = {
  /** Body and UI. */
  family: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  /** Temperature and duration readouts only. Rounder, warmer than Inter. */
  display: '"Instrument Sans", "Inter", system-ui, -apple-system, sans-serif',
} as const;

/**
 * Type scale.
 *
 * Lowercase throughout — no all-caps labels. Small caps read as instrument
 * annotation, which is the wrong register for a bedroom; sentence case is
 * quieter and easier to parse half-awake.
 */
export const type = {
  /**
   * Temperature readout. Instrument Sans, tight, tabular.
   *
   * 2.5rem/40px. An earlier pass ran this up to 60px, which pushed each card
   * to 233px — 57% of a 812px viewport for the two of them, against 191px in
   * the pre-redesign build. The readout is still comfortably the largest thing
   * on screen at this size; the extra 20px was buying nothing.
   */
  reading: {
    fontFamily: font.display,
    // Sized to sit inside the 104px ring with clearance. Larger than this and
    // the ring has to grow, which pushed the card past 70% of the viewport.
    fontSize: '2.375rem',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  /** Secondary readouts (vitals tiles, durations). */
  readingSm: {
    fontFamily: font.display,
    fontSize: '1.5rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    fontVariantNumeric: 'tabular-nums',
  },
  /**
   * A person's name on their card. Deliberately small and quiet — the number
   * is the only dominant element on the card.
   */
  name: {
    fontFamily: font.family,
    fontSize: '0.8125rem',
    fontWeight: 500,
    letterSpacing: '0',
    lineHeight: 1.3,
  },
  /** Status lines: "holding · now 82°". */
  status: {
    fontFamily: font.family,
    fontSize: '0.75rem',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.4,
    fontVariantNumeric: 'tabular-nums',
  },
  /**
   * Button and control labels: "cooler", "warmer".
   *
   * fontFamily is explicit on every token below. Typography inherits the theme
   * font, but raw ButtonBase/Box elements styled from these tokens do not —
   * they were falling back to the browser default (Arial), which put the most
   * frequently used controls in the app outside the type system.
   */
  control: {
    fontFamily: font.family,
    fontSize: '0.8125rem',
    fontWeight: 500,
    letterSpacing: '0',
    lineHeight: 1,
  },
  /** Section markers. Sentence case, not uppercase. */
  section: {
    fontFamily: font.family,
    fontSize: '0.8125rem',
    fontWeight: 550,
    letterSpacing: '0',
    lineHeight: 1.4,
  },
  /** Smallest supporting text. */
  caption: {
    fontFamily: font.family,
    fontSize: '0.6875rem',
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.4,
  },
} as const;
