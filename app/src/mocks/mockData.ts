import moment from 'moment-timezone';
import type { Services } from '@api/services.ts';
import type { Schedules } from '@api/schedulesSchema.ts';
import type { Settings } from '@api/settingsSchema.ts';
import type { DeviceStatus } from '@api/deviceStatusSchema';
import type { MovementRecord } from '@api/movement.ts';
import type { SleepRecord } from '@api/sleepSchema.ts';
import type { VitalsRecord } from '@api/vitals.ts';
import type { ServerStatus } from '@api/serverStatusSchema.ts';
import type { Jobs } from '@api/jobs.ts';

type Side = 'left' | 'right';

type LogStore = Record<string, string[]>;

type QueryFilters = {
  startTime?: string;
  endTime?: string;
  side?: Side;
};

const now = new Date();
const HOURS_TO_MS = 60 * 60 * 1000;
const MINUTES_TO_MS = 60 * 1000;

const clone = <T>(value: T): T => {
  const structured = (globalThis as typeof globalThis & {
    structuredClone?: <U>(source: U) => U;
  }).structuredClone;
  if (typeof structured === 'function') {
    return structured(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const toIso = (date: Date) => date.toISOString();

const createSleepRecord = (id: number, side: Side, nightsAgo: number, durationHours: number, exits: number): SleepRecord => {
  // Anchor to a plausible bedtime the evening before, rather than "now minus N
  // days". Anchoring to now made every night start at whatever time the demo
  // happened to be opened, so charts showed a sliver of a night instead of a
  // full one. Geo turns in ~30 min earlier than Jess.
  const start = new Date(now.getTime() - nightsAgo * 24 * HOURS_TO_MS);
  start.setHours(side === 'left' ? 22 : 22, side === 'left' ? 15 : 45, 0, 0);
  const end = new Date(start.getTime() + durationHours * HOURS_TO_MS);
  const presentInterval: [string, string] = [toIso(start), toIso(end)];
  const absenceStart = new Date(start.getTime() + (durationHours / 2) * HOURS_TO_MS);
  const absenceEnd = new Date(absenceStart.getTime() + 10 * MINUTES_TO_MS);
  const notPresentInterval: [string, string] = [toIso(absenceStart), toIso(absenceEnd)];

  return {
    id,
    side,
    entered_bed_at: presentInterval[0],
    left_bed_at: presentInterval[1],
    sleep_period_seconds: Math.round(durationHours * 60 * 60),
    times_exited_bed: exits,
    present_intervals: [presentInterval],
    not_present_intervals: exits > 0 ? [notPresentInterval] : [],
  };
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Deterministic pseudo-noise. Math.random() would make the demo flicker on
// every reload and makes screenshots non-reproducible. Two summed sine terms
// at unrelated frequencies give slow wander rather than per-sample hash noise,
// which would read as a staircase once values are rounded to integers.
const jitter = (seed: number, amplitude: number) =>
  (Math.sin(seed * 0.7) * 0.6 + Math.sin(seed * 0.23 + 1.7) * 0.4) * amplitude;

/**
 * Movement across one night, sampled every 30 minutes.
 *
 * Restless while settling, near-still through deep sleep in the first half,
 * then increasing turns toward morning as sleep lightens.
 */
const createMovementForSleepRecord = (record: SleepRecord, startId: number): MovementRecord[] => {
  const side = record.side as Side;
  const startMs = new Date(record.entered_bed_at).getTime();
  const endMs = new Date(record.left_bed_at).getTime();
  const intervalMs = 30 * MINUTES_TO_MS;

  const keyframes = [
    { f: 0.0, v: 900 }, // settling in
    { f: 0.12, v: 180 }, // drops off quickly
    { f: 0.45, v: 90 }, // deep sleep, minimal movement
    { f: 0.75, v: 420 }, // lighter sleep, more turning
    { f: 1.0, v: 1100 }, // waking
  ];

  const interp = (f: number) => {
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i], b = keyframes[i + 1];
      if (f <= b.f) {
        return lerp(a.v, b.v, (f - a.f) / (b.f - a.f));
      }
    }
    return keyframes[keyframes.length - 1].v;
  };

  // Jess turns a little more than Geo; keeps the two traces distinguishable.
  const scale = side === 'left' ? 1 : 1.25;

  const records: MovementRecord[] = [];
  let id = startId;
  for (let ms = startMs; ms <= endMs; ms += intervalMs) {
    const frac = (ms - startMs) / (endMs - startMs);
    const seed = ms / intervalMs;
    const value = Math.round(
      clamp(interp(frac) * scale + jitter(seed + 31, 120), 1, 1400)
    );

    records.push({
      id: id++,
      side,
      // @ts-expect-error - MovementRecord types timestamp as a number, but the
      // API serves an ISO string and the chart parses it as one.
      timestamp: moment(ms).format(),
      total_movement: value,
    });
  }
  return records;
};

/**
 * Per-side physiological baselines. Two people share a bed, so their traces
 * should be visibly distinct rather than the same curve twice.
 *
 * Left (Geo) runs a lower resting heart rate with higher HRV; right (Jess)
 * runs a little faster with slightly lower HRV and a quicker breath rate.
 */
const VITALS_PROFILE: Record<Side, {
  hrAsleep: number;
  hrDip: number;
  hrvBase: number;
  hrvSwing: number;
  breathBase: number;
}> = {
  left: { hrAsleep: 54, hrDip: 6, hrvBase: 68, hrvSwing: 22, breathBase: 12.5 },
  right: { hrAsleep: 61, hrDip: 5, hrvBase: 55, hrvSwing: 18, breathBase: 14.5 },
};

/**
 * Builds a night of vitals for one sleep record.
 *
 * Models the shape of a real night rather than a sawtooth: heart rate falls
 * through the first hour as the person settles, bottoms out in deep sleep
 * around the middle, and rises towards waking. HRV moves inversely to heart
 * rate. Roughly 90-minute sleep cycles ride on top, and REM periods (which
 * cluster later in the night) briefly push heart and breath rate up.
 */
const createVitalsForSleepRecord = (record: SleepRecord): VitalsRecord[] => {
  const side = record.side as Side;
  const profile = VITALS_PROFILE[side];
  const startMs = new Date(record.entered_bed_at).getTime();
  const endMs = new Date(record.left_bed_at).getTime();
  const intervalMs = 5 * MINUTES_TO_MS;
  const records: VitalsRecord[] = [];

  for (let ms = startMs; ms <= endMs; ms += intervalMs) {
    const progress = (ms - startMs) / (endMs - startMs); // 0 → 1 across the night
    const seed = ms / intervalMs;

    // Settle over the first ~15% of the night, then a slow rise toward waking.
    const settle = Math.min(1, progress / 0.15);
    const wakeRise = Math.max(0, (progress - 0.75) / 0.25);

    // ~90 minute ultradian cycles.
    const cycles = Math.sin(progress * Math.PI * 2 * ((endMs - startMs) / (90 * 60 * 1000)));

    // REM density increases through the night; brief arousals lift HR and breath.
    const remPush = Math.max(0, cycles) * progress * 3.5;

    const heartRate =
      profile.hrAsleep
      + (1 - settle) * profile.hrDip * 1.6 // higher while still settling
      - settle * profile.hrDip * 0.5 // deep-sleep dip
      + wakeRise * 4
      + remPush
      + cycles * 1.2
      + jitter(seed, 1.6);

    // HRV rises as heart rate falls.
    const hrv =
      profile.hrvBase
      + settle * profile.hrvSwing * 0.6
      - wakeRise * profile.hrvSwing * 0.5
      - remPush * 1.8
      - cycles * 4
      + jitter(seed + 7, 6);

    // Breath rate is stored as an integer over a narrow range, so a tight
    // spread would quantise into a two-value square wave. Widen the swing so
    // the rounded series still reads as a curve.
    const breathingRate =
      profile.breathBase
      - settle * 2.4
      + wakeRise * 2.2
      + remPush * 0.8
      + cycles * 1.1
      + jitter(seed + 13, 1.5);

    records.push({
      side,
      timestamp: Math.floor(ms / 1000),
      // Clamped to the ranges vitalsRecordSchema enforces.
      heart_rate: Math.round(clamp(heartRate, 30, 90)),
      hrv: Math.round(clamp(hrv, 0, 200)),
      breathing_rate: Math.round(clamp(breathingRate, 5, 30)),
    });
  }

  return records;
};

const createSchedules = (): Schedules => ({
  left: {
    sunday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:30', off: '07:30', enabled: true, onTemperature: 60 },
      alarm: { time: '07:30', vibrationIntensity: 2, vibrationPattern: 'rise', duration: 10, enabled: true, alarmTemperature: 82 },
    },
    monday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:30', off: '07:00', enabled: true, onTemperature: 60 },
      alarm: { time: '07:00', vibrationIntensity: 3, vibrationPattern: 'double', duration: 10, enabled: true, alarmTemperature: 83 },
    },
    tuesday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:30', off: '07:00', enabled: true, onTemperature: 60 },
      alarm: { time: '07:00', vibrationIntensity: 2, vibrationPattern: 'rise', duration: 8, enabled: true, alarmTemperature: 82 },
    },
    wednesday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:30', off: '07:00', enabled: true, onTemperature: 60 },
      alarm: { time: '07:00', vibrationIntensity: 1, vibrationPattern: 'rise', duration: 8, enabled: true, alarmTemperature: 82 },
    },
    thursday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:30', off: '07:00', enabled: true, onTemperature: 60 },
      alarm: { time: '07:00', vibrationIntensity: 2, vibrationPattern: 'rise', duration: 8, enabled: true, alarmTemperature: 81 },
    },
    friday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '22:00', off: '08:00', enabled: true, onTemperature: 60 },
      alarm: { time: '08:00', vibrationIntensity: 3, vibrationPattern: 'rise', duration: 12, enabled: true, alarmTemperature: 84 },
    },
    saturday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '22:30', off: '09:00', enabled: true, onTemperature: 60 },
      alarm: { time: '09:00', vibrationIntensity: 1, vibrationPattern: 'rise', duration: 12, enabled: true, alarmTemperature: 85 },
    },
  },
  right: {
    sunday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:00', off: '07:00', enabled: true, onTemperature: 60 },
      alarm: { time: '07:00', vibrationIntensity: 2, vibrationPattern: 'rise', duration: 10, enabled: true, alarmTemperature: 84 },
    },
    monday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:00', off: '08:30', enabled: true, onTemperature: 60 },
      alarm: { time: '06:30', vibrationIntensity: 3, vibrationPattern: 'double', duration: 10, enabled: true, alarmTemperature: 84 },
    },
    tuesday: {
      temperatures: { '06:00': 82, '07:00': 100 },
      power: { on: '21:15', off: '06:30', enabled: true, onTemperature: 60 },
      alarm: { time: '06:30', vibrationIntensity: 3, vibrationPattern: 'double', duration: 8, enabled: true, alarmTemperature: 83 },
    },
    wednesday: {
      temperatures: { '05:00': 82, '6:00': 100 },
      power: { on: '21:15', off: '06:30', enabled: true, onTemperature: 60 },
      alarm: { time: '06:30', vibrationIntensity: 2, vibrationPattern: 'double', duration: 8, enabled: true, alarmTemperature: 83 },
    },
    thursday: {
      temperatures: { '05:00': 82, '6:00': 100 },
      power: { on: '21:15', off: '06:30', enabled: true, onTemperature: 60 },
      alarm: { time: '06:30', vibrationIntensity: 2, vibrationPattern: 'double', duration: 8, enabled: true, alarmTemperature: 83 },
    },
    friday: {
      temperatures: { '05:00': 82, '6:00': 100 },
      power: { on: '22:00', off: '07:30', enabled: true, onTemperature: 60 },
      alarm: { time: '07:30', vibrationIntensity: 3, vibrationPattern: 'rise', duration: 12, enabled: true, alarmTemperature: 85 },
    },
    saturday: {
      temperatures: { '05:00': 82, '6:00': 100 },
      power: { on: '22:30', off: '08:30', enabled: true, onTemperature: 60 },
      alarm: { time: '08:30', vibrationIntensity: 2, vibrationPattern: 'rise', duration: 12, enabled: true, alarmTemperature: 86 },
    },
  },
});

