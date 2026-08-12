import InfoIcon from '@mui/icons-material/Info';
import { Box, CircularProgress, FormControlLabel, Typography, Switch } from '@mui/material';
import Section from '../Section.tsx';
import { Services, useServices, postServices } from '@api/services.ts';
import { useAppStore } from '@state/appStore.tsx';
import { DeepPartial } from 'ts-essentials';

export default function FeaturesSection() {
  const { data: services, refetch, isLoading } = useServices();
  const setIsUpdating = useAppStore(state => state.setIsUpdating);
  const isUpdating = useAppStore(state => state.isUpdating);

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
      <Box display='flex' gap={ 1 }>

        <InfoIcon sx={ { color: 'text.secondary' } }/>

        { /* component="div" on the outer Typography: the default <p> cannot
             legally contain the nested block below, which trips a React
             hydration error. */ }
        <Typography color='text.secondary' component='div'>
          Calculate biometrics for the pod.
          Requires you to run this command on your pod. Once installation completes successfully, you can toggle this on/off.
          <Typography color='text.secondary' component='code' sx={ { display: 'block', mt: 1, fontFamily: 'monospace' } }>
            sh /home/dac/free-sleep/scripts/enable_biometrics.sh
          </Typography>
        </Typography>

      </Box>
      <br />
      <FormControlLabel
        control={
          <Switch
            disabled={ isUpdating }
            checked={ services.sentryLogging.enabled }
            onChange={ (event) => updateServices({ sentryLogging: { enabled: event.target.checked } }) }
          />
        }
        label="Enable Sentry error reporting"
      />
      <Typography color='text.secondary'>
        Help improve stability by sending anonymous error reports to the free-sleep maintainers.
      </Typography>
    </Section>
  );
}
