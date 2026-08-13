import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { Box, Typography } from '@mui/material';

import AlarmDismissal from './AlarmDismissal.tsx';
import AlarmNotification from './AlarmNotification.tsx';
import AwayNotification from './AwayNotification.tsx';
import ErrorBoundary from '@components/ErrorBoundary.tsx';
import PageContainer from '../PageContainer.tsx';
import PrimingNotification from './PrimingNotification.tsx';
import SideCard from './SideCard.tsx';
import SideDifferential from './SideDifferential.tsx';
import SideDetailDialog from './SideDetailDialog.tsx';
import WaterNotification from './WaterNotification.tsx';
import { useAppStore, type Side } from '@state/appStore.tsx';
import { useControlTempStore } from './controlTempStore.tsx';
import { useDeviceStatus } from '@api/deviceStatus';
import { useSettings } from '@api/settings.ts';
import { textColor } from '../../designTokens.ts';

export default function ControlTempPage() {
  const { isError, refetch, data: deviceStatus } = useDeviceStatus();
  const setDeviceStatus = useControlTempStore(state => state.setDeviceStatus);
  const { data: settings } = useSettings();
  const { isUpdating } = useAppStore();
  const [expandedSide, setExpandedSide] = useState<Side | null>(null);

  useEffect(() => {
    if (!deviceStatus) return;
    setDeviceStatus(deviceStatus);
  }, [deviceStatus]);

  if (isError) {
    return (
      <PageContainer sx={ { maxWidth: '560px' } }>
        <Typography sx={ { color: textColor.secondary, mb: 2 } }>
          Can&apos;t reach the pod.
        </Typography>
        <Button variant="contained" onClick={ () => refetch() } disabled={ isUpdating }>
          Try again
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      sx={ {
        maxWidth: '560px',
        justifyContent: 'flex-start',
        gap: 1.5,
      } }
    >
      { /* Both sides always visible: stacked on phones, side by side on wide
           screens. On phones the differential sits in the gap between them. */ }
      <Box
        sx={ {
          display: 'grid',
          gap: 1.25,
          width: '100%',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        } }
      >
        <ErrorBoundary componentName="Side card left">
          <SideCard side="left" refetch={ refetch } onExpand={ setExpandedSide } />
        </ErrorBoundary>

        <Box sx={ { display: { xs: 'block', md: 'none' } } }>
          <SideDifferential />
        </Box>

        <ErrorBoundary componentName="Side card right">
          <SideCard side="right" refetch={ refetch } onExpand={ setExpandedSide } />
        </ErrorBoundary>
      </Box>

      <Box sx={ { display: 'flex', flexDirection: 'column', gap: 1, width: '100%' } }>
        { deviceStatus?.isPriming && <PrimingNotification/> }
        <ErrorBoundary componentName='Alarm notification'>
          <AlarmNotification/>
        </ErrorBoundary>
        <AwayNotification settings={ settings }/>
        <WaterNotification/>
      </Box>

      <AlarmDismissal refetch={ refetch }/>

      <SideDetailDialog
        side={ expandedSide }
        onClose={ () => setExpandedSide(null) }
        refetch={ refetch }
      />
    </PageContainer>
  );
}