const createSettings = (): Settings => ({
  id: 'demo-user',
  timeZone: 'America/Los_Angeles',
  temperatureFormat: 'fahrenheit',
  rebootDaily: true,
  left: {
    name: 'Geo',
    awayMode: false,
    scheduleOverrides: {
      temperatureSchedules: { disabled: false, expiresAt: '' },
      alarm: { disabled: false, timeOverride: '', expiresAt: '' },
    },
    taps: {
      doubleTap: {
        type: 'temperature',
        change: 'decrement',
        amount: 1,
      },
      tripleTap: {
        type: 'temperature',
        change: 'increment',
        amount: 1,
      },
      quadTap: {
        type: 'alarm',
        behavior: 'dismiss',
        snoozeDuration: 60,
        inactiveAlarmBehavior: 'power',
      },
    }
  },
  right: {
    name: 'Jess',
    awayMode: false,
    scheduleOverrides: {
      temperatureSchedules: { disabled: false, expiresAt: '' },
      alarm: { disabled: false, timeOverride: '', expiresAt: '' },
    },
    taps: {
      doubleTap: {
        type: 'temperature',
        change: 'decrement',
        amount: 1,
      },
      tripleTap: {
        type: 'temperature',
        change: 'increment',
        amount: 1,
      },
      quadTap: {
        type: 'alarm',
        behavior: 'dismiss',
        snoozeDuration: 60,
        inactiveAlarmBehavior: 'power',
      },
    }
  },
  primePodDaily: { enabled: true, time: '14:30' },
});

