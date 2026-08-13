import { Box, Dialog, IconButton, Typography, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment-timezone';
import { useCallback, useEffect, useRef, useState } from 'react';

import Reading from '@components/Reading.tsx';
import TemperatureRing from '@components/TemperatureRing.tsx';
import StepButton from './StepButton.tsx';
import { postDeviceStatus } from '@api/deviceStatus.ts';
import { useControlTempStore } from './controlTempStore.tsx';
import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import { ember, motion, radius, surface, textColor, type } from '../../designTokens.ts';
import {
  MAX_TEMP_F,
  MIN_TEMP_F,
  formatDegrees,
  getTemperatureColor,
  splitTemperature,
} from '@lib/temperatureConversions.ts';

const DEBOUNCE_MS = 2000;

type SideDetailDialogProps = {
  /** The side to control, or null when closed. */
  side: Side | null;
  onClose: () => void;
  refetch: any;
};

/**
 * Expanded control for one side.
 *
 * Deliberately the same object as the card, scaled up: same ring, same
 * lockup, same named steppers, same black surface. Opening it should feel
 * like the card growing rather than moving to a different screen, so the
 * only things it adds are a larger ring and the schedule detail that does
 * not fit in the collapsed state.
 */
export default function SideDetailDialog({ side, onClose, refetch }: SideDetailDialogProps) {
  const { deviceStatus, setDeviceStatus } = useControlTempStore();
  const { data: settings } = useSettings();
  const { data: schedules } = useSchedules();
  const { isUpdating, setIsUpdating } = useAppStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nudge, setNudge] = useState(0);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = side !== null;
  const profile = side ? getProfile(side) : null;
  const name = side ? getProfileName(side, settings?.[side]?.name) : '';
  const sideStatus = side ? deviceStatus?.[side] : undefined;
  const isOn = sideStatus?.isOn ?? false;
  const isAway = side ? settings?.[side]?.awayMode ?? false : false;
  const isCelsius = settings?.temperatureFormat === 'celsius';

  const targetTemp = sideStatus?.targetTemperatureF ?? 55;
  const currentTemp = sideStatus?.currentTemperatureF ?? 55;
  const emberColor = profile
    ? ember.color(getTemperatureColor(targetTemp), profile.accent)
    : textColor.secondary;

  type DayPower = { enabled: boolean; on: string; off: string };
  const currentDay = settings?.timeZone && moment.tz(settings.timeZone).format('dddd').toLowerCase();
  const power = side && currentDay
    ? (schedules?.[side] as Record<string, { power?: DayPower }> | undefined)?.[currentDay]?.power
    : undefined;
  const scheduleLabel = power?.enabled
    ? isOn
      ? `off at ${moment(power.off, 'HH:mm').format('h:mm a')}`
      : `on at ${moment(power.on, 'HH:mm').format('h:mm a')}`
    : null;

  let thermalState: string;
  if (!isOn) {
    thermalState = 'off';
  } else if (currentTemp < targetTemp) {
    thermalState = 'warming';
  } else if (currentTemp > targetTemp) {
    thermalState = 'cooling';
  } else {
    thermalState = 'holding';
  }

  const postUpdate = useCallback(async () => {
    if (!side) return;
    setIsUpdating(true);
    try {
      await postDeviceStatus({
        [side]: { targetTemperatureF: useControlTempStore.getState().deviceStatus?.[side]?.targetTemperatureF },
      });
      await new Promise(r => setTimeout(r, 1_500));
      await (refetch?.() as Promise<unknown> | undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  }, [side, refetch, setIsUpdating]);

  const handleTempChange = (delta: number) => {
    if (!side || !deviceStatus) return;
    const next = targetTemp + delta;
    if (next < MIN_TEMP_F || next > MAX_TEMP_F) return;

    setNudge(delta);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudge(0), 200);

    setDeviceStatus({ [side]: { targetTemperatureF: next } });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(postUpdate, DEBOUNCE_MS);
  };

  const handleTogglePower = () => {
    if (!side) return;
    const next = !isOn;
    setIsUpdating(true);
    setDeviceStatus({ [side]: { isOn: next } });
    postDeviceStatus({ [side]: { isOn: next } })
      .then(() => new Promise(r => setTimeout(r, 1_000)))
      .then(() => refetch?.())
      .catch(err => console.error(err))
      .finally(() => setIsUpdating(false));
  };

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
  }, []);

  const controlsDisabled = isUpdating || isAway || !isOn;
  const { value: tempValue, unit: tempUnit } = splitTemperature(targetTemp, isCelsius);
  const isWorking = isOn && currentTemp !== targetTemp;

  return (
    <Dialog
      open={ open }
      onClose={ onClose }
      fullWidth
      maxWidth="xs"
      slotProps={ {
        paper: {
          sx: {
            backgroundColor: surface.raised,
            backgroundImage: 'none',
            border: 'none',
            borderRadius: `${radius.xl}px`,
            m: 2,
          },
        },
        backdrop: {
          // Near-opaque so the page behind drops away entirely; the dialog is
          // the same black as the page, and a light scrim would leave the two
          // competing.
          sx: { backgroundColor: alpha('#000000', 0.82) },
        },
      } }
    >
      { side && (
        <Box sx={ { display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2.5, pt: 2, pb: 3 } }>
          <Box sx={ { display: 'flex', alignItems: 'center', width: '100%' } }>
            <Typography sx={ { ...type.name, color: textColor.secondary, flexGrow: 1 } }>
              { name }
            </Typography>
            <IconButton onClick={ onClose } aria-label="close" sx={ { color: textColor.tertiary, mr: -1 } }>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          { /* Same ring as the card, larger. */ }
          <Box
            sx={ {
              mt: 1,
              transition: `transform ${motion.spring}`,
              transform: nudge === 0 ? 'none' : `translateY(${nudge > 0 ? -5 : 5}px)`,
              ...(isOn && {
                filter: `drop-shadow(0 0 28px ${alpha(emberColor, 0.3)})`,
              }),
              ...(isOn && isWorking && {
                animation: `gbedos-breathe ${ember.breathDuration} ease-in-out infinite`,
              }),
              '@keyframes gbedos-breathe': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.72 },
              },
            } }
          >
            <TemperatureRing
              targetF={ targetTemp }
              color={ emberColor }
              active={ isOn }
              size={ 188 }
              thickness={ 7 }
            >
              <Reading
                value={ isOn ? tempValue : '—' }
                unit={ isOn ? tempUnit : undefined }
                color={ isOn ? textColor.primary : textColor.disabled }
                label={ isOn ? `${tempValue}${tempUnit}` : 'off' }
              />
            </TemperatureRing>
          </Box>

          <Typography
            className="tabular"
            sx={ { ...type.status, color: textColor.tertiary, mt: 1.5 } }
          >
            { isOn
              ? `${thermalState} · now ${formatDegrees(currentTemp, isCelsius)}`
              : scheduleLabel ?? 'off' }
          </Typography>

          { !isAway && (
            <>
              <Box sx={ { display: 'flex', gap: 1, mt: 2.5, width: '100%', justifyContent: 'center' } }>
                <StepButton
                  label={ `make ${name}'s side cooler` }
                  disabled={ controlsDisabled || targetTemp <= MIN_TEMP_F }
                  onClick={ () => handleTempChange(-1) }
                  accent={ emberColor }
                  direction="down"
                >
                  cooler
                </StepButton>
                <StepButton
                  label={ `make ${name}'s side warmer` }
                  disabled={ controlsDisabled || targetTemp >= MAX_TEMP_F }
                  onClick={ () => handleTempChange(1) }
                  accent={ emberColor }
                  direction="up"
                >
                  warmer
                </StepButton>
              </Box>

              <Box
                component="button"
                onClick={ handleTogglePower }
                disabled={ isUpdating }
                aria-label={ `turn ${name}'s side ${isOn ? 'off' : 'on'}` }
                sx={ {
                  ...type.control,
                  mt: 1.5,
                  minHeight: 44,
                  px: 3,
                  border: 'none',
                  borderRadius: `${radius.pill}px`,
                  cursor: 'pointer',
                  backgroundColor: alpha(emberColor, isOn ? 0.1 : 0.18),
                  color: isOn ? textColor.secondary : emberColor,
                  transition: `background-color ${motion.fast}, color ${motion.fast}`,
                  '&:disabled': { opacity: 0.4, cursor: 'default' },
                } }
              >
                { isOn ? 'turn off' : 'turn on' }
              </Box>
            </>
          ) }
        </Box>
      ) }
    </Dialog>
  );
}
