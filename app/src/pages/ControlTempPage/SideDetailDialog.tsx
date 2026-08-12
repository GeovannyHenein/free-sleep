import { Box, Dialog, IconButton, Typography, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import PowerButton from './PowerButton.tsx';
import Slider from './Slider.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import { useSettings } from '@api/settings.ts';
import type { Side } from '@state/appStore.tsx';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import { radius, surface, textColor } from '../../designTokens.ts';

type SideDetailDialogProps = {
  /** The side to control, or null when closed. */
  side: Side | null;
  onClose: () => void;
  refetch: any;
};

/**
 * Full circular-slider control for a single side, opened by tapping a SideCard.
 * Keeps the detailed control available without forcing it onto the home screen,
 * where two of them wouldn't fit a phone.
 */
export default function SideDetailDialog({ side, onClose, refetch }: SideDetailDialogProps) {
  const { deviceStatus } = useControlTempStore();
  const { data: settings } = useSettings();

  const open = side !== null;
  const profile = side ? getProfile(side) : null;
  const name = side ? getProfileName(side, settings?.[side]?.name) : '';
  const sideStatus = side ? deviceStatus?.[side] : undefined;
  const isOn = sideStatus?.isOn ?? false;

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
            backgroundImage: profile
              ? `linear-gradient(170deg, ${alpha(profile.accent, 0.09)} 0%, transparent 45%)`
              : 'none',
            borderRadius: `${radius.lg}px`,
            m: 2,
          },
        },
      } }
    >
      { side && (
        <Box sx={ { display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2.5, pt: 2 } }>
          <Box sx={ { display: 'flex', alignItems: 'center', width: '100%', mb: 1 } }>
            <Box
              sx={ {
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                backgroundColor: profile!.accentSoft,
                border: `1px solid ${alpha(profile!.accent, 0.35)}`,
                color: profile!.accent,
                fontWeight: 600,
                fontSize: '0.8125rem',
                mr: 1.25,
              } }
            >
              { profile!.initial }
            </Box>
            <Typography variant="h6" sx={ { flexGrow: 1 } }>{ name }</Typography>
            <IconButton onClick={ onClose } size="small" aria-label="Close" sx={ { color: textColor.tertiary } }>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Slider
            side={ side }
            isOn={ isOn }
            currentTargetTemp={ sideStatus?.targetTemperatureF ?? 55 }
            currentTemperatureF={ sideStatus?.currentTemperatureF ?? 55 }
            refetch={ refetch }
            displayCelsius={ settings?.temperatureFormat === 'celsius' || false }
          />

          { /* PowerButton tints itself from the side's profile accent. */ }
          <PowerButton side={ side } isOn={ isOn } refetch={ refetch } inline />
        </Box>
      ) }
    </Dialog>
  );
}