const createServices = (): Services => ({
  sentryLogging: {
    enabled: true,
  },
  biometrics: {
    enabled: true,
    jobs: {
      installation: {
        name: 'Biometrics installation',
        description: 'Initial biometric sensor installation',
        status: 'healthy',
        message: 'Installation completed successfully',
        timestamp: now.toISOString(),
      },
      stream: {
        name: 'Biometrics stream',
        description: 'Sensor data ingestion service',
        status: 'healthy',
        message: 'Streaming data smoothly',
        timestamp: new Date(now.getTime() - 2 * MINUTES_TO_MS).toISOString(),
      },
      analyzeSleepLeft: {
        name: 'Analyze sleep - left',
        description: 'Analyzes sleep data for left side',
        status: 'healthy',
        message: 'Last run completed 15 minutes ago',
        timestamp: new Date(now.getTime() - 15 * MINUTES_TO_MS).toISOString(),
      },
      analyzeSleepRight: {
        name: 'Analyze sleep - right',
        description: 'Analyzes sleep data for right side',
        status: 'healthy',
        message: 'Next run scheduled soon',
        timestamp: new Date(now.getTime() - 12 * MINUTES_TO_MS).toISOString(),
      },
      calibrateLeft: {
        name: 'Calibration job - Left',
        description: 'Sensor calibration for left side',
        status: 'healthy',
        message: 'Calibrated this morning',
        timestamp: new Date(now.getTime() - 3 * HOURS_TO_MS).toISOString(),
      },
      calibrateRight: {
        name: 'Calibration job - Right',
        description: 'Sensor calibration for right side',
        status: 'healthy',
        message: 'Calibrated this morning',
        timestamp: new Date(now.getTime() - 3 * HOURS_TO_MS).toISOString(),
      },
    },
  },
});

