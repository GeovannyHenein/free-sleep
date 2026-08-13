import _ from 'lodash';
import { useEffect } from 'react';
import { Box } from '@mui/material';
import { DeepPartial } from 'ts-essentials';
import moment from 'moment-timezone';

import AlarmAccordion from './AlarmSection/AlarmAccordion.tsx';
import ApplyToOtherDaysAccordion from './ApplyToOtherDaysAccordion.tsx';
import DayTabs from './DayTabs.tsx';
import EnabledSwitch from './EnabledSwitch.tsx';
import PageContainer from '../PageContainer.tsx';
import SaveButton from './SaveButton.tsx';
import ScheduleContextBar from './ScheduleContextBar.tsx';
import PowerScheduleSection from './PowerScheduleSection.tsx';
import TemperatureAdjustmentsAccordion from './TemperatureAdjustmentsAccordion.tsx';
import { DayOfWeek, Schedules } from '@api/schedulesSchema.ts';
import { postSchedules } from '@api/schedules';
import { useAppStore } from '@state/appStore.tsx';
import { useSchedules } from '@api/schedules';
import { useScheduleStore } from './scheduleStore.tsx';
import { useSettings } from '@api/settings';
import { LOWERCASE_DAYS } from './days.ts';
import TemperatureScheduleChart from './ScheduleChart.tsx';
import ErrorBoundary from '@components/ErrorBoundary.tsx';
import { surface } from '../../designTokens.ts';


const getAdjustedDayOfWeek = (): DayOfWeek => {
  // Get the current moment in the specified timezone
  const now = moment();
  // Extract the hour of the day in 24-hour format
  const currentHour = now.hour();

  // Determine if it's before noon (12:00 PM)
  if (currentHour < 12) {
    return now.subtract(1, 'day').format('dddd').toLocaleLowerCase() as DayOfWeek;
  } else {
    return now.format('dddd').toLocaleLowerCase() as DayOfWeek;
  }
};


export default function SchedulePage() {
  const { setIsUpdating, side } = useAppStore();
  const { data: schedules, refetch } = useSchedules();
  const {
    selectedSchedule,
    setOriginalSchedules,
    selectedDays,
    selectedDay,
    reloadScheduleData,
    selectDay
  } = useScheduleStore();
  const { data: settings } = useSettings();
  const displayCelsius = settings?.temperatureFormat === 'celsius';
  // TODO: Add changes lost notification using changesPresent when user tries to switch tab before saving

  useEffect(() => {
    const day = getAdjustedDayOfWeek();
    selectDay(LOWERCASE_DAYS.indexOf(day));
  }, []);

  useEffect(() => {
    if (!schedules) return;
    setOriginalSchedules(schedules);
    const day = getAdjustedDayOfWeek();
    selectDay(LOWERCASE_DAYS.indexOf(day));
    reloadScheduleData();
  }, [schedules]);

  useEffect(() => {
    reloadScheduleData();
  }, [side]);

  const handleSave = async () => {
    setIsUpdating(true);

    const daysList: DayOfWeek[] = _.uniq(_.keys(_.pickBy(selectedDays, value => value))) as DayOfWeek[];
    daysList.push(selectedDay);
    const payload: DeepPartial<Schedules> = { [side]: {}, };
    daysList.forEach(day => {
      // @ts-expect-error
      payload[side][day] = selectedSchedule;
    });

    await postSchedules(payload)
      .then(() => {
        // Wait 1 second before refreshing the schedules
        return new Promise((resolve) => setTimeout(resolve, 1_000));
      })
      .then(() => refetch())
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <PageContainer
      sx={ {
        width: '100%',
        maxWidth: { xs: '100%', sm: '800px' },
        mx: 'auto',
        // Padding, not margin: this page can grow tall when the accordions are
        // expanded, and a bottom margin left the last "apply to other days"
        // checkboxes below the scrollable area and unreachable.
        pb: 'calc(120px + env(safe-area-inset-bottom, 0px))',
      } }
    >
      { /* Person and day travel together and stay pinned: without this, both
           dimensions of "what am I editing" scroll away before the alarm and
           temperature sections. */ }
      <Box
        sx={ {
          position: 'sticky',
          top: 48,
          zIndex: 5,
          width: '100%',
          pb: 1,
          backgroundColor: surface.base,
        } }
      >
        <ScheduleContextBar/>
        <DayTabs/>
      </Box>
      <ErrorBoundary componentName='Scheduling chart'>
        <TemperatureScheduleChart />
      </ErrorBoundary>

      { /* The master switch heads the group it governs, rather than floating
           beside the save button. */ }
      <Box sx={ { width: '100%', mt: 1 } }>
        <EnabledSwitch/>
      </Box>
      <PowerScheduleSection displayCelsius={ displayCelsius }/>
      <Box sx={ { display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 } }>
        <SaveButton onSave={ handleSave }/>
      </Box>
      <TemperatureAdjustmentsAccordion displayCelsius={ displayCelsius }/>
      <AlarmAccordion/>
      <ApplyToOtherDaysAccordion/>

    </PageContainer>
  );
}
