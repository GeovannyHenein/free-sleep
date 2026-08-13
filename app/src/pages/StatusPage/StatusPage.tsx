import moment from 'moment-timezone';
import { useServerStatus } from '@api/serverStatus.ts';
import {
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';

import PageContainer from '../PageContainer.tsx';
import StatusCard from './StatusCard.tsx';
import { ServerStatusKey, StatusInfo } from '@api/serverStatusSchema.ts';
import { textColor, type } from '../../designTokens.ts';

export default function StatusPage() {
  const { data, isLoading, dataUpdatedAt } = useServerStatus(5_000);
  const updatedAt = moment(dataUpdatedAt);
  return (
    <PageContainer
      sx={ {
        width: '100%',
        maxWidth: { xs: '100%', sm: '800px' },
        mx: 'auto',
        mb: 15,
      } }
    >
      { /* Left-aligned to match every other page; the centred heading was the
           last of the stock layout here. */ }
      <Stack spacing={ 0.25 } sx={ { width: '100%', px: 0.5, mb: 1 } }>
        <Typography variant="h4">
          Services
        </Typography>
        { /* dataUpdatedAt is 0 until the first fetch resolves, and moment(0)
             formats as a believable time rather than an obvious epoch. Only
             show a timestamp once one actually exists. */ }
        <Typography
          className="tabular"
          sx={ { ...type.caption, color: textColor.tertiary } }
        >
          { dataUpdatedAt ? `checked ${updatedAt.format('h:mm a')}` : 'checking…' }
        </Typography>
      </Stack>
      { isLoading && <CircularProgress /> }

      {
        data && (
          <Grid container spacing={ 2.5 } sx={ { mt: 1 } }>
            {
              // @ts-expect-error
              Object.keys(data).map((job: ServerStatusKey) => (
                <StatusCard
                  key={ job }
                  job={ job }
                  statusInfo={ data[job] as StatusInfo }
                />
              ))
            }
          </Grid>
        )

      }

    </PageContainer>
  );
}
