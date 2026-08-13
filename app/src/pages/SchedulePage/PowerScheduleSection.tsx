import { Box, InputAdornment, Paper, Slider, TextField, Typography } from '@mui/material';
import { useAppStore } from '@state/appStore.tsx';
import { useScheduleStore } from './scheduleStore.tsx';
import { formatTemperature, getTemperatureColor, MAX_TEMP_F, MIN_TEMP_F } from '@lib/temperatureConversions.ts';
import PowerOffTime from './PowerOffTime.tsx';
import AccessTime from '@mui/icons-material/AccessTime';
import { useTheme } from '@mui/material/styles';
import { textColor, thermal, type } from '../../designTokens.ts';

export default function PowerScheduleSection({ displayCelsius }: { displayCelsius: boolean }) {
  const { isUpdating } = useAppStore();
  const theme = useTheme();
  const { selectedSchedule, updateSelectedSchedule } = useScheduleStore();
  const disabled = !selectedSchedule?.power.enabled || isUpdating;
  const onTemperatureValue = selectedSchedule?.power?.onTemperature || 82;
  return (
    <Paper sx={ { p: 2.5, width: '100%' } }>
      <Box sx={ { display: 'flex', alignItems: 'center', gap: 1.5, p: 0, width: '100%', mb: 3 } }>
        { /* Start time */ }
        <TextField
          label="Power on"
          type="time"
          variant='outlined'
          value={ selectedSchedule?.power.on || '21:00' }
          disabled={ disabled }
          onChange={ (event) => {
            updateSelectedSchedule({
              power: {
                on: event.target.value,
              }
            });
          } }
          sx={ {
            flex: 1,
            minWidth: 0,
            // Hide native indicator (where it exists)
            '& input::-webkit-calendar-picker-indicator': {
              opacity: 0,
              display: 'none',
            },
          } }
          InputProps={ {
            endAdornment: (
              <InputAdornment position="end" sx={ { cursor: 'pointer' } } >
                <AccessTime sx={ { color: theme.palette.grey[500] } } fontSize='small'/>
              </InputAdornment>
            ),
          } }
        />
        <PowerOffTime/>
      </Box>
      { /* Temperature slider. The rail carries the full cool-to-warm ramp so
           the scale itself shows what the ends mean; the thumb takes the
           colour of the selected temperature and picks a point along it. */ }
      <Box sx={ { display: 'flex', flexDirection: 'column', gap: 1, flex: 1, px: 1 } }>
        <Box sx={ { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' } }>
          <Typography sx={ { ...type.status, color: textColor.secondary } }>
            starts at
          </Typography>
          <Typography
            className="tabular"
            sx={ { ...type.name, color: getTemperatureColor(onTemperatureValue) } }
          >
            { formatTemperature(selectedSchedule?.power?.onTemperature || 82, displayCelsius) }
          </Typography>
        </Box>

        <Slider
          value={ onTemperatureValue }
          onChange={ (_, newValue) => {
            updateSelectedSchedule({
              power: {
                // @ts-ignore
                onTemperature: newValue
              }
            });
          } }
          min={ MIN_TEMP_F }
          max={ MAX_TEMP_F }
          step={ 1 }
          disabled={ disabled }
          aria-label="power on temperature"
          valueLabelDisplay="auto"
          valueLabelFormat={ (v: number) => formatTemperature(v, displayCelsius) }
          sx={ {
            width: '100%',
            color: getTemperatureColor(onTemperatureValue),
            '& .MuiSlider-rail': {
              opacity: 1,
              background: [
                `linear-gradient(90deg, ${thermal.cold} 0%`,
                `${thermal.cool} 27%`,
                `${thermal.neutral} 49%`,
                `${thermal.warm} 73%`,
                `${thermal.hot} 100%)`,
              ].join(', '),
            },
            // The filled track would obscure the ramp; the thumb alone marks
            // the value.
            '& .MuiSlider-track': { border: 'none', backgroundColor: 'transparent' },
            '& .MuiSlider-thumb': {
              backgroundColor: textColor.primary,
              border: `2px solid ${getTemperatureColor(onTemperatureValue)}`,
            },
          } }
        />

        <Box sx={ { display: 'flex', justifyContent: 'space-between' } }>
          <Typography sx={ { ...type.caption, color: textColor.tertiary } }>
            { formatTemperature(MIN_TEMP_F, displayCelsius) }
          </Typography>
          <Typography sx={ { ...type.caption, color: textColor.tertiary } }>
            { formatTemperature(MAX_TEMP_F, displayCelsius) }
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
