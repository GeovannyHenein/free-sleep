import { Box, ButtonBase, Typography, alpha } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';

import { postDeviceStatus } from '@api/deviceStatus.ts';
import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import StepButton from './StepButton.tsx';
import Reading from '@components/Reading.tsx';
import TemperatureRing from '@components/TemperatureRing.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import {
  ember,
  motion,
  radius,
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

  // Thermal state only. Away is a separate axis — a side can be away *and*
  // running, so folding it in here hid the real state behind the away flag.
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

  /**
   * The one status line.
   *
   * Away must always surface: it means this side mirrors the other one and
   * its own controls are inert, which is exactly the thing you would be
   * confused by otherwise. Previously the schedule label took precedence and
   * an away side could read "on at 9:00 pm" with no mention of away at all.
   */
  let statusLine: string;
  if (isAway && isOn) {
    statusLine = `away · ${thermalState} · now ${formatDegrees(currentTemp, isCelsius)}`;
  } else if (isAway) {
    statusLine = scheduleLabel ? `away · ${scheduleLabel}` : 'away';
  } else if (isOn) {
    statusLine = `${thermalState} · now ${formatDegrees(currentTemp, isCelsius)}`;
  } else {
    statusLine = scheduleLabel ?? 'off';
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
        // Borderless: depth comes from the fill sitting on pure black, the
        // way a Whoop card does. A border would flatten it back into a box.
        overflow: 'hidden',
        transition: `background-color ${motion.slow}`,
      } }
    >
      { /* Header: name, and the power state as a small recessive control. */ }
      <Box
        sx={ {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          pt: 1.75,
        } }
      >
        <Typography sx={ { ...type.name, color: textColor.secondary, flexGrow: 1 } }>
          { name }
        </Typography>

        <ButtonBase
          onClick={ handleTogglePower }
          disabled={ isUpdating || isAway }
          aria-label={ `turn ${name}'s side ${isOn ? 'off' : 'on'}` }
          sx={ {
            ...type.caption,
            // Deliberately small: the number is the only dominant element, so
            // the power state reads as an annotation rather than a button.
            minHeight: 44,
            px: 1,
            color: isOn ? emberColor : textColor.tertiary,
            transition: `color ${motion.base}`,
            '&:disabled': { opacity: 0.5 },
          } }
        >
          { isAway ? 'away' : isOn ? 'warm' : 'off' }
        </ButtonBase>
      </Box>

      { /* The ring is the card. Tapping it opens the full slider. */ }
      <ButtonBase
        onClick={ () => onExpand(side) }
        aria-label={ `open full temperature control for ${name}` }
        sx={ {
          width: '100%',
          flexDirection: 'column',
          gap: 0.75,
          pt: 0.5,
          pb: 2,
          borderRadius: 0,
        } }
      >
        <Box
          sx={ {
            transition: `transform ${motion.spring}`,
            transform: nudge === 0 ? 'none' : `translateY(${nudge > 0 ? -4 : 4}px)`,
            // A soft bloom behind the ring, in the side's accent. This is what
            // carries the colour now that the card itself is borderless.
            ...(isOn && {
              filter: `drop-shadow(0 0 24px ${alpha(emberColor, 0.28)})`,
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
          <TemperatureRing targetF={ targetTemp } color={ emberColor } active={ isOn }>
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
          sx={ { ...type.status, color: textColor.tertiary } }
        >
          { statusLine }
        </Typography>
      </ButtonBase>

      { /* Small, quiet stepper controls. */ }
      { !isAway && (
        <Box
          sx={ {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            px: 2,
            pb: 2,
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
        </Box>
      ) }
    </Box>
  );
}
