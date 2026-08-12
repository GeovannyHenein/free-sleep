import { accent } from '../designTokens';
import type { Side } from '@state/appStore.tsx';

/**
 * Per-side profile identity.
 *
 * Display names are NOT stored here — they come from `settings[side].name` so
 * the "Side Name" field in Settings stays authoritative. This holds only what
 * the server schema has nowhere to put: accent color and avatar initial.
 * (SideSettingsSchema is .strict(), so adding fields there means a server
 * change.) Keeping it in the repo rather than localStorage means both phones
 * show the same colors.
 */
export type Profile = {
  accent: string;
  accentSoft: string;
  initial: string;
  fallbackName: string;
};

export const PROFILES: Record<Side, Profile> = {
  left: {
    accent: accent.geo,
    accentSoft: accent.geoSoft,
    initial: 'G',
    fallbackName: 'Geo',
  },
  right: {
    accent: accent.jess,
    accentSoft: accent.jessSoft,
    initial: 'J',
    fallbackName: 'Jess',
  },
};

export const getProfile = (side: Side): Profile => PROFILES[side];

/** Server name wins; falls back to the local default when settings haven't loaded. */
export const getProfileName = (side: Side, serverName?: string): string => {
  const trimmed = serverName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : PROFILES[side].fallbackName;
};
