import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import moment from 'moment-timezone';
import { ServerStatusKey, StatusInfo } from '@api/serverStatusSchema.ts';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import StatusChip from './StatusChip.tsx';
import { postJobs, JobSchema, Jobs } from '@api/jobs.ts';
import { useState } from 'react';


type StatusCardProps = {
  statusInfo: StatusInfo;
  job: ServerStatusKey,
}
export default function StatusCard({ job, statusInfo }: StatusCardProps) {
  const timestamp = statusInfo.timestamp && moment(statusInfo.timestamp).format('YYYY-MM-DD HH:mm:ss z');
  let isRunnable = false;
  // @ts-expect-error
  if (JobSchema.options.includes(job)) {
    isRunnable = true;
  }
  // `message` carries informational text for healthy services too (e.g.
  // "All jobs executed successfully overnight"), so only style it as an error
  // when the status actually says something is wrong.
  const isFaulted = statusInfo.status === 'failed';
  const [disabled, setDisabled] = useState(false);
  const startJob = () => {
    setDisabled(true);
    postJobs([job] as Jobs)
      .catch(error => {
        console.error(error);
      });
    setTimeout(() => setDisabled(false), 30_000);
  };

  return (
    <Grid item xs={ 12 } sm={ 6 } md={ 4 }>
      <Card
        variant="outlined"
        sx={ {
          height: '100%',
          '& .MuiCardHeader-root': { pb: 0, pt: 2, px: 2.25 },
          '& .MuiCardContent-root': { pt: 1, px: 2.25, pb: 2, '&:last-child': { pb: 2 } },
        } }
      >
        <CardHeader
          title={
            <Stack direction="row" spacing={ 1.25 } alignItems="center">
              <Typography variant="h6">
                { statusInfo.name }
              </Typography>
              <StatusChip info={ statusInfo }/>
            </Stack>
          }
        />
        <CardContent>
          {
            timestamp && (
              <Typography
                variant="body2"
                sx={ {
                  color: (t) => t.palette.text.secondary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: 24,
                } }
              >
                { timestamp }
              </Typography>
            )
          }
          <Typography
            variant="body2"
            sx={ {
              color: (t) => t.palette.text.secondary,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: 24,
            } }
          >
            { statusInfo.description }
          </Typography>

          {
            statusInfo.message && (
              <Typography
                variant="body2"
                color={ isFaulted ? 'error' : 'text.secondary' }
                sx={ {
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: 24,
                } }
              >
                { isFaulted ? `Error: ${statusInfo.message}` : statusInfo.message }
              </Typography>
            )
          }
          {
            isRunnable && (
              <Box
                sx={ {
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end',
                  mt: 'auto',
                  height: '100%',
                  width: '100%',
                } }
              >
                <Button onClick={ startJob } variant="contained" size="small" disabled={ disabled || statusInfo.status === 'started' }>
                  Run
                  <PlayArrowIcon/>
                </Button>
              </Box>
            )
          }
        </CardContent>
      </Card>
    </Grid>
  );
}
