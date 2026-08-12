import Alert from '@mui/material/Alert';
import { Settings } from '@api/settingsSchema.ts';
import { getProfileName } from '../../config/profiles.ts';

type AwayNotificationProps = {
  settings?: Settings;
}

/**
 * Away-mode banner. Both sides are visible on the home screen now, so this
 * names whoever is away rather than saying "this side" / "other side".
 */
export default function AwayNotification({ settings }: AwayNotificationProps) {
  if (!settings) return null;

  const leftAway = settings.left?.awayMode ?? false;
  const rightAway = settings.right?.awayMode ?? false;

  if (!leftAway && !rightAway) return null;

  if (leftAway && rightAway) {
    return (
      <Alert severity="info">
        Both sides are in away mode — temperature settings apply to the whole bed.
      </Alert>
    );
  }

  const awaySide = leftAway ? 'left' : 'right';
  const awayName = getProfileName(awaySide, settings[awaySide]?.name);

  return (
    <Alert severity="info">
      { awayName }&apos;s side is in away mode — temperature settings apply to the whole bed.
    </Alert>
  );
}
