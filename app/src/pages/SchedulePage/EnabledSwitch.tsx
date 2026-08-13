import { Box, Switch, Typography } from '@mui/material';
import { useScheduleStore } from './scheduleStore.tsx';
import { useAppStore } from '@state/appStore.tsx';
import { textColor, type } from '../../designTokens.ts';

/**
 * Master switch for the selected day's schedule.
 *
 * Rendered as a labelled row rather than a floating checkbox — it governs
 * everything else on the page, so it reads as a heading with a control rather
 * than one more field among the settings.
 */
export default function EnabledSwitch() {
  const { isUpdating } = useAppStore();
  const { selectedSchedule, updateSelectedSchedule } = useScheduleStore();
  const enabled = selectedSchedule?.power.enabled || false;

  return (
    <Box
      sx={ {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 1,
      } }
    >
      <Box>
        <Typography sx={ { ...type.name, color: textColor.primary } }>
          Schedule
        </Typography>
        <Typography sx={ { ...type.caption, color: textColor.tertiary } }>
          { enabled ? 'runs automatically tonight' : 'not running tonight' }
        </Typography>
      </Box>
      <Switch
        checked={ enabled }
        onChange={ () => {
          updateSelectedSchedule({
            power: { enabled: !selectedSchedule?.power.enabled }
          });
        } }
        disabled={ isUpdating }
        inputProps={ { 'aria-label': 'enable this day\'s schedule' } }
      />
    </Box>
  );
}
