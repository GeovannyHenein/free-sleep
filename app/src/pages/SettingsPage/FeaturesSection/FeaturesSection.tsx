import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
  alpha,
} from '@mui/material';
import Section from '../Section.tsx';
import { Services, useServices, postServices } from '@api/services.ts';
import { useAppStore } from '@state/appStore.tsx';
import { DeepPartial } from 'ts-essentials';
import { useState } from 'react';
import { radius, surface, textColor, type } from '../../../designTokens.ts';

export default function FeaturesSection() {
  const { data: services, refetch, isLoading } = useServices();
  const setIsUpdating = useAppStore(state => state.setIsUpdating);
  const isUpdating = useAppStore(state => state.isUpdating);
  const [showCommand, setShowCommand] = useState(false);

  const updateServices = (services: DeepPartial<Services>) => {
    setIsUpdating(true);

    postServices(services)
      .then(() => refetch())
      .catch(error => {
        console.error(error);
      })
      .finally(() => setIsUpdating(false));
  };

  if (isLoading || !services) return <CircularProgress />;

  return (
    <Section title='Features'>
      <FormControlLabel
        control={
          <Switch
            disabled={ isUpdating || services?.biometrics.jobs.installation.status !== 'healthy' }
            checked={ services.biometrics.enabled }
            onChange={ (event) => updateServices({ biometrics: { enabled: event.target.checked } }) }
          />
        }
        label="Biometrics"
      />
      <Typography sx={ { ...type.caption, color: textColor.tertiary, mt: 0.5 } }>
        Calculates heart rate, HRV and breathing from the cover&apos;s sensors.
        Needs a one-time install on the pod before it can be switched on.
      </Typography>

      { /* The install command is a raw shell line — useful once, ugly always.
           Kept behind a disclosure so it is available without sitting on the
           page as unexplained monospace text. */ }
      <Box sx={ { mt: 1 } }>
        <ButtonBase
          onClick={ () => setShowCommand(v => !v) }
          aria-expanded={ showCommand }
          sx={ {
            ...type.caption,
            color: textColor.secondary,
            borderRadius: `${radius.sm}px`,
            minHeight: 44,
            px: 1,
            ml: -1,
            '&:hover': { color: textColor.primary },
          } }
        >
          { showCommand ? 'hide install command' : 'show install command' }
        </ButtonBase>
        <Collapse in={ showCommand }>
          <Box
            component="code"
            sx={ {
              display: 'block',
              mt: 1,
              p: 1.5,
              borderRadius: `${radius.sm}px`,
              backgroundColor: alpha('#000000', 0.3),
              border: `1px solid ${surface.border}`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.75rem',
              color: textColor.secondary,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            } }
          >
            sh /home/dac/free-sleep/scripts/enable_biometrics.sh
          </Box>
        </Collapse>
      </Box>

      <Divider sx={ { my: 2.5 } } />

      <FormControlLabel
        control={
          <Switch
            disabled={ isUpdating }
            checked={ services.sentryLogging.enabled }
            onChange={ (event) => updateServices({ sentryLogging: { enabled: event.target.checked } }) }
          />
        }
        label="Error reporting"
      />
      <Typography sx={ { ...type.caption, color: textColor.tertiary } }>
        Sends anonymous crash reports to help track down bugs.
      </Typography>
    </Section>
  );
}
