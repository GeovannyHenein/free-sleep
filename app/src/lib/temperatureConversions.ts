import { surface, thermal } from '../designTokens';

export function farenheitToCelcius(farenheit: number): number {
  const celcius = (farenheit - 32) * 5 / 9;
  return Math.round(celcius * 2) / 2;
}

export function formatTemperature(temperature: number, celcius: boolean) {
  return celcius ? `${farenheitToCelcius(temperature)}°C` : `${temperature}°F`;
}

/**
 * Temperature split into value and unit, for the `Reading` lockup which sets
 * the unit small and dropped to the baseline.
 */
export function splitTemperature(temperature: number, celcius: boolean) {
  return celcius
    ? { value: farenheitToCelcius(temperature), unit: '°c' }
    : { value: temperature, unit: '°f' };
}

/** Just the degrees, for inline status lines: "now 82°". */
export function formatDegrees(temperature: number, celcius: boolean) {
  return celcius ? `${farenheitToCelcius(temperature)}°` : `${temperature}°`;
}


export const MIN_TEMP_F = 55;
export const MAX_TEMP_F = 110;

export const MIN_TEMP_C = farenheitToCelcius(MIN_TEMP_F);
export const MAX_TEMP_C = farenheitToCelcius(MAX_TEMP_F);


const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const mix = (from: string, to: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${channel(r1, r2)}, ${channel(g1, g2)}, ${channel(b1, b2)})`;
};

// Stops along the 55–110°F range. Interpolating between them gives a continuous
// ramp, so nudging the temperature by a degree shifts the color slightly rather
// than snapping between four fixed values.
const THERMAL_STOPS: Array<{ at: number; color: string }> = [
  { at: MIN_TEMP_F, color: thermal.cold },
  { at: 70, color: thermal.cool },
  { at: 82, color: thermal.neutral },
  { at: 95, color: thermal.warm },
  { at: MAX_TEMP_F, color: thermal.hot },
];

export function getTemperatureColor(tempF: number | undefined) {
  if (tempF === undefined) return surface.borderStrong;

  const clamped = Math.min(Math.max(tempF, MIN_TEMP_F), MAX_TEMP_F);

  for (let i = 0; i < THERMAL_STOPS.length - 1; i++) {
    const lower = THERMAL_STOPS[i];
    const upper = THERMAL_STOPS[i + 1];
    if (clamped <= upper.at) {
      const span = upper.at - lower.at;
      const t = span === 0 ? 0 : (clamped - lower.at) / span;
      return mix(lower.color, upper.color, t);
    }
  }

  return thermal.hot;
}

