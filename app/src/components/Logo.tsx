import { useId } from 'react';
import { Box, Typography } from '@mui/material';

import { APP_NAME, APP_TAGLINE } from '../config/branding.ts';
import { textColor } from '../designTokens.ts';

type LogoProps = {
  /** Pixel size of the mark. */
  size?: number;
  /** Render the GBedOS wordmark and "by Geo" line beside the mark. */
  showWordmark?: boolean;
};

/**
 * GBedOS mark and wordmark lockup.
 *
 * The mark is inlined rather than loaded from /gbedos-mark.svg so the gradient
 * ships with the bundle and there is no flash of missing logo on first paint.
 * Keep the geometry in sync with public/gbedos-mark.svg, which serves as the
 * favicon and PWA icon.
 */
export default function Logo({ size = 34, showWordmark = true }: LogoProps) {
  // The desktop and mobile navs both mount a Logo, so the gradient needs a
  // unique id per instance rather than a hardcoded one.
  const gradientId = `gbedos-thermal-${useId()}`;

  return (
    <Box sx={ { display: 'flex', alignItems: 'center', gap: 1.25 } }>
      <svg
        viewBox="0 0 64 64"
        width={ size }
        height={ size }
        style={ { display: 'block', flexShrink: 0 } }
        role="img"
        aria-label={ APP_NAME }
      >
        <defs>
          <linearGradient id={ gradientId } x1="0.08" y1="0.96" x2="0.92" y2="0.04">
            <stop offset="0%" stopColor="#4DA3F5" />
            <stop offset="55%" stopColor="#D9B87A" />
            <stop offset="100%" stopColor="#E89A5C" />
          </linearGradient>
        </defs>
        <path
          d="M46.2 19.4 A18.5 18.5 0 1 0 46.2 44.6"
          fill="none"
          stroke={ `url(#${gradientId})` }
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M46.2 44.6 V34 H35.5"
          fill="none"
          stroke={ `url(#${gradientId})` }
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      { showWordmark && (
        <Box sx={ { lineHeight: 1 } }>
          <Typography
            sx={ {
              fontSize: '1.0625rem',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            } }
          >
            { APP_NAME }
          </Typography>
          <Typography
            variant="overline"
            sx={ { display: 'block', color: textColor.tertiary, mt: '2px' } }
          >
            { APP_TAGLINE }
          </Typography>
        </Box>
      ) }
    </Box>
  );
}
