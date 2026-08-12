import Alert from '@mui/material/Alert';
import { useDeviceStatus } from '@api/deviceStatus.ts';



export default function WaterNotification() {
  const { data: deviceStatus } = useDeviceStatus();

  if (deviceStatus?.waterLevel === 'false') {
    return (
      <Alert severity="warning">
        Water tank is low or empty, refill the water tank
      </Alert>
    );
  }
  if (![undefined, 'true'].includes(deviceStatus?.waterLevel)) {
    return (
      <Alert severity="warning">
        { `Unhandled deviceStatus.waterLevel: '${deviceStatus?.waterLevel}'` }
      </Alert>
    );
  }
  return null;

}

