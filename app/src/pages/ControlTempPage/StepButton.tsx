import React from 'react';
import { ButtonBase, Box, alpha } from '@mui/material';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';

import { motion, radius, surface, textColor, type } from '../../designTokens.ts';

type StepButtonProps = {
  /** Accessible label; the visible text is the child. */
  label: string;
  disabled: boolean;
  onClick: () => void;
  /** Ember colour, used for the pressed and hover state. */
  accent: string;
  direction: 'up' | 'down';
};

/**
 * A named temperature control — "cooler" / "warmer" rather than − / +.
 *
 * Reaching over in the dark, a word is faster to identify than a symbol, and
 * a labelled target is naturally large enough to clear the 44px minimum
 * without padding a tiny glyph out to size.
 */
export default function StepButton({
  label,
  disabled,
  onClick,
  accent,
  direction,
  children,
}: React.PropsWithChildren<StepButtonProps>) {
  const Arrow = direction === 'up' ? KeyboardArrowUpRounded : KeyboardArrowDownRounded;

  return (
    <ButtonBase
      aria-label={ label }
      disabled={ disabled }
      onClick={ onClick }
      sx={ {
        ...type.control,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        // Sized to the label rather than stretched across the card: these are
        // secondary to the readout and should not compete with it.
        flex: '0 1 auto',
        minWidth: 96,
        minHeight: 44,
        px: 1.5,
        borderRadius: `${radius.pill}px`,
        backgroundColor: surface.overlay,
        color: textColor.tertiary,
        transition: [
          `background-color ${motion.fast}`,
          `color ${motion.fast}`,
          `transform ${motion.press}`,
        ].join(', '),
        '&:hover:not(:disabled)': {
          backgroundColor: surface.hover,
          color: textColor.primary,
        },
        '&:active:not(:disabled)': {
          transform: 'scale(0.97)',
          backgroundColor: alpha(accent, 0.18),
          color: accent,
        },
        '&:disabled': { opacity: 0.3 },
      } }
    >
      <Arrow sx={ { fontSize: 18, opacity: 0.7 } } />
      <Box component="span">{ children }</Box>
    </ButtonBase>
  );
}
