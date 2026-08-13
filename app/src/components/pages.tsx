import React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';

type Page = {
  title: string;
  route: string;
  icon: React.ReactElement;
};

export const PAGES: Page[] = [
  // A single glyph per destination. This was previously a bed and a
  // thermostat inside one span, which wrapped onto two lines at 375px.
  { title: 'Temperature', route: '/temperature', icon: <ThermostatIcon/> },
  { title: 'Schedules', route: '/schedules', icon: <ScheduleIcon/> },
  { title: 'Data', route: '/data', icon: <BarChartIcon/> },
  { title: 'Status', route: '/status', icon: <BugReportIcon/> },
  { title: 'Settings', route: '/settings', icon: <SettingsIcon/> },
];
