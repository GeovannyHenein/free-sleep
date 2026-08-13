import Switch from '@mui/material/Switch';
import { Box, TextField, Typography } from '@mui/material';
import { DeepPartial } from 'ts-essentials';
import { useEffect, useState } from 'react';

import { Settings } from '@api/settingsSchema.ts';
import { Side, useAppStore } from '@state/appStore.tsx';
import { accent, textColor, type } from '../../designTokens.ts';

type AwayModeSwitchProps = {
  side: Side;
  settings?: Settings;
  updateSettings: (settings: DeepPartial<Settings>) => void;
}

export default function SideSettings({ side, settings, updateSettings }: AwayModeSwitchProps) {
  const { isUpdating } = useAppStore();
  const title = side.charAt(0).toUpperCase() + side.slice(1);

  // Local state to manage the text field value
  const [sideName, setSideName] = useState(settings?.[side]?.name || '');
  // Update local state when settings change (e.g., from API)
  useEffect(() => {
    setSideName(settings?.[side]?.name || side);
  }, [settings, side]);

  const handleBlur = () => {
    if (sideName.trim().length === 0) return;
    if (sideName.trim() !== settings?.[side]?.name) {
      updateSettings({ [side]: { name: sideName.trim() } });
    }
  };

  const accentColor = side === 'left' ? accent.geo : accent.jess;

  return (
    <Box sx={ { display: 'flex', flexDirection: 'column', gap: 1.5 } }>
      <Box sx={ { display: 'flex', alignItems: 'center', gap: 1 } }>
        { /* A small mark in the side's accent, matching the ember on the home
             screen, so the two settings blocks are told apart at a glance. */ }
        <Box
          aria-hidden
          sx={ { width: 3, height: 14, borderRadius: 2, backgroundColor: accentColor } }
        />
        <Typography sx={ { ...type.name, color: textColor.primary } }>
          { title } side
        </Typography>
      </Box>

      <TextField
        label="Name"
        value={ sideName }
        onChange={ (e) => setSideName(e.target.value) }
        onBlur={ handleBlur }
        disabled={ isUpdating }
        inputProps={ { maxLength: 20 } }
        fullWidth
      />

      <Box sx={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
        <Typography sx={ { ...type.status, color: textColor.secondary } }>
          Away mode
        </Typography>
        <Switch
          disabled={ isUpdating }
          checked={ settings?.[side]?.awayMode || false }
          onChange={ (event) => updateSettings({ [side]: { awayMode: event.target.checked } }) }
          slotProps={ { input: { 'aria-label': `away mode for the ${side} side` } } }
        />
      </Box>
    </Box>
  );
}
