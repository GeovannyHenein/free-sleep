import { Box, ButtonBase, Chip, CircularProgress, Typography, alpha } from '@mui/material';
import { Add, ChevronRight, Remove } from '@mui/icons-material';
import { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';

import { postDeviceStatus } from '@api/deviceStatus.ts';
import { useSchedules } from '@api/schedules.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import StepButton from './StepButton.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import {
  blur,
  motion,
  radius,
  shadow,
  surface,
  surfaceTreatment,
  textColor,
  type,
} from '../../designTokens.ts';

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
  // -1 / +1 while the readout is kicking in the direction of a change.
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

    // Kick the readout in the direction of travel, then let it spring back.
    setNudge(delta);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudge(0), 180);

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

  // Both timers fire setState, so clear them if the card unmounts first.
  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
  }, []);

  const controlsDisabled = isUpdating || isAway;

  return (
    <Box
      sx={ {
        position: 'relative',
        borderRadius: `${radius.lg}px`,
        border: '1px solid',
        borderColor: isOn ? alpha(profile.accent, 0.22) : alpha('#FFFFFF', 0.07),
        // Frosted panel: translucent fill over a backdrop blur rather than an
        // opaque rectangle, so the card reads as glass sitting above the page.
        backgroundColor: alpha(surface.raised, 0.72),
        backdropFilter: blur.glass,
        WebkitBackdropFilter: blur.glass,
        overflow: 'hidden',
        transition: `border-color ${motion.base}, box-shadow ${motion.base}`,
        boxShadow: isOn
          ? `${shadow.hairlineStrong}, ${shadow.card}, 0 0 0 1px ${alpha(profile.accent, 0.06)}`
          : `${shadow.hairline}, ${shadow.card}`,
        // Accent wash, stronger when the side is active.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(158deg, ${alpha(profile.accent, isOn ? 0.11 : 0.03)} 0%, transparent 52%)`,
          pointerEvents: 'none',
          transition: `opacity ${motion.base}`,
        },
        // Diagonal sheen across the top edge — the highlight that sells glass.
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: surfaceTreatment.glass,
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
          px: 2.25,
          pt: 2,
          pb: 1,
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
              display: 'flex',
              alignItems: 'center',
              gap: 0.875,
              pl: 1.25,
              pr: 1.75,
              py: 0.75,
              borderRadius: `${radius.pill}px`,
              ...type.label,
              transition: [
                `background ${motion.base}`,
                `color ${motion.base}`,
                `border-color ${motion.base}`,
                `box-shadow ${motion.base}`,
                `transform ${motion.press}`,
              ].join(', '),
              background: isOn
                ? `linear-gradient(180deg, ${alpha(profile.accent, 0.24)} 0%, ${alpha(profile.accent, 0.1)} 100%)`
                : surfaceTreatment.control,
              backgroundColor: isOn ? 'transparent' : alpha('#000000', 0.28),
              color: isOn ? profile.accent : textColor.tertiary,
              border: `1px solid ${isOn ? alpha(profile.accent, 0.34) : alpha('#FFFFFF', 0.06)}`,
              boxShadow: isOn
                ? `${shadow.hairlineStrong}, 0 0 16px ${alpha(profile.accent, 0.22)}`
                : 'inset 0 1px 3px rgba(0,0,0,0.4)',
              '&:active': { transform: 'scale(0.95)' },
              '&:disabled': { opacity: 0.5 },
            } }
          >
            { /* Status dot — pulses gently while the side is heating. */ }
            <Box
              component="span"
              sx={ {
                width: 6,
                height: 6,
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: isOn ? profile.accent : textColor.disabled,
                boxShadow: isOn ? `0 0 8px ${alpha(profile.accent, 0.9)}` : 'none',
                transition: `background-color ${motion.base}, box-shadow ${motion.base}`,
                ...(isOn && !isUpdating && {
                  animation: 'gbedos-pulse 2.4s ease-in-out infinite',
                }),
                '@keyframes gbedos-pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.45 },
                },
              } }
            />
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
          px: 2.25,
          pb: 1.25,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          textAlign: 'left',
          transition: `background-color ${motion.fast}`,
          '&:hover': { backgroundColor: alpha(surface.hover, 0.5) },
        } }
      >
        <Box sx={ { display: 'flex', alignItems: 'baseline', gap: 1.25, minWidth: 0 } }>
          { /* Hero readout. A blurred copy sits behind the number to give it a
               real halo — a text-shadow alone gets lost against the card.
               Shifts vertically for a beat when the target changes, so an
               increase feels different from a decrease. */ }
          <Box
            sx={ {
              position: 'relative',
              flexShrink: 0,
              transition: `transform ${motion.spring}`,
              transform: nudge === 0
                ? 'translateY(0)'
                : `translateY(${nudge > 0 ? -5 : 5}px)`,
            } }
          >
            { isOn && (
              <Box
                aria-hidden
                sx={ {
                  ...type.hero,
                  position: 'absolute',
                  inset: 0,
                  color: tempColor,
                  filter: 'blur(18px)',
                  opacity: 0.5,
                  pointerEvents: 'none',
                  transition: `color ${motion.base}, opacity ${motion.base}`,
                } }
              >
                { formatTemperature(targetTemp, isCelsius) }
              </Box>
            ) }
            <Box
              sx={ {
                ...type.hero,
                position: 'relative',
                color: isOn ? tempColor : textColor.disabled,
                transition: `color ${motion.base}`,
              } }
            >
              { isOn ? formatTemperature(targetTemp, isCelsius) : '—' }
            </Box>
          </Box>

          <Box sx={ { minWidth: 0, pb: 0.5 } }>
            <Typography
              variant="overline"
              sx={ {
                display: 'block',
                color: isOn ? alpha(profile.accent, 0.92) : textColor.tertiary,
                transition: `color ${motion.base}`,
              } }
            >
              { stateLabel }
            </Typography>
            { isOn && (
              <Typography
                className="tabular"
                sx={ { ...type.labelTight, color: textColor.tertiary, whiteSpace: 'nowrap' } }
              >
                now { formatTemperature(currentTemp, isCelsius) }
              </Typography>
            ) }
          </Box>
        </Box>

        <ChevronRight
          sx={ {
            color: textColor.disabled,
            mb: 1,
            flexShrink: 0,
            transition: `transform ${motion.base}, color ${motion.base}`,
          } }
        />
      </ButtonBase>

      { /* Footer: inline ±1° control */ }
      { !isAway && (
        <Box
          sx={ {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2.25,
            pb: 2,
            pt: 0.25,
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