const createDeviceStatus = (): DeviceStatus => ({
  left: {
    currentTemperatureLevel: 4,
    currentTemperatureF: 82,
    targetTemperatureF: 84,
    secondsRemaining: 1_200,
    isOn: true,
    isAlarmVibrating: false,
  },
  right: {
    currentTemperatureLevel: 5,
    currentTemperatureF: 85,
    targetTemperatureF: 86,
    secondsRemaining: 1_560,
    isOn: true,
    isAlarmVibrating: false,
  },
  waterLevel: 'true',
  isPriming: true,
  settings: {
    v: 12,
    gainLeft: 3,
    gainRight: 4,
    ledBrightness: 60,
  },
  coverVersion: 'Pod 5',
  hubVersion: 'Pod 5',
  freeSleep: {
    version: '1.2.0',
    branch: 'main',
  },
  wifiStrength: 82,
});

const createServerStatus = (): ServerStatus => ({
  alarmSchedule: {
    name: 'Alarm schedule',
    status: 'healthy',
    description: 'Alarm scheduling service',
    message: 'Next alarm ready',
  },
  database: {
    name: 'Database',
    status: 'healthy',
    description: 'SQLite database connection',
    message: '',
  },
  express: {
    name: 'Express',
    status: 'healthy',
    description: 'HTTP server',
    message: 'Running in demo mode',
  },
  franken: {
    name: 'Franken sock',
    status: 'healthy',
    description: 'Hardware socket interface',
    message: '',
  },
  frankenMonitor: {
    name: 'Franken monitor',
    status: 'not_started',
    description: 'Handles gestures and monitoring the status',
    message: '',
  },
  jobs: {
    name: 'Job scheduler',
    status: 'healthy',
    description: 'Background job execution',
    message: 'All jobs executed successfully overnight',
  },
  logger: {
    name: 'Logger',
    status: 'healthy',
    description: 'Application logs',
    message: '',
  },
  powerSchedule: {
    name: 'Power schedule',
    status: 'healthy',
    description: 'Controls power on/off cycles',
    message: 'Bed powered on for bedtime routine',
  },
  primeSchedule: {
    name: 'Prime schedule',
    status: 'healthy',
    description: 'Daily prime job',
    message: 'Next prime scheduled for 14:30',
  },
  rebootSchedule: {
    name: 'Reboot schedule',
    status: 'healthy',
    description: 'Daily system reboot',
    message: 'Reboot completed successfully last night',
  },
  systemDate: {
    name: 'System date',
    status: 'healthy',
    description: 'System clock status',
    message: '',
  },
  temperatureSchedule: {
    name: 'Temperature schedule',
    status: 'healthy',
    description: 'Temperature automation',
    message: '',
  },
  analyzeSleepLeft: {
    name: 'Analyze sleep - left',
    status: 'healthy',
    description: 'Sleep analytics for left side',
    message: 'Last analysis completed successfully',
  },
  analyzeSleepRight: {
    name: 'Analyze sleep - right',
    status: 'healthy',
    description: 'Sleep analytics for right side',
    message: 'Last analysis completed successfully',
  },
  biometricsInstallation: {
    name: 'Biometrics installation',
    status: 'healthy',
    description: 'Installation status',
    message: '',
  },
  biometricsStream: {
    name: 'Biometrics stream',
    status: 'healthy',
    description: 'Biometrics data stream',
    message: '',
    timestamp: new Date(now.getTime() - 2 * MINUTES_TO_MS).toISOString(),
  },
  biometricsCalibrationLeft: {
    name: 'Calibration job - Left',
    status: 'healthy',
    description: 'Left side calibration',
    message: '',
  },
  biometricsCalibrationRight: {
    name: 'Calibration job - Right',
    status: 'healthy',
    description: 'Right side calibration',
    message: '',
  },
});

