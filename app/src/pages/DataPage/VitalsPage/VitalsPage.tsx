import { useState } from 'react';
import moment from 'moment-timezone';
import { Alert, Box, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useTheme } from '@mui/material/styles';
import { useResizeDetector } from 'react-resize-detector';

import Header from '../Header.tsx';
import PageContainer from '../../PageContainer.tsx';
import ErrorBoundary from '@components/ErrorBoundary.tsx';
import VitalsLineChart from '@components/VitalsLineChart.tsx';
import VitalsSummaryCard from '@components/VitalsSummaryCard.tsx';
import { useVitalsRecords } from '@api/vitals.ts';
import { useAppStore } from '@state/appStore.tsx';
import { useSettings } from '@api/settings.ts';
import { getProfileName } from '../../../config/profiles.ts';

/**
 * Vitals for a single night, for whichever side is selected.
 *
 * The Sleep page shows vitals nested under a chosen sleep record; this page is
 * the standalone view of the same metrics, navigable night by night.
 */
export default function VitalsPage() {
  const { width = 300, ref } = useResizeDetector();
  const { side } = useAppStore();
  const { data: settings } = useSettings();
  const theme = useTheme();

  // A "night" runs from the evening of the selected day into the next morning,
  // so the window has to straddle midnight rather than align to a calendar day.
  const [nightsAgo, setNightsAgo] = useState(1);
  const startTime = moment().subtract(nightsAgo, 'days').startOf('day').add(18, 'hours');
  const endTime = startTime.clone().add(1, 'day').startOf('day').add(14, 'hours');

  const { data: vitalsRecords } = useVitalsRecords({
    side,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });

  const name = getProfileName(side, settings?.[side]?.name);
  const hasData = (vitalsRecords?.length ?? 0) > 0;
  const isNextDisabled = nightsAgo <= 1;

  return (
    <ErrorBoundary componentName="Vitals page">
      <PageContainer containerProps={ { ref } } sx={ { mb: 15, gap: 1, mt: 0 } }>
        <Header title="Vitals" icon={ <FavoriteIcon /> }/>

        <Box
          sx={ {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '80%',
            color: theme.palette.grey[500],
          } }
        >
          <NavigateBeforeIcon
            onClick={ () => setNightsAgo(n => n + 1) }
            sx={ { cursor: 'pointer' } }
          />
          <Typography>
            { name } &middot; { startTime.format('ddd, MMM D') }
          </Typography>
          <Box sx={ { width: 24, display: 'flex', justifyContent: 'center' } }>
            { !isNextDisabled && (
              <NavigateNextIcon
                onClick={ () => setNightsAgo(n => Math.max(1, n - 1)) }
                sx={ { cursor: 'pointer' } }
              />
            ) }
          </Box>
        </Box>

        <Box sx={ { width } }>
          { !hasData ? (
            <Alert severity="info" sx={ { mt: 2 } }>
              No vitals recorded for { name } on this night.
            </Alert>
          ) : (
            <>
              <VitalsSummaryCard
                startTime={ startTime.toISOString() }
                endTime={ endTime.toISOString() }
              />
              <ErrorBoundary componentName="Heart rate chart">
                <VitalsLineChart vitalsRecords={ vitalsRecords } metric="heart_rate"/>
              </ErrorBoundary>
              <ErrorBoundary componentName="HRV chart">
                <VitalsLineChart vitalsRecords={ vitalsRecords } metric="hrv"/>
              </ErrorBoundary>
              <ErrorBoundary componentName="Breathing rate chart">
                <VitalsLineChart vitalsRecords={ vitalsRecords } metric="breathing_rate"/>
              </ErrorBoundary>
            </>
          ) }
        </Box>
      </PageContainer>
    </ErrorBoundary>
  );
}
