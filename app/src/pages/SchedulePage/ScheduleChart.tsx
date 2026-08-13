/* eslint-disable react/no-multi-comp */
import { useMemo } from 'react';
import { Paper } from '@mui/material';
import { LineChart, lineElementClasses, areaElementClasses } from '@mui/x-charts/LineChart';
import { useDrawingArea } from '@mui/x-charts/hooks';

import { useScheduleStore } from './scheduleStore.tsx';
import { DailySchedule, Time } from '../../../../server/src/db/schedulesSchema.ts';
import { useSettings } from '@api/settings.ts';
import { useAppStore } from '@state/appStore.tsx';
import { getProfile } from '../../config/profiles.ts';
import { mixHex, surface, textColor, thermal } from '../../designTokens.ts';
import {
  farenheitToCelcius,
  MAX_TEMP_C,
  MAX_TEMP_F,
  MIN_TEMP_C,
  MIN_TEMP_F
} from '@lib/temperatureConversions.ts';


type Point = { x: Date; y: number };

const AREA_ALPHA = 0.35;
const LINE_ALPHA = 1.0;

// ---------------- buildSeriesData (same as before) ----------------
const todayAt = (hhmm: Time, dayOffset = 0) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (dayOffset) d.setDate(d.getDate() + dayOffset);
  return d;
};


const compareTime = (a: Time, b: Time) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah - bh || am - bm;
};

function buildSeriesData(selectedSchedule: DailySchedule, yMin: number, yMax: number, isCelsius: boolean): Point[] {
  if (!selectedSchedule?.power.enabled) return [];

  const { power, temperatures } = selectedSchedule;
  const wraps = compareTime(power.off, power.on) <= 0;

  const start = todayAt(power.on, 0);
  const end = todayAt(power.off, wraps ? 1 : 0);

  const entries = Object.entries(temperatures) as [Time, number][];
  const day0: [Date, number][] = [];
  const day1: [Date, number][] = [];

  for (const [t, temp] of entries.sort((a, b) => compareTime(a[0], b[0]))) {
    if (!wraps) {
      if (compareTime(t, power.on) >= 0 && compareTime(t, power.off) <= 0)
        day0.push([todayAt(t, 0), temp]);
    } else {
      if (compareTime(t, power.on) >= 0) day0.push([todayAt(t, 0), temp]);
      if (compareTime(t, power.off) <= 0) day1.push([todayAt(t, 1), temp]);
    }
  }

  const points: Point[] = [{
    x: start,
    y: isCelsius ? farenheitToCelcius(power.onTemperature) : power.onTemperature
  }];
  const pushStep = (arr: [Date, number][]) => {
    for (const [dt, temp] of arr) {
      const convertedTemp = isCelsius ? farenheitToCelcius(temp) : temp;

      if (dt.getTime() > points[points.length - 1].x.getTime()) {
        points.push({ x: dt, y: convertedTemp });
      } else {
        points[points.length - 1].y = convertedTemp;
      }
    }
  };
  pushStep(day0);
  pushStep(day1);

  const lastY = points[points.length - 1].y;
  if (end.getTime() > points[points.length - 1].x.getTime()) {
    points.push({
      x: end,
      y: lastY
    }
    );
  }

  for (const p of points) p.y = Math.min(yMax, Math.max(yMin, Math.round(p.y)));

  return points;
}

/**
 * Vertical thermal gradient across the plot's temperature range.
 *
 * The previous version ran the gradient left-to-right and flipped between two
 * colours at a threshold, so identical temperatures could be drawn in
 * different colours depending on where they fell in the night. Mapping colour
 * to the y axis instead means a given temperature always looks the same, and
 * the ramp matches the thermal scale used everywhere else in the app.
 *
 * The area fill additionally fades toward the baseline so the shape reads as
 * depth under the line rather than a solid block of colour.
 */
