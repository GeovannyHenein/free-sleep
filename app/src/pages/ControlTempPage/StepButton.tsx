import React from 'react';
import { ButtonBase, alpha } from '@mui/material';

import { motion, radius, shadow, surface, surfaceTreatment, textColor } from '../../designTokens.ts';

type StepButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  /** Profile accent applied on hover, so the control reads as that person's. */
  accent: string;
};

/** Square ±1° stepper used by the compact side panels. */
export default function StepButton({
  label,
  disabled,
  onClick,
  accent,
  children,
}: React.PropsWithChildren<StepButtonProps>) {
  return (
    <ButtonBase
      aria-label={ label }
      disabled={ disabled }
      onClick={ onClick }
      sx={ {
        width: 48,
        height: 40,
        borderRadius: `${radius.sm}px`,
        border: `1px solid ${alpha('#FFFFFF', 0.07)}`,
        // Moulded key: gradient for form, top hairline so it catches light.
        background: surfaceTreatment.control,
        backgroundColor: surface.overlay,
        boxShadow: `${shadow.hairline}, 0 1px 3px rgba(0,0,0,0.35)`,
        color: textColor.secondary,
        transition: [
          `background ${motion.fast}`,
          `border-color ${motion.fast}`,
          `color ${motion.fast}`,
          `box-shadow ${motion.press}`,
          `transform ${motion.press}`,
        ].join(', '),
        '&:hover:not(:disabled)': {
          borderColor: alpha(accent, 0.38),
          color: accent,
          boxShadow: `${shadow.hairlineStrong}, 0 0 14px ${alpha(accent, 0.16)}`,
        },
        // Sinks into the surface: the highlight flips to an inner shadow.
        '&:active:not(:disabled)': {
          transform: 'translateY(1px) scale(0.96)',
          boxShadow: shadow.pressed,
          background: 'none',
          backgroundColor: alpha('#000000', 0.24),
        },
        '&:disabled': { opacity: 0.3, boxShadow: 'none' },
      } }
    >
      { children }
    </ButtonBase>
  );
}
