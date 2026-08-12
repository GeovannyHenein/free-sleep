import { Box, ButtonBase, Chip, CircularProgress, Typography, alpha } from '@mui/material';
import { Add, ChevronRight, Remove } from '@mui/icons-material';
import { useCallback, useRef } from 'react';
import moment from 'moment-timezone';

import { postDeviceStatus } from '@api/deviceStatus.ts';
import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import StepButton from './StepButton.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import { motion, radius, surface, textColor } from '../../designTokens.ts';

import {
  MAX_TEMP_F,
  MIN_TEMP_F,
  formatTemperature,
  getTemperatureColor,
} from '@lib/temperatureConversions.ts';

const DEBOUNCE_MS = 2000;

type SideCardProps = {
  side: Side;
  refetch: any;
  /** Opens the full circular-slider view for this side. */
  onExpand: (side: Side) => void;
};

/**
 * Compact always-visible panel for one side of the bed. Shows target/current
 * temperature and offers coarse ±1° control inline; tapping the card body opens
 * the full slider. Reads its side from props, never the global store, so two of
 * these can render at once.
 */
export default function SideCard({ side, refetch, onExpand }: SideCardProps) {
  const { isUpdating, setIsUpdating } = useAppStore();
  const { deviceStatus, setDeviceStatus } = useControlTempStore();
  const { data: settings } = useSettings();
  const { data: schedules } = useSchedules();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profile = getProfile(side);
  const name = getProfileName(side, settings?.[side]?.name);
  const sideStatus = deviceStatus?.[side];
  const isOn = sideStatus?.isOn ?? false;
  const isAway = settings?.[side]?.awayMode ?? false;
  const isCelsius = settings?.temperatureFormat === 'celsius';

  const targetTemp = sideStatus?.targetTemperatureF ?? 55;
  const currentTemp = sideStatus?.currentTemperatureF ?? 55;
  const tempColor = getTemperatureColor(targetTemp);

  // schedules is keyed by lowercase day name at runtime; the generated type
  // doesn't express that, so narrow it here rather than suppressing per-use.
  type DayPower = { enabled: boolean; on: string; off: string };
  const currentDay = settings?.timeZone && moment.tz(settings.timeZone).format('dddd').toLowerCase();
  const daySchedules = currentDay
    ? (schedules?.[side] as Record<string, { power?: DayPower }> | undefined)?.[currentDay]
    : undefined;
  const power = daySchedules?.power;
  const scheduleLabel = power?.enabled
    ? isOn
      ? `Off at ${moment(power.off, 'HH:mm').format('h:mm A')}`
      : `On at ${moment(power.on, 'HH:mm').format('h:mm A')}`
    : null;

  let stateLabel: string;
  if (isAway) {
    stateLabel = 'Away';
  } else if (!isOn) {
    stateLabel = 'Off';
  } else if (currentTemp < targetTemp) {
    stateLabel = 'Warming';
  } else if (currentTemp > targetTemp) {
    stateLabel = 'Cooling';
  } else {
    stateLabel = 'Holding';
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

  const controlsDisabled = isUpdating || isAway;

  return (
    <Box
      sx={ {
        position: 'relative',
        borderRadius: `${radius.lg}px`,
        border: '1px solid',
        borderColor: isOn ? alpha(profile.accent, 0.28) : surface.border,
        backgroundColor: surface.raised,
        overflow: 'hidden',
        transition: `border-color ${motion.base}, background-color ${motion.base}`,
        // Accent wash at the top of the card, stronger when the side is active.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${alpha(profile.accent, isOn ? 0.1 : 0.03)} 0%, transparent 55%)`,
          pointerEvents: 'none',
        },
      } }
    >
      { /* Header: avatar, name, state, power toggle */ }
      <Box
        sx={ {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          pt: 2,
          pb: 1.5,
        } }
      >
        <Box
          sx={ {
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: profile.accentSoft,
            border: `1px solid ${alpha(profile.accent, 0.35)}`,
            color: profile.accent,
            fontWeight: 600,
            fontSize: '0.875rem',
          } }
        >
          { profile.initial }
        </Box>

        <Box sx={ { minWidth: 0, flexGrow: 1 } }>
          <Typography
            variant="h6"
            sx={ { lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }
          >
            { name }
          </Typography>
          <Typography variant="caption" sx={ { color: textColor.tertiary } }>
            { scheduleLabel ?? (isAway ? 'Away mode on' : 'No schedule today') }
          </Typography>
        </Box>

        { isAway ? (
          <Chip label="Away" size="small" color="warning" />
        ) : (
          <ButtonBase
            onClick={ handleTogglePower }
            disabled={ isUpdating }
            aria-label={ `Turn ${name}'s side ${isOn ? 'off' : 'on'}` }
            sx={ {
              px: 1.75,
              py: 0.75,
              borderRadius: `${radius.pill}px`,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transition: `background-color ${motion.fast}, color ${motion.fast}`,
              backgroundColor: isOn ? alpha(profile.accent, 0.16) : surface.overlay,
              color: isOn ? profile.accent : textColor.tertiary,
              border: `1px solid ${isOn ? alpha(profile.accent, 0.32) : surface.border}`,
              '&:disabled': { opacity: 0.5 },
            } }
          >
            { isOn ? 'On' : 'Off' }
          </ButtonBase>
        ) }
      </Box>

      { /* Body: temperature readout — tapping opens the full slider */ }
      <ButtonBase
        onClick={ () => onExpand(side) }
        aria-label={ `Open full temperature control for ${name}` }
        sx={ {
          position: 'relative',
          width: '100%',
          px: 2,
          pb: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          textAlign: 'left',
          transition: `background-color ${motion.fast}`,
          '&:hover': { backgroundColor: alpha(surface.hover, 0.5) },
        } }
      >
        <Box sx={ { display: 'flex', alignItems: 'baseline', gap: 1.25 } }>
          <Typography
            variant="h2"
            className="tabular"
            sx={ {
              color: isOn ? tempColor : textColor.disabled,
              transition: `color ${motion.base}`,
            } }
          >
            { isOn ? formatTemperature(targetTemp, isCelsius) : '—' }
          </Typography>
          <Box>
            <Typography variant="overline" sx={ { display: 'block', color: textColor.secondary } }>
              { stateLabel }
            </Typography>
            { isOn && (
              <Typography variant="caption" className="tabular" sx={ { color: textColor.tertiary } }>
                now { formatTemperature(currentTemp, isCelsius) }
              </Typography>
            ) }
          </Box>
        </Box>

        <ChevronRight sx={ { color: textColor.tertiary, mb: 1 } } />
      </ButtonBase>

      { /* Footer: inline ±1° control */ }
      { !isAway && (
        <Box
          sx={ {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            pb: 2,
            pt: 0.5,
          } }
        >
          <StepButton
            label={ `Decrease ${name}'s temperature` }
            disabled={ controlsDisabled || !isOn || targetTemp <= MIN_TEMP_F }
            onClick={ () => handleTempChange(-1) }
            accent={ profile.accent }
          >
            <Remove fontSize="small" />
          </StepButton>
          <StepButton
            label={ `Increase ${name}'s temperature` }
            disabled={ controlsDisabled || !isOn || targetTemp >= MAX_TEMP_F }
            onClick={ () => handleTempChange(1) }
            accent={ profile.accent }
          >
            <Add fontSize="small" />
          </StepButton>

          <Box sx={ { flexGrow: 1 } } />
          { isUpdating && <CircularProgress size={ 16 } sx={ { color: profile.accent } } /> }
        </Box>
      ) }
    </Box>
  );
}
