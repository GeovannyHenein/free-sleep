import { Box, Typography } from '@mui/material';

import { textColor, type } from '../../designTokens.ts';

/**
 * Shown while the Hub is pushing water through the cover to clear air.
 *
 * Rendered as a quiet line rather than an alert — priming is a normal part of
 * how the machine works, not a condition the user needs to act on.
 */
export default function PrimingNotification() {
  return (
    <Box sx={ { display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 } }>
      <Box
        aria-hidden
        sx={ {
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: textColor.tertiary,
          animation: 'gbedos-prime 2s ease-in-out infinite',
          '@keyframes gbedos-prime': {
            '0%, 100%': { opacity: 0.35 },
            '50%': { opacity: 1 },
          },
        } }
      />
      <Typography sx={ { ...type.status, color: textColor.tertiary } }>
        priming the water loop
      </Typography>
    </Box>
  );
}
