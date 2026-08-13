import { Box, ButtonBase, CircularProgress, Typography, alpha } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';

import { postDeviceStatus } from '@api/deviceStatus.ts';
import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import StepButton from './StepButton.tsx';
import Reading from '@components/Reading.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import {
  ember,
  motion,
  radius,
  shadow,
  surface,
  textColor,
  type,
} from '../../designTokens.ts';
import {
  MAX_TEMP_F,
  MIN_TEMP_F,
  formatDegrees,
  getTemperatureColor,
  splitTemperature,
} from '@lib/temperatureConversions.ts';

const DEBOUNCE_MS = 2000;

type SideCardProps = {
  side: Side;
  refetch: any;
  /** Opens the full circular-slider view for this side. */
  onExpand: (side: Side) => void;
};

/**
 * One person's side of the bed.
 *
 * The card is lit from its inner edge — the edge facing the other person,
 * mirroring where the two zones meet in the actual mattress. That light is the
 * signature element and carries the state: dark when off, steady while holding
 * temperature, slowly breathing while the pump is working toward a target.
 *
 * Reads its side from props, never the global store, so both can render at once.
 */
export default function SideCard({ side, refetch, onExpand }: SideCardProps) {
  const { isUpdating, setIsUpdating } = useAppStore();
  const { deviceStatus, setDeviceStatus } = useControlTempStore();
  const { data: settings } = useSettings();
  const { data: schedules } = useSchedules();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nudge, setNudge] = useState(0);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profile = getProfile(side);
  const name = getProfileName(side, settings?.[side]?.name);
  const sideStatus = deviceStatus?.[side];
  const isOn = sideStatus?.isOn ?? false;
  const isAway = settings?.[side]?.awayMode ?? false;
  const isCelsius = settings?.temperatureFormat === 'celsius';

  const targetTemp = sideStatus?.targetTemperatureF ?? 55;
  const currentTemp = sideStatus?.currentTemperatureF ?? 55;
  const thermalColor = getTemperatureColor(targetTemp);
  // The ember blends the thermal reading toward the person's accent, so
  // temperature and identity are legible in a single glance.
  const emberColor = ember.color(thermalColor, profile.accent);

  type DayPower = { enabled: boolean; on: string; off: string };
  const currentDay = settings?.timeZone && moment.tz(settings.timeZone).format('dddd').toLowerCase();
  const daySchedules = currentDay
    ? (schedules?.[side] as Record<string, { power?: DayPower }> | undefined)?.[currentDay]
    : undefined;
  const power = daySchedules?.power;
  const scheduleLabel = power?.enabled
    ? isOn
      ? `off at ${moment(power.off, 'HH:mm').format('h:mm a')}`
      : `on at ${moment(power.on, 'HH:mm').format('h:mm a')}`
    : null;

  // Working = the pump is actively driving toward a target, which is what the
  // breathing ember indicates.
  const isWorking = isOn && currentTemp !== targetTemp;
  let stateLabel: string;
  if (isAway) {
    stateLabel = 'away';
  } else if (!isOn) {
    stateLabel = 'off';
  } else if (currentTemp < targetTemp) {
    stateLabel = 'warming';
  } else if (currentTemp > targetTemp) {
    stateLabel = 'cooling';
  } else {
    stateLabel = 'holding';
  }

  const postUpdate = useCallback(async () => {
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
    if (!deviceStatus) return;
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

  return (
    <Box
      sx={ {
        position: 'relative',
        borderRadius: `${radius.xl}px`,
        backgroundColor: surface.raised,
        border: `1px solid ${isOn ? alpha(emberColor, 0.16) : surface.border}`,
        boxShadow: isOn
          ? `${shadow.card}, 0 0 40px ${alpha(emberColor, 0.06)}`
          : shadow.card,
        overflow: 'hidden',
        transition: `border-color ${motion.slow}, box-shadow ${motion.slow}`,
      } }
    >
      { /* The ember. A hard-edged bar on the card's inner edge plus a soft
           bleed inward — a heating element seen through fabric, not a border.
           Breathes while the pump is working, steady while holding. */ }
      <Box
        aria-hidden
        sx={ {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: isOn ? emberColor : surface.border,
          opacity: isOn ? 1 : 0.5,
          transition: `background-color ${motion.slow}, opacity ${motion.slow}`,
          ...(isOn && isWorking && !isUpdating && {
            animation: `gbedos-ember ${ember.breathDuration} ease-in-out infinite`,
          }),
          '@keyframes gbedos-ember': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.42 },
          },
        } }
      />
      <Box
        aria-hidden
        sx={ {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          // Wide and soft: light spilling across the card from the element at
          // its edge, falling off well before the far side.
          width: '62%',
          pointerEvents: 'none',
          background: isOn
            ? `linear-gradient(90deg, ${alpha(emberColor, 0.3)} 0%, ${alpha(emberColor, 0.1)} 32%, transparent 100%)`
            : 'none',
          transition: `background ${motion.slow}`,
          ...(isOn && isWorking && !isUpdating && {
            animation: `gbedos-ember-bleed ${ember.breathDuration} ease-in-out infinite`,
          }),
          '@keyframes gbedos-ember-bleed': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
        } }
      />

      { /* Header: name and power state */ }
      <Box
        sx={ {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pl: 2.5,
          pr: 1.5,
          pt: 1,
          pb: 0.5,
        } }
      >
        <Typography sx={ { ...type.name, color: textColor.primary, flexGrow: 1 } }>
          { name }
        </Typography>

        <ButtonBase
          onClick={ handleTogglePower }
          disabled={ isUpdating || isAway }
          aria-label={ `turn ${name}'s side ${isOn ? 'off' : 'on'}` }
          sx={ {
            ...type.control,
            minHeight: 44,
            px: 2,
            borderRadius: `${radius.pill}px`,
            color: isOn ? emberColor : textColor.tertiary,
            transition: `color ${motion.base}, background-color ${motion.fast}`,
            '&:hover:not(:disabled)': { backgroundColor: alpha('#FFFFFF', 0.04) },
            '&:disabled': { opacity: 0.4 },
          } }
        >
          { isAway ? 'away' : isOn ? 'warm' : 'off' }
        </ButtonBase>
      </Box>

      { /* Reading. Tapping opens the full slider. */ }
      <ButtonBase
        onClick={ () => onExpand(side) }
        aria-label={ `open full temperature control for ${name}` }
        sx={ {
          position: 'relative',
          width: '100%',
          justifyContent: 'flex-start',
          textAlign: 'left',
          pl: 2.5,
          pr: 1.5,
          pb: 1.25,
          borderRadius: 0,
          transition: `background-color ${motion.fast}`,
          '&:hover': { backgroundColor: alpha('#FFFFFF', 0.02) },
        } }
      >
        <Box>
          <Box
            sx={ {
              transition: `transform ${motion.spring}`,
              transform: nudge === 0 ? 'none' : `translateY(${nudge > 0 ? -4 : 4}px)`,
            } }
          >
            <Reading
              value={ isOn ? tempValue : '—' }
              unit={ isOn ? tempUnit : undefined }
              color={ isOn ? textColor.primary : textColor.disabled }
              label={ isOn ? `${tempValue}${tempUnit}` : 'off' }
            />
          </Box>

          { /* One status line. */ }
          <Typography
            className="tabular"
            sx={ { ...type.status, color: textColor.secondary, mt: 0.5 } }
          >
            { isOn
              ? `${stateLabel} · now ${formatDegrees(currentTemp, isCelsius)}`
              : scheduleLabel ?? stateLabel }
          </Typography>
        </Box>
      </ButtonBase>

      { /* Named controls rather than symbols — easier to hit and to read
           half-asleep than a bare − / +. */ }
      { !isAway && (
        <Box
          sx={ {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pl: 2.5,
            pr: 2.5,
            pb: 1.75,
          } }
        >
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
          { isUpdating && (
            <CircularProgress size={ 14 } sx={ { color: textColor.tertiary, ml: 0.5 } } />
          ) }
        </Box>
      ) }
    </Box>
  );
}
