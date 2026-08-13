import { Box } from '@mui/material';

import { motion, surface } from '../designTokens.ts';

/**
 * The comfortable operating band, in °F.
 *
 * The device accepts 55–110°F, but a bed in use lives in a much narrower
 * range. Scaling the arc to the full device range would leave it hovering
 * around the halfway mark with a 1° change moving it under 2% — visually
 * inert, and it would read as a broken progress indicator. Mapping to the
 * band people actually use makes each degree visible.
 */
const RING_MIN_F = 65;
const RING_MAX_F = 100;

type TemperatureRingProps = {
  /** Target temperature in °F, always — conversion is display-only. */
  targetF: number;
  /** Accent for the filled portion. */
  color: string;
  /** Unlit when the side is off. */
  active: boolean;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
};

/**
 * A ring showing where the target sits within the useful temperature band,
 * with the readout nested inside it.
 *
 * Drawn as an SVG circle with a dash offset rather than a conic gradient, so
 * the stroke has round caps and animates smoothly as the value changes.
 */
export default function TemperatureRing({
  targetF,
  color,
  active,
  size = 104,
  thickness = 5,
  children,
}: TemperatureRingProps) {
  const clamped = Math.min(Math.max(targetF, RING_MIN_F), RING_MAX_F);
  const progress = (clamped - RING_MIN_F) / (RING_MAX_F - RING_MIN_F);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  // Leave a gap at the bottom so the ring reads as a gauge rather than a
  // closed loop; the arc spans 300° of the circle.
  const arcFraction = 300 / 360;
  const arcLength = circumference * arcFraction;
  const filled = arcLength * progress;

  return (
    <Box sx={ { position: 'relative', width: size, height: size, flexShrink: 0 } }>
      <Box
        component="svg"
        aria-hidden
        viewBox={ `0 0 ${size} ${size}` }
        sx={ {
          width: size,
          height: size,
          // Rotate so the gap sits at the bottom and the arc starts lower-left.
          transform: 'rotate(120deg)',
        } }
      >
        <circle
          cx={ size / 2 }
          cy={ size / 2 }
          r={ radius }
          fill="none"
          stroke={ surface.overlay }
          strokeWidth={ thickness }
          strokeLinecap="round"
          strokeDasharray={ `${arcLength} ${circumference}` }
        />
        <circle
          cx={ size / 2 }
          cy={ size / 2 }
          r={ radius }
          fill="none"
          stroke={ active ? color : 'transparent' }
          strokeWidth={ thickness }
          strokeLinecap="round"
          strokeDasharray={ `${filled} ${circumference}` }
          style={ {
            transition: `stroke-dasharray ${motion.base}, stroke ${motion.base}`,
          } }
        />
      </Box>

      { /* Readout, centred inside the ring. */ }
      <Box
        sx={ {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
        } }
      >
        { children }
      </Box>
    </Box>
  );
}
