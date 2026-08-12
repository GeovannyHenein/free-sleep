import { Alert, AlertTitle, Chip, Typography } from '@mui/material';
import { useServerInfo } from '@api/serverInfo.ts';
import currentServerInfo from '../../../server/src/serverInfo.json';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateFreeSleepButton from '../pages/SettingsPage/DeviceSettingsSection/UpdateFreeSleepButton.tsx';
import { APP_NAME } from '../config/branding.ts';


export default function VersionStatus() {
  const { data: serverInfo, isLoading, isError } = useServerInfo();
  if (isError || isLoading) return null;

  return (
    <>
      {
        serverInfo?.updateAvailable && (
          <>
            <Alert severity="info">
              <AlertTitle>
                { APP_NAME } update available!
              </AlertTitle>
              <Typography variant="body2">
                Latest version: { serverInfo.version }
              </Typography>
              <Typography variant="body2" sx={ { mb: 1 } }>
                Current version: { currentServerInfo.version }
              </Typography>
              <UpdateFreeSleepButton/>
            </Alert>
          </>
        )
      }
      {
        !serverInfo?.updateAvailable && (
          <Chip
            icon={ <CheckCircleIcon/> }
            label="Up to date"
            color="success"
            variant="filled"
            size="small"
            sx={ {
              minWidth: '112px',
              width: 'fit-content',
              '.MuiChip-label': {
                overflow: 'visible',
              },
            } }
          />
        )
      }
    </>
  );
}
