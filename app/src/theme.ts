import { PaletteMode, alpha, createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import {
  accent,
  font,
  motion,
  radius,
  shadow,
  status,
  surface,
  textColor,
} from './designTokens';

const LIGHT_BORDER = '#E4E7EC';
const LIGHT_SURFACE = '#FFFFFF';
const LIGHT_BASE = '#F7F8FA';

// Tighter tracking than MUI's default, and heavier headings — the default
// letterSpacing: 0.05em across every variant was a big part of the stock look.
const typography = {
  fontFamily: font.family,
  allVariants: {
    letterSpacing: '-0.005em',
  },
  h1: { fontSize: '2.75rem', fontWeight: 620, letterSpacing: '-0.03em', lineHeight: 1.1 },
  h2: { fontSize: '2.25rem', fontWeight: 620, letterSpacing: '-0.03em', lineHeight: 1.12 },
  h3: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.18 },
  h4: { fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 },
  h5: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 },
  h6: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
  body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
  body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  button: { fontWeight: 550, letterSpacing: '0' },
  caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
  // Small uppercase labels used for section headers and profile names.
  overline: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.09em',
    lineHeight: 1.4,
    textTransform: 'uppercase' as const,
  },
} satisfies ThemeOptions['typography'];

const getBorderColor = (mode: PaletteMode) => mode === 'dark' ? surface.border : LIGHT_BORDER;

const getFilledChipStyles = (
  theme: Theme,
  paletteKey: 'success' | 'info' | 'warning' | 'secondary' | 'error'
) => {
  const paletteColor = theme.palette[paletteKey];
  const overlay = theme.palette.mode === 'light' ? 0.14 : 0.18;

  return {
    backgroundColor: alpha(paletteColor.main, overlay),
    color: theme.palette.mode === 'light'
      ? paletteColor.dark ?? paletteColor.main
      : paletteColor.light ?? paletteColor.main,
    border: 'none',
  };
};

const buildComponents = (mode: PaletteMode) => {
  const isDark = mode === 'dark';
  const borderColor = getBorderColor(mode);
  const paperBg = isDark ? surface.raised : LIGHT_SURFACE;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        // Numeric readouts shouldn't jitter as digits change.
        '.tabular': {
          fontVariantNumeric: 'tabular-nums',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.sm,
          padding: '8px 16px',
          transition: `background-color ${motion.fast}, border-color ${motion.fast}, color ${motion.fast}`,
        },
        outlined: {
          borderColor,
          '&:hover': {
            borderColor: isDark ? surface.borderStrong : '#CDD2DA',
            backgroundColor: isDark ? surface.hover : 'rgba(0,0,0,0.02)',
          },
        },
        sizeLarge: {
          padding: '12px 22px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: `background-color ${motion.fast}, color ${motion.fast}`,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? surface.base : LIGHT_BASE,
          borderRadius: radius.pill,
          padding: 3,
          gap: 2,
        },
        grouped: {
          border: 'none !important',
          borderRadius: `${radius.pill}px !important`,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 550,
          color: textColor.secondary,
          border: 'none',
          transition: `background-color ${motion.fast}, color ${motion.fast}`,
          '&.Mui-selected': {
            backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
            color: isDark ? textColor.primary : '#101828',
            '&:hover': {
              backgroundColor: isDark ? surface.hover : LIGHT_SURFACE,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 550,
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          borderRadius: 2,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          textTransform: 'none',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: paperBg,
          border: `1px solid ${borderColor}`,
          boxShadow: 'none',
          borderRadius: radius.md,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.lg,
          backgroundColor: paperBg,
          boxShadow: isDark ? shadow.card : 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
          boxShadow: shadow.raised,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
          boxShadow: shadow.raised,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          color: textColor.tertiary,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
        },
        notchedOutline: {
          borderColor,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        // 16px avoids iOS Safari zooming the viewport on focus.
        select: {
          fontSize: 16,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        input: {
          fontSize: 16,
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        input: {
          fontSize: 16,
        },
        underline: ({ theme }) => ({
          '&:before': {
            borderBottomColor: theme.palette.divider,
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: 'none',
          borderBottomColor: `${borderColor} !important`,
          boxShadow: 'none',
          backgroundColor: isDark
            ? alpha(surface.base, 0.82)
            : alpha(LIGHT_SURFACE, 0.82),
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? alpha(surface.base, 0.9)
            : alpha(LIGHT_SURFACE, 0.9),
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: textColor.tertiary,
          transition: `color ${motion.fast}`,
        },
        label: {
          fontSize: '0.6875rem',
          fontWeight: 550,
          '&.Mui-selected': {
            fontSize: '0.6875rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          fontWeight: 550,
          fontSize: '0.75rem',
        },
        colorSuccess: ({ theme }) => getFilledChipStyles(theme, 'success'),
        colorInfo: ({ theme }) => getFilledChipStyles(theme, 'info'),
        colorWarning: ({ theme }) => getFilledChipStyles(theme, 'warning'),
        colorSecondary: ({ theme }) => getFilledChipStyles(theme, 'secondary'),
        colorError: ({ theme }) => getFilledChipStyles(theme, 'error'),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          borderRadius: radius.pill,
          backgroundColor: isDark ? surface.borderStrong : '#D0D5DD',
          opacity: 1,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          border: `1px solid ${borderColor}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: radius.sm,
          backgroundColor: surface.overlay,
          border: `1px solid ${surface.border}`,
          fontSize: '0.8125rem',
          padding: '6px 10px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          height: 6,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: `${radius.md}px !important`,
          '&:before': { display: 'none' },
        },
      },
    },
  } satisfies ThemeOptions['components'];
};

const buildPalette = (mode: PaletteMode): ThemeOptions['palette'] => ({
  mode,
  primary: {
    main: accent.geo,
    light: '#A0BAF8',
    dark: '#5C7FD6',
  },
  secondary: {
    main: accent.jess,
    light: '#EFC0DA',
    dark: '#C47FA8',
  },
  success: { main: status.success, light: '#8BDCAF' },
  warning: { main: status.warning, light: '#EFCC74' },
  error: { main: status.error, light: '#EF9089' },
  info: { main: status.info, light: '#9AC4F5' },
  divider: getBorderColor(mode),
  // Several components read theme.palette.grey[*] directly (slider track,
  // secondary labels). Override the ramp so those resolve to the token
  // neutrals instead of MUI's stock greys, which clash with these surfaces.
  grey: {
    50: '#F7F8FA',
    100: '#EDEFF3',
    200: '#DDE1E7',
    300: '#C3C9D2',
    400: textColor.secondary,
    500: textColor.tertiary,
    600: '#565D69',
    700: '#3B424B',
    800: surface.borderStrong,
    900: surface.overlay,
  },
  text: mode === 'dark'
    ? {
      primary: textColor.primary,
      secondary: textColor.secondary,
      disabled: textColor.disabled,
    }
    : {
      primary: '#101828',
      secondary: '#5A6472',
      disabled: '#98A2B3',
    },
  background: mode === 'dark'
    ? {
      default: surface.base,
      paper: surface.raised,
    }
    : {
      default: LIGHT_BASE,
      paper: LIGHT_SURFACE,
    },
});

export const buildTheme = (mode: PaletteMode = 'dark') =>
  createTheme({
    typography,
    palette: buildPalette(mode),
    shape: {
      borderRadius: radius.md,
    },
    components: buildComponents(mode),
  });

export const theme = buildTheme('dark');
