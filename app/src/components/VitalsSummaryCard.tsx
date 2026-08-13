import CircularProgress from '@mui/material/CircularProgress';
import { useAppStore } from '@state/appStore.tsx';
import { useVitalsSummary } from '@api/vitals.ts';
import {
  Box,
  Card,
  Typography,
} from '@mui/material';
import { textColor, type } from '../designTokens.ts';

type BiometricsSummaryCardProps = {
  startTime: string;
  endTime: string;
};

type TileProps = {
  title: string;
  value: number;
  unit: string;
}

/**
 * One metric tile: a small caps label above a dominant value. The unit is held
 * back in both size and colour so the number reads as the content.
 */
const Tile = ({ title, value, unit }: TileProps) => (
  <Box key={ title } flex={ 1 } minWidth="30%">
    <Typography variant="caption" sx={ { display: 'block', color: textColor.tertiary, mb: 0.25 } }>
      { title }
    </Typography>
    <Box sx={ { display: 'flex', alignItems: 'baseline', gap: 0.5 } }>
      <Box sx={ { ...type.readingSm, color: textColor.primary } }>
        { value ? value : '--' }
      </Box>
      <Box sx={ { ...type.caption, color: textColor.tertiary } }>
        { unit }
      </Box>
    </Box>
  </Box>
);

// eslint-disable-next-line react/no-multi-comp
export default function VitalsSummaryCard({ startTime, endTime }: BiometricsSummaryCardProps) {
  const { side } = useAppStore();
  const { data: vitalsSummary, isFetching } = useVitalsSummary({ startTime, endTime, side });

  return (
    <Card sx={ { p: 2.5, position: 'relative', mt: 2 } }>
      <Typography variant="caption" sx={ { display: 'block', color: textColor.tertiary, mb: 2 } }>
        Health metrics
      </Typography>
      { isFetching && <CircularProgress sx={ { display: 'block', mx: 'auto', my: 2 } } /> }
      { !isFetching && vitalsSummary !== undefined && (
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={ 2 }>
          <Tile value={ vitalsSummary.avgHeartRate } title="Heart rate" unit="bpm" />
          <Tile value={ vitalsSummary.minHeartRate } title="Min HR" unit="bpm" />
          <Tile value={ vitalsSummary.maxHeartRate } title="Max HR" unit="bpm" />
          <Tile value={ vitalsSummary.avgHRV } title="HRV" unit="ms" />
          <Tile value={ vitalsSummary.avgBreathingRate } title="Breath rate" unit="/min" />
        </Box>
      ) }
    </Card>
  );
}
