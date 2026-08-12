import React from 'react';
import { ButtonBase, alpha } from '@mui/material';

import { motion, radius, surface, textColor } from '../../designTokens.ts';

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
        width: 44,
        height: 36,
        borderRadius: `${radius.sm}px`,
        border: `1px solid ${surface.border}`,
        backgroundColor: surface.overlay,
        color: textColor.secondary,
        transition: `background-color ${motion.fast}, border-color ${motion.fast}, color ${motion.fast}`,
        '&:hover:not(:disabled)': {
          borderColor: alpha(accent, 0.4),
          color: accent,
        },
        '&:disabled': { opacity: 0.35 },
      } }
    >
      { children }
    </ButtonBase>
  );
}
