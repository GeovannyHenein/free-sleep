import SearchIcon from '@mui/icons-material/Search';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { Button, Box, ButtonBase, alpha } from '@mui/material';
import { postDeviceStatus } from '@api/deviceStatus.ts';
import { DeviceStatus } from '@api/deviceStatusSchema.ts';
import { DeepPartial } from 'ts-essentials';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useSettings } from '@api/settings.ts';
import { useState } from 'react';
import { useServices } from '@api/services.ts';
import { Job, postJobs } from '@api/jobs.ts';
import AnalyzeSleepNotification from './AnalyzeSleepNotification.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import { getProfile } from '../../config/profiles.ts';
import { motion, radius, surface, textColor, type } from '../../designTokens.ts';


type PowerButtonProps = {
  isOn: boolean;
  refetch: any;
  /** Defaults to the globally selected side; pass explicitly to control a specific side. */
  side?: Side;
  /** Drops the negative top margin used to tuck the button under the slider. */
  inline?: boolean;
}

export default function PowerButton({ isOn, refetch, side: sideProp, inline = false }: PowerButtonProps) {
  const { isUpdating, setIsUpdating, side: storeSide } = useAppStore();
  const side = sideProp ?? storeSide;
  const { data: settings } = useSettings();
  const { data: services } = useServices();
  const setDeviceStatus = useControlTempStore(state => state.setDeviceStatus);
  const isInAwayMode = settings?.[side].awayMode;
  const disabled = isUpdating || isInAwayMode;
  const [showAnalyzeSleep, setShowAnalyzeSleep] = useState(false);
  const [showAnalyzeNotification, setShowAnalyzeNotification] = useState(false);

  const handleOnClick = (powerOn: boolean) => {
    const deviceStatus: DeepPartial<DeviceStatus> = {
      [side]: {
        isOn: powerOn
      }
    };
    if (powerOn) {
      setShowAnalyzeSleep(false);
    } else {
      setShowAnalyzeSleep(true);
      setTimeout(() => setShowAnalyzeSleep(false), 20_000);
    }

    setIsUpdating(true);
    setDeviceStatus(deviceStatus);
    postDeviceStatus(deviceStatus)
      .then(() => {
        // Wait 1 second before refreshing the device status
        return new Promise((resolve) => setTimeout(resolve, 1_000));
      })
      .then(() => refetch())
      .then((data) => setDeviceStatus(data.data))
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleAnalyzeSleep = () => {
    const capitalized = side.charAt(0).toUpperCase() + side.slice(1) as Job;
    setShowAnalyzeNotification(true);
    // @ts-expect-error
    postJobs([`analyzeSleep${capitalized}`])
      .catch(error => {
        console.error(error);
      });
    setTimeout(() => setShowAnalyzeNotification(false), 120_000);
  };
  if (isInAwayMode) return null;

  // Tint the control with the accent of whichever side it controls.
  const activeColor = getProfile(side).accent;

  return (
    <Box sx={ { mt: inline ? 0 : -6, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' } }>
      { /* The primary control for this side. Carries a soft accent glow while
           on, so its state is readable without reading the label. */ }
      <ButtonBase
        disabled={ disabled }
        onClick={ () => handleOnClick(!isOn) }
        aria-label={ isOn ? 'turn off' : 'turn on' }
        sx={ {
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 3.25,
          minHeight: 44,
          borderRadius: `${radius.pill}px`,
          ...type.control,
          
          backgroundColor: isOn ? alpha(activeColor, 0.16) : surface.overlay,
          color: isOn ? activeColor : textColor.secondary,
          border: `1px solid ${isOn ? alpha(activeColor, 0.4) : alpha('#FFFFFF', 0.08)}`,
          boxShadow: isOn ? `0 0 26px ${alpha(activeColor, 0.18)}` : 'none',
          transition: [
            `background ${motion.base}`,
            `color ${motion.base}`,
            `border-color ${motion.base}`,
            `box-shadow ${motion.base}`,
            `transform ${motion.press}`,
          ].join(', '),
          '&:active:not(:disabled)': {
            transform: 'scale(0.97)',
          },
          '&:disabled': { opacity: 0.4 },
        } }
      >
        <PowerSettingsNewIcon sx={ { fontSize: 18 } } />
        { isOn ? 'turn off' : 'turn on' }
      </ButtonBase>
      {
        showAnalyzeSleep && !isUpdating && services?.biometrics?.enabled && (
          <Button
            variant="contained"
            disabled={ disabled }
            onClick={ handleAnalyzeSleep }
          >
            <SearchIcon />
            Analyze sleep
          </Button>
        )
      }
      {
        showAnalyzeNotification && (
          <AnalyzeSleepNotification />
        )
      }
    </Box>
  );
}