const createLogs = (): LogStore => ({
  'free-sleep.log': [
    `[${new Date(now.getTime() - 3 * MINUTES_TO_MS).toISOString()}] INFO Starting GBedOS demo mode`,
    `[${new Date(now.getTime() - 2 * MINUTES_TO_MS).toISOString()}] INFO Schedules loaded successfully`,
    `[${new Date(now.getTime() - 90 * 1000).toISOString()}] INFO Biometrics stream connected`,
    `[${new Date(now.getTime() - 30 * 1000).toISOString()}] INFO Demo data refreshed`,
  ],
  'scheduler.log': [
    `[${new Date(now.getTime() - 6 * MINUTES_TO_MS).toISOString()}] INFO Prime job executed`,
    `[${new Date(now.getTime() - 4 * MINUTES_TO_MS).toISOString()}] INFO Temperature schedule updated`,
    `[${new Date(now.getTime() - 60 * 1000).toISOString()}] INFO Nightly reboot completed`,
  ],
});

let sleepRecords = [
  createSleepRecord(5, 'left', 3, 7.1, 0),
  createSleepRecord(6, 'right', 3, 7.0, 0),


  createSleepRecord(3, 'left', 2, 7.8, 1),
  createSleepRecord(4, 'right', 2, 7.4, 2),

  createSleepRecord(1, 'left', 1, 7.5, 1),
  createSleepRecord(2, 'right', 1, 7.2, 0),
];

