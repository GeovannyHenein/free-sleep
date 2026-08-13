import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SleepRecord } from '../../../server/src/db/sleepRecordsSchema.ts';
import moment from 'moment-timezone';
import { deleteSleepRecord } from '@api/sleep.ts';
import { updateSleepRecord } from '@api/sleep.ts'; // Assuming you have this function
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { textColor, type } from '../designTokens.ts';


// Helper to format time
const formatTime = (date: string) => moment(date).local().format('h:mm A');

// Helper to calculate sleep duration
const calculateSleepDuration = (start: string, end: string) => {
  const startTime = moment(start);
  const endTime = moment(end);
  const duration = moment.duration(endTime.diff(startTime));
  return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
};

interface SleepRecordProps {
  sleepRecord?: SleepRecord;
  refetch?: () => void;
}

function formatDayLabel(dateString: string): string {
  const localTime = moment(dateString).local();
  return localTime.hour() < 6
    ? localTime.subtract(1, 'day').format('dddd')
    : localTime.format('dddd');
}

export default function SleepRecordCard({ sleepRecord, refetch }: SleepRecordProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [enteredBedAt, setEnteredBedAt] = useState(moment(sleepRecord?.entered_bed_at));
  const [leftBedAt, setLeftBedAt] = useState(moment(sleepRecord?.left_bed_at));

  useEffect(() => {
    if (!sleepRecord) return;
    setEnteredBedAt(moment(sleepRecord?.entered_bed_at));
    setLeftBedAt(moment(sleepRecord?.left_bed_at));
  }, [sleepRecord]);

  if (!sleepRecord) return null;

  const bedtime = formatTime(sleepRecord.entered_bed_at);
  const wakeTime = formatTime(sleepRecord.left_bed_at);
  const sleepDuration = calculateSleepDuration(
    sleepRecord.entered_bed_at,
    sleepRecord.left_bed_at
  );

  const startDay = formatDayLabel(sleepRecord.entered_bed_at);
  const endDay = formatDayLabel(sleepRecord.left_bed_at);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this sleep record?')) {
      try {
        await deleteSleepRecord(sleepRecord.id);
        if (refetch) refetch();
      } catch (error) {
        console.error('Error deleting sleep record:', error);
        alert('Failed to delete the sleep record.');
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateSleepRecord(sleepRecord.id, {
        entered_bed_at: enteredBedAt.toISOString(),
        left_bed_at: leftBedAt.toISOString(),
      });
      setEditOpen(false);
      if (refetch) refetch();
    } catch (error) {
      console.error('Error updating sleep record:', error);
      alert('Failed to update the sleep record.');
    }
  };

  return (
    <Card sx={ { p: 2.5, position: 'relative' } }>
      { /* Actions: Edit & Delete */ }
      { /* Secondary actions sit back until hovered; delete only takes on its
           warning colour on interaction, so the card is not permanently
           marked with a red icon. */ }
      <Box sx={ { position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.5 } }>
        <IconButton
          onClick={ () => setEditOpen(true) }
          aria-label="edit this sleep record"
          size="small"
          sx={ {
            color: textColor.tertiary,
            '&:hover': { color: textColor.primary },
          } }
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={ handleDelete }
          aria-label="delete this sleep record"
          size="small"
          sx={ {
            color: textColor.tertiary,
            '&:hover': { color: 'error.light' },
          } }
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="overline" sx={ { display: 'block', color: textColor.tertiary, mb: 1 } }>
        Sleep summary
      </Typography>

      { /* Label left, value right — the value carries the weight, the label
           recedes. Icons dropped: the labels already say what each row is. */ }
      <Box display="flex" flexDirection="column" gap={ 1.25 }>
        { [
          { label: 'Period', value: `${startDay} - ${endDay}` },
          { label: 'Bedtime', value: bedtime },
          { label: 'Wake time', value: wakeTime },
          { label: 'Duration', value: sleepDuration },
          {
            label: 'Times exited bed',
            value: `${sleepRecord.times_exited_bed} ${sleepRecord.times_exited_bed === 1 ? 'time' : 'times'}`,
          },
        ].map(({ label, value }) => (
          <Box key={ label } display="flex" justifyContent="space-between" alignItems="baseline" gap={ 2 }>
            <Typography sx={ { ...type.status, color: textColor.tertiary } }>
              { label }
            </Typography>
            <Typography
              className="tabular"
              sx={ { ...type.status, color: textColor.primary, textAlign: 'right' } }
            >
              { value }
            </Typography>
          </Box>
        )) }
      </Box>

      { /* Edit Modal */ }
      <Dialog open={ editOpen } onClose={ () => setEditOpen(false) } fullWidth>
        <DialogTitle>Edit Sleep Record</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={ 2 } mt={ 1 }>
            <DateTimePicker
              label="Entered Bed At"
              value={ enteredBedAt }
              onChange={ (newValue) => newValue && setEnteredBedAt(newValue) }
              ampm
            />
            <DateTimePicker
              label="Left Bed At"
              value={ leftBedAt }
              onChange={ (newValue) => newValue && setLeftBedAt(newValue) }
              ampm
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => setEditOpen(false) } color="secondary">
            Cancel
          </Button>
          <Button onClick={ handleSave } variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
