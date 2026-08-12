import { Box, Typography } from '@mui/material';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';

import { useSettings } from '@api/settings.ts';
import { useControlTempStore } from './controlTempStore.tsx';
import { textColor, type } from '../../designTokens.ts';

/**
 * The gap between the two sides.
 *
 * The one number that only exists because two people share this bed — how far
 * apart their settings are. Sits in the space between the cards, and hides
 * itself when the sides match or when either is off, so it only appears when
 * it is actually saying something.
 */
export default function SideDifferential() {
  const { deviceStatus } = useControlTempStore();
  const { data: settings } = useSettings();

  const left = deviceStatus?.left;
  const right = deviceStatus?.right;
  if (!left?.isOn || !right?.isOn) return null;

  const leftTemp = left.targetTemperatureF ?? 0;
  const rightTemp = right.targetTemperatureF ?? 0;
  const deltaF = Math.abs(leftTemp - rightTemp);
  if (deltaF === 0) return null;

  const isCelsius = settings?.temperatureFormat === 'celsius';
  // Scaled as a difference, not converted as an absolute temperature — °C and
  // °F have different zero points, so the usual conversion would be wrong here.
  const delta = isCelsius ? Math.round((deltaF * 5 / 9) * 2) / 2 : deltaF;

  return (
    <Box
      sx={ {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        py: 0.25,
      } }
    >
      <KeyboardArrowDownRounded sx={ { fontSize: 15, color: textColor.disabled } } />
      <Typography
        className="tabular"
        sx={ { ...type.caption, color: textColor.tertiary } }
      >
        { delta }° apart
      </Typography>
    </Box>
  );
}
