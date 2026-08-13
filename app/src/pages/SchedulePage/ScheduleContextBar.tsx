import { Box, ButtonBase, Typography, alpha } from '@mui/material';

import { useAppStore, type Side } from '@state/appStore.tsx';
import { useSettings } from '@api/settings.ts';
import { getProfile, getProfileName } from '../../config/profiles.ts';
import { motion, radius, surface, textColor, type } from '../../designTokens.ts';

const SIDES: Side[] = ['left', 'right'];

/**
 * Sticky header naming whose schedule is on screen.
 *
 * The person was previously a toggle at the top of the page that scrolled
 * away, so by the time you reached the alarm or temperature accordions there
 * was nothing on screen saying who you were editing — easy to change the wrong
 * person's wake-up time. This pins that context to the top and carries the
 * accent, so identity is readable without reading.
 */
export default function ScheduleContextBar() {
  const { side, setSide } = useAppStore();
  const { data: settings } = useSettings();

  return (
    <Box
      sx={ {
        width: '100%',
        py: 1,
      } }
    >
      <Box
        sx={ {
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: `${radius.pill}px`,
          backgroundColor: surface.raised,
        } }
      >
        { SIDES.map(s => {
          const profile = getProfile(s);
          const name = getProfileName(s, settings?.[s]?.name);
          const isActive = s === side;

          return (
            <ButtonBase
              key={ s }
              onClick={ () => setSide(s) }
              aria-label={ `edit ${name}'s schedule` }
              aria-pressed={ isActive }
              sx={ {
                ...type.control,
                flex: 1,
                minHeight: 44,
                gap: 1,
                borderRadius: `${radius.pill}px`,
                color: isActive ? profile.accent : textColor.tertiary,
                backgroundColor: isActive ? alpha(profile.accent, 0.14) : 'transparent',
                transition: `background-color ${motion.base}, color ${motion.base}`,
              } }
            >
              { /* A dot in the accent, so the active person is identifiable
                   from colour alone at a glance. */ }
              <Box
                aria-hidden
                sx={ {
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isActive ? profile.accent : textColor.disabled,
                  transition: `background-color ${motion.base}`,
                } }
              />
              <Typography component="span" sx={ { ...type.control, color: 'inherit' } }>
                { name }
              </Typography>
            </ButtonBase>
          );
        }) }
      </Box>
    </Box>
  );
}
