import { Box, Typography } from '@mui/material';
import moment from 'moment-timezone';

import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { formatTemperature } from '@lib/temperatureConversions.ts';
import { textColor, type } from '../../designTokens.ts';


type TemperatureLabelProps = {
  isOn: boolean;
  sliderTemp: number;
  sliderColor: string;
  currentTargetTemp: number;
  currentTemperatureF: number;
  displayCelsius: boolean;
  /** Defaults to the globally selected side; pass explicitly to render a specific side. */
  side?: Side;
}


export default function TemperatureLabel({
  isOn,
  sliderTemp,
  sliderColor,
  currentTargetTemp,
  currentTemperatureF,
  displayCelsius,
  side: sideProp,
}: TemperatureLabelProps) {
  const { side: storeSide } = useAppStore();
  const side = sideProp ?? storeSide;
  const { data: schedules } = useSchedules();
  const { data: settings } = useSettings();
  const isInAwayMode = settings?.[side].awayMode;

  const currentDay = settings?.timeZone && moment.tz(settings?.timeZone).format('dddd').toLowerCase();
  // @ts-expect-error
  const power = currentDay ? schedules?.[side]?.[currentDay]?.power : undefined;
  const formattedTime = moment(power?.on, 'HH:mm').format('h:mm A');
  const powerOffTime = moment(power?.off, 'HH:mm').format('h:mm A');

  let topTitle: string;
  // Handle user actively changing temp
  if (sliderTemp !== currentTargetTemp) {
    if (sliderTemp < currentTemperatureF) {
      topTitle = 'Cool to';
    } else if (sliderTemp > currentTemperatureF) {
      topTitle = 'Warm to';
    } else {
      topTitle = '';
    }
  } else {
    if (currentTemperatureF < currentTargetTemp) {
      topTitle = 'Warming to';
    } else if (currentTemperatureF > currentTargetTemp) {
      topTitle = 'Cooling to';
    } else {
      topTitle = '';
    }
  }

  return (
    <div
      style={ {
        position: 'absolute',
        top: '10%',
        left: '50%',
        pointerEvents: 'none',
        textAlign: 'center',
        height: '300px',
        width: '100%',
      } }
    >
      {
        isOn ? (
          <Box
            sx={ {
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            } }
          >
            { /* Small caps label above the readout — recessive by design so
                 the number is unambiguously the hero. */ }
            <Typography
              variant="overline"
              sx={ { textWrap: 'nowrap', textAlign: 'center', color: textColor.tertiary } }
            >
              { topTitle }
            </Typography>

            { /* Temperature — the hero, with a blurred halo behind it. */ }
            <Box sx={ { position: 'relative', mb: 0.75 } }>
              <Box
                aria-hidden
                sx={ {
                  ...type.reading,
                  position: 'absolute',
                  inset: 0,
                  color: sliderColor,
                  filter: 'blur(20px)',
                  opacity: 0.45,
                  pointerEvents: 'none',
                } }
              >
                { formatTemperature(currentTargetTemp !== sliderTemp ? sliderTemp : currentTargetTemp, displayCelsius) }
              </Box>
              <Box sx={ { ...type.reading, position: 'relative', color: sliderColor, textWrap: 'nowrap' } }>
                { formatTemperature(currentTargetTemp !== sliderTemp ? sliderTemp : currentTargetTemp, displayCelsius) }
              </Box>
            </Box>

            { /* Supporting readouts, held well below the hero in the hierarchy. */ }
            <Typography
              className="tabular"
              sx={ { ...type.caption, textWrap: 'nowrap', color: textColor.secondary, mb: 0.5 } }
            >
              { `Now ${formatTemperature(currentTemperatureF, displayCelsius)}` }
            </Typography>
            {
              power?.enabled && (
                <Typography
                  variant="overline"
                  sx={ { textWrap: 'nowrap', color: textColor.disabled } }
                >
                  Off at { powerOffTime }
                </Typography>
              )
            }
          </Box>
        ) : (
          <Box
            sx={ {
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            } }
          >
            <Box sx={ { ...type.reading, color: textColor.disabled, opacity: 0.55 } }>
              Off
            </Box>
            {
              power?.enabled && !isInAwayMode && (
                <Typography
                  variant="overline"
                  sx={ { textWrap: 'nowrap', color: textColor.disabled, mt: 0.5 } }
                >
                  On at { formattedTime }
                </Typography>
              )
            }
          </Box>
        )
      }
    </div>
  );
}
