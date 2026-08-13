import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

import { type } from '../designTokens.ts';

type ReadingProps = {
  /** The numeric part, already formatted. */
  value: string | number;
  /** The unit, set small and dropped to the baseline. */
  unit?: string;
  color?: string;
  /** `sm` for vitals tiles and secondary readouts. */
  size?: 'lg' | 'sm';
  /** Spoken label; defaults to value + unit concatenated. */
  label?: string;
  sx?: SxProps<Theme>;
};

/**
 * A numeric readout with the unit tucked under the baseline.
 *
 * Borrowed from the reference's `7ₕ54ₘ` duration lockup: the unit sits at
 * roughly a third the size of the number and drops to the baseline, so it
 * annotates the value instead of competing with it. Set in Instrument Sans,
 * which is rounder and warmer than the Inter used everywhere else.
 */
export default function Reading({ value, unit, color, size = 'lg', label, sx }: ReadingProps) {
  const scale = size === 'lg' ? type.reading : type.readingSm;

  return (
    <Box
      component="span"
      // The value and unit are separate spans so the unit can be set small and
      // dropped to the baseline; without grouping they are announced as two
      // fragments. role="img" + aria-label collapses them into one value.
      // (role="text" would be neater but is Safari-only — on other browsers it
      // is ignored, and with both children aria-hidden the readout would have
      // had no accessible name at all.)
      role="img"
      aria-label={ label ?? `${value}${unit ?? ''}` }
      sx={ {
        ...scale,
        color,
        display: 'inline-flex',
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
        ...sx,
      } }
    >
      <Box component="span" aria-hidden>{ value }</Box>
      { unit && (
        <Box
          component="span"
          aria-hidden
          sx={ {
            fontSize: '0.32em',
            fontWeight: 600,
            letterSpacing: '0.01em',
            // Nudged so it sits on the baseline rather than riding it.
            transform: 'translateY(-0.06em)',
            marginLeft: '0.06em',
          } }
        >
          { unit }
        </Box>
      ) }
    </Box>
  );
}