function VerticalTempGradient({
  idArea,
  idLine,
  yMin,
  yMax,
  accentColor,
}: {
  idArea: string;
  idLine: string;
  yMin: number;
  yMax: number;
  accentColor: string;
}) {
  const { top, height } = useDrawingArea();

  // Thermal stops, expressed in °F and normalised into the visible y range.
  // Offset 0 is the top of the plot (hottest), 1 the bottom (coolest).
  const stopsF: Array<{ at: number; color: string }> = [
    { at: MAX_TEMP_F, color: thermal.hot },
    { at: 95, color: thermal.warm },
    { at: 82, color: thermal.neutral },
    { at: 70, color: thermal.cool },
    { at: MIN_TEMP_F, color: thermal.cold },
  ];

  // Stops are authored in °F, but the axis may be in °C. Convert each stop
  // into the axis's own units before normalising, otherwise the ramp lands in
  // the wrong place whenever the user switches to Celsius.
  const isCelsiusAxis = yMax < MAX_TEMP_F;
  const toOffset = (tempF: number) => {
    const value = isCelsiusAxis ? farenheitToCelcius(tempF) : tempF;
    const normalised = (value - yMin) / (yMax - yMin);
    return Math.max(0, Math.min(1, 1 - normalised));
  };

  return (
    <defs>
      { /* Line: full-strength thermal ramp, tinted toward the person whose
           schedule is shown so the chart reads as theirs. */ }
      <linearGradient
        id={ idLine }
        x1={ 0 }
        x2={ 0 }
        y1={ top }
        y2={ top + height }
        gradientUnits="userSpaceOnUse"
      >
        { stopsF.map((s, i) => (
          <stop
            key={ `l-${i}` }
            offset={ toOffset(s.at) }
            stopColor={ mixHex(s.color, accentColor, 0.25) }
            stopOpacity={ LINE_ALPHA }
          />
        )) }
      </linearGradient>

      { /* Area: same ramp, low alpha, fading out toward the baseline. */ }
      <linearGradient
        id={ idArea }
        x1={ 0 }
        x2={ 0 }
        y1={ top }
        y2={ top + height }
        gradientUnits="userSpaceOnUse"
      >
        { stopsF.map((s, i) => {
          const off = toOffset(s.at);
          return (
            <stop
              key={ `a-${i}` }
              offset={ off }
              stopColor={ mixHex(s.color, accentColor, 0.25) }
              // Fade with depth so the fill thins toward the bottom.
              stopOpacity={ AREA_ALPHA * (1 - off * 0.72) }
            />
          );
        }) }
      </linearGradient>
    </defs>
  );
}

// ---------------- Component ----------------
export default function TemperatureScheduleChart() {
  const { selectedSchedule } = useScheduleStore();
  const { data: settings } = useSettings();
  const { side } = useAppStore();

  // Warm end of the ramp is tinted with whoever's schedule is on screen, so the
  // chart reads as belonging to that person; the cool end stays on the shared
  // thermal blue so temperature still maps to color consistently.
  const profileAccent = getProfile(side).accent;

  const isCelsius = settings?.temperatureFormat === 'celsius';
  const yMin = isCelsius ? MIN_TEMP_C : MIN_TEMP_F;
  const yMax = isCelsius ? MAX_TEMP_C : MAX_TEMP_F;

  const points = useMemo(() => {
    if (!selectedSchedule) return [];
    return buildSeriesData(selectedSchedule, yMin, yMax, isCelsius);
  },
  [selectedSchedule, yMin, yMax, isCelsius],
  );

  if (!points.length) return null;
  const xData = points.map(p => p.x);
  const yData = points.map(p => p.y);
  const gradAreaId = 'temp-y-grad-area';
  const gradLineId = 'temp-y-grad-line';
  // Axis furniture sits well back — the line is the content, the scale is
  // annotation. Ticks and the axis rule are dropped entirely.
  const axisColor = textColor.tertiary;

  return (
    <Paper
      sx={ {
        width: '100%',
        height: 260,
        p: 2,
        pl: 0.5,
        backgroundColor: surface.raised,
        border: `1px solid ${surface.border}`,
      } }
    >
      <LineChart
        xAxis={ [{
          scaleType: 'time',
          data: xData,
          valueFormatter: (v) =>
            new Date(v as number)
              .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              .toLowerCase()
              .replace(' ', ''),
          min: xData[0],
          max: xData[xData.length - 1],
          tickMinStep: 60 * 60 * 1000,
          tickNumber: 4,
          disableLine: true,
          disableTicks: true,
          tickLabelStyle: { fill: axisColor, fontSize: 11 },
        }] }
        yAxis={ [{
          min: yMin,
          max: yMax,
          disableLine: true,
          disableTicks: true,
          tickNumber: 4,
          tickLabelStyle: { fill: axisColor, fontSize: 11 },
          // Values on this axis are already in the display unit — buildSeriesData
          // and yMin/yMax convert up front. Running them through a converting
          // formatter again rendered a 20°C tick as "-6.5°".
          valueFormatter: (value: number) => `${Math.round(value)}°`,
        }] }
        series={ [{
          id: 'targetTemp',
          label: isCelsius ? 'target °c' : 'target °f',
          data: yData,
          area: true,
          showMark: false,
          // A schedule holds each setpoint until the next one, so stepped is
          // the honest shape — a smoothed curve would imply a gradual drift
          // between setpoints that the pod does not actually perform.
          curve: 'stepAfter',
        }] }
        margin={ { right: 8, left: 44, top: 12, bottom: 24 } }
        sx={ {
          [`& .${lineElementClasses.root}`]: {
            stroke: `url(#${gradLineId})`,
            strokeWidth: 2,
          },
          [`& .${areaElementClasses.root}`]: {
            fill: `url(#${gradAreaId})`,
            filter: 'none',
          },
          '& .MuiChartsGrid-line': {
            stroke: surface.border,
            strokeDasharray: '2 4',
          },
        } }
        grid={ { horizontal: true } }
        slotProps={ { legend: { hidden: true } } }
      >
        <VerticalTempGradient
          idArea={ gradAreaId }
          idLine={ gradLineId }
          yMin={ yMin }
          yMax={ yMax }
          accentColor={ profileAccent }
        />
      </LineChart>
    </Paper>
  );
}
