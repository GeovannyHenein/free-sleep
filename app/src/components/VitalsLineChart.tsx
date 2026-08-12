/* eslint-disable react/no-multi-comp */
import { useMemo } from 'react';
import Alert, { AlertProps } from '@mui/material/Alert';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { LineChart } from '@mui/x-charts/LineChart';
import { Card, Typography } from '@mui/material';
import moment from 'moment-timezone';
import { useAppStore } from '@state/appStore.tsx';
import { getProfile } from '../config/profiles.ts';
import { textColor } from '../designTokens.ts';
import { VitalsRecord } from '@api/vitals.ts';
import { useResizeDetector } from 'react-resize-detector';

type Metric = 'heart_rate' | 'hrv' | 'breathing_rate';
type VitalsLineChartProps = {
  vitalsRecords?: VitalsRecord[];
  metric: Metric;
};


function downsampleData<T>(data: readonly T[], factor: number): T[] {
  if (!Number.isFinite(factor) || factor <= 1) return [...data];
  return data.filter((_, i) => i % factor === 0);
}
type BannerProps = {
  metric: Metric;
  label: string;
}

type BannerMapping = {
  icon: React.ReactElement;
  severity: AlertProps['severity'];
  text: string | React.ReactElement;
}
type BannerMap = Record<Metric, BannerMapping>;

const Banner = ({ metric }: BannerProps) => {
  const bannerMap: BannerMap = {
    heart_rate: {
      icon: <InfoIcon color='info'/>,
      severity: 'info',
      text: <Typography>Heart rate data has been validated with six participants, and accuracy may be limited.</Typography>,
    },
    breathing_rate: {
      icon: <WarningIcon color='warning'/>,
      severity: 'warning',
      text: 'Breath rate accuracy has not been verified.',
    },
    hrv: {
      icon: <WarningIcon color='warning'/>,
      severity: 'warning',
      text: 'HRV accuracy has not been verified.',
    }
  };
  return (
    <Alert icon={ bannerMap[metric].icon } severity={ bannerMap[metric].severity }>
      { bannerMap[metric].text }
    </Alert>
  );
};

/**
 * vitalsRecordSchema stores `timestamp` as epoch *seconds*, but `new Date()`
 * expects milliseconds — passing seconds straight in put every point within a
 * few seconds of the epoch, so the time axis rendered the same label on every
 * tick. Multiply, unless the value is already large enough to be milliseconds.
 */
const toDate = (timestamp: number) =>
  new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);

export default function VitalsLineChart({ vitalsRecords, metric }: VitalsLineChartProps) {
  const { width = 300, ref } = useResizeDetector();
  const { side } = useAppStore();

  const cleanedVitalsRecords = useMemo(() => {
    if (!vitalsRecords) return [];
    const pxPerPoint = 3;
    const allowedPoints = width / pxPerPoint;
    const downsampleTo = Math.ceil(vitalsRecords?.length / allowedPoints);
    return downsampleData(vitalsRecords, downsampleTo)
      .filter(
        (record) =>
          record.timestamp &&
          !isNaN(toDate(record.timestamp).getTime()) &&
          !isNaN(record[metric])
      )
      .map((record) => ({
        ...record,
        timestamp: toDate(record.timestamp),
        [metric]: Number(record[metric]),
      }));
  }, [vitalsRecords, width, metric]);

  if (!vitalsRecords) return;

  // Vitals are per-side, so tint the series with whoever's data is shown.
  const accent = getProfile(side).accent;
  const vitalsMap = {
    heart_rate: {
      label: 'Heart rate',
      color: accent,
    },
    breathing_rate: {
      label: 'Breathing rate',
      color: accent,
    },
    hrv: {
      label: 'HRV',
      color: accent,
    }
  };
  const { label, color } = vitalsMap[metric];


  return (
    <Card sx={ { pt: 1, mt: 2, pl: 2, pr: 2, pb: 2 } }>
      <Typography variant="overline" sx={ { display: 'block', color: textColor.tertiary, mb: 1 } }>
        { label }
      </Typography>
      <LineChart
        ref={ ref }
        height={ 300 }
        colors={ [color] }
        dataset={ cleanedVitalsRecords }
        xAxis={ [
          {
            id: 'Years',
            dataKey: 'timestamp',
            scaleType: 'time',
            valueFormatter: (periodStart) =>
              moment(periodStart).format('HH:mm'),
          },
        ] }
        legend={ { hidden: true } }
        series={ [
          {
            id: label,
            label: label,
            dataKey: metric,
            valueFormatter: (metric) => (metric !== null && !isNaN(metric) ? metric.toFixed(0) : 'Invalid'),
            showMark: false,
          },
        ] }
      />
      <Banner metric={ metric } label={ vitalsMap[metric].label } />

    </Card>
  );
}