// Both derived from the sleep records so every sample falls inside a real sleep
// window — the Sleep page queries vitals and movement by the selected record's
// entered_bed_at/left_bed_at range, so anything outside it renders as no data.
const vitalsRecords = sleepRecords.flatMap(createVitalsForSleepRecord);
const movementRecords = sleepRecords.flatMap((record, index) =>
  createMovementForSleepRecord(record, index * 100 + 1)
);
let schedules = createSchedules();
let settings = createSettings();
let services = createServices();
let deviceStatus = createDeviceStatus();
let serverStatus = createServerStatus();
let logsStore = createLogs();

export const mergeDeep = (target: unknown, source: unknown): unknown => {
  if (source === undefined || source === null) {
    return target;
  }
  if (Array.isArray(source)) {
    return Array.isArray(target) ? source.slice() : source.slice();
  }
  if (typeof source === 'object') {
    const targetObj = typeof target === 'object' && target !== null ? target as Record<string, unknown> : {};
    const sourceObj = source as Record<string, unknown>;
    const result: Record<string, unknown> = { ...targetObj };
    Object.entries(sourceObj).forEach(([key, value]) => {
      result[key] = mergeDeep(result[key], value);
    });
    return result;
  }
  return source;
};

export const getServices = () => services;
export const updateServices = (partial: Partial<Services>) => {
  services = mergeDeep(clone(services), partial) as Services;
  return services;
};

export const getSchedules = () => schedules;
export const updateSchedules = (partial: Partial<Schedules>) => {
  schedules = mergeDeep(clone(schedules), partial) as Schedules;
  return schedules;
};

export const getSettings = () => settings;
export const updateSettings = (partial: Partial<Settings>) => {
  const partialCopy = { ...partial };
  // Never allow overwriting the generated ID in demo mode
  delete (partialCopy as { id?: string }).id;
  settings = mergeDeep(clone(settings), partialCopy) as Settings;
  return settings;
};

export const getDeviceStatus = () => deviceStatus;
export const updateDeviceStatus = (partial: Partial<DeviceStatus>) => {
  deviceStatus = mergeDeep(clone(deviceStatus), partial) as DeviceStatus;
  return deviceStatus;
};

export const getServerStatus = () => serverStatus;
export const setServerStatus = (next: ServerStatus) => {
  serverStatus = clone(next);
  return serverStatus;
};

export const listSleepRecords = () => sleepRecords;
export const setSleepRecords = (records: SleepRecord[]) => {
  sleepRecords = records;
  return sleepRecords;
};

export const listMovementRecords = () => movementRecords;


export const listVitalsRecords = () => vitalsRecords;


export const listLogs = () => logsStore;
export const setLogs = (next: LogStore) => {
  logsStore = next;
  return logsStore;
};

export const getLogFiles = () => Object.keys(logsStore);

export const appendLogEntry = (file: string, message: string) => {
  if (!logsStore[file]) {
    logsStore[file] = [];
  }
  logsStore[file].push(message);
  if (logsStore[file].length > 1000) {
    logsStore[file] = logsStore[file].slice(-1000);
  }
};

export const filterByQuery = <T extends { side?: Side }>(records: T[], filters: QueryFilters, getTimestamp: (record: T) => number) => {
  const start = filters.startTime ? Date.parse(filters.startTime) : undefined;
  const end = filters.endTime ? Date.parse(filters.endTime) : undefined;
  const side = filters.side;

  return records.filter((record) => {
    if (side && record.side !== side) {
      return false;
    }
    const timestamp = getTimestamp(record);
    if (Number.isFinite(start) && start !== undefined && timestamp < start) {
      return false;
    }
    if (Number.isFinite(end) && end !== undefined && timestamp > end) {
      return false;
    }
    return true;
  });
};

export const handleJobs = (jobs: Jobs) => {
  const timestamp = new Date().toISOString();
  jobs.forEach((job) => {
    appendLogEntry('free-sleep.log', `[${timestamp}] INFO Job executed: ${job}`);
  });
};

