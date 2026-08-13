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
  type,
} from './designTokens';

const LIGHT_BORDER = '#E4DFDA';
const LIGHT_SURFACE = '#FFFFFF';
const LIGHT_BASE = '#FAF7F4';

/**
 * Typography.
 *
 * Sentence case everywhere — the previous scale used wide-tracked uppercase
 * labels, which read as instrument annotation. Wrong register for something
 * used half-asleep in the dark; lowercase is quieter and parses faster.
 */
const typography = {
  fontFamily: font.family,
  allVariants: {
    letterSpacing: '0',
  },
  h1: { ...type.reading },
  h2: { ...type.readingSm },
  h3: { fontSize: '1.375rem', fontWeight: 550, letterSpacing: '-0.015em', lineHeight: 1.25 },
  h4: { fontSize: '1.125rem', fontWeight: 550, letterSpacing: '-0.01em', lineHeight: 1.3 },
  h5: { fontSize: '1rem', fontWeight: 550, lineHeight: 1.35 },
  h6: { ...type.name },
  body1: { fontSize: '0.9375rem', fontWeight: 450, lineHeight: 1.55 },
  body2: { ...type.status },
  button: { ...type.control, textTransform: 'none' as const },
  caption: { ...type.caption },
  // Kept sentence case deliberately — see note above.
  overline: { ...type.section, textTransform: 'none' as const },
} satisfies ThemeOptions['typography'];

const getBorderColor = (mode: PaletteMode) => mode === 'dark' ? surface.border : LIGHT_BORDER;

const getFilledChipStyles = (
  theme: Theme,
  paletteKey: 'success' | 'info' | 'warning' | 'secondary' | 'error'
) => {
  const paletteColor = theme.palette[paletteKey];
  return {
    backgroundColor: alpha(paletteColor.main, theme.palette.mode === 'light' ? 0.14 : 0.16),
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
          backgroundColor: isDark ? surface.base : LIGHT_BASE,
        },
        '.tabular': { fontVariantNumeric: 'tabular-nums' },
        // Nothing should animate for anyone who has asked it not to.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.pill,
          // 44px min height satisfies the touch-target floor.
          minHeight: 44,
          padding: '11px 20px',
          transition: `background-color ${motion.fast}, color ${motion.fast}, transform ${motion.press}`,
          '&:active:not(:disabled)': { transform: 'scale(0.97)' },
          '&.Mui-disabled': { opacity: 0.35 },
        },
        outlined: {
          borderColor: isDark ? surface.borderStrong : borderColor,
          '&:hover': {
            borderColor: isDark ? textColor.tertiary : '#CDC5BE',
            backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : 'rgba(0,0,0,0.02)',
          },
        },
        contained: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.16),
          color: theme.palette.primary.light,
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.24) },
        }),
        text: {
          '&:hover': { backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : 'rgba(0,0,0,0.03)' },
        },
      },
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          // Icon buttons must still clear 44px even when the glyph is small.
          minWidth: 44,
          minHeight: 44,
          borderRadius: radius.pill,
          color: textColor.secondary,
          transition: `background-color ${motion.fast}, color ${motion.fast}, transform ${motion.press}`,
          '&:active': { transform: 'scale(0.94)' },
        },
      },
    },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiCheckbox: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        // Default is 42px, 2px under the touch-target floor.
        root: { padding: 10, minWidth: 44, minHeight: 44 },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? alpha('#000000', 0.24) : LIGHT_BASE,
          borderRadius: radius.pill,
          padding: 4,
          gap: 2,
        },
        grouped: {
          border: 'none !important',
          borderRadius: `${radius.pill}px !important`,
        },
      },
    },
    MuiToggleButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          ...type.control,
          minHeight: 44,
          padding: '11px 18px',
          color: textColor.tertiary,
          border: 'none',
          transition: `background-color ${motion.base}, color ${motion.base}`,
          '&:hover': { backgroundColor: 'transparent', color: textColor.secondary },
          '&.Mui-selected': {
            backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
            color: isDark ? textColor.primary : '#2A2320',
            '&:hover': { backgroundColor: isDark ? surface.hover : LIGHT_SURFACE },
          },
        },
      },
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          ...type.control,
          minHeight: 44,
          minWidth: 0,
          padding: '10px 14px',
          borderRadius: radius.pill,
          zIndex: 1,
          color: textColor.tertiary,
          transition: `color ${motion.base}`,
          '&.Mui-selected': { color: isDark ? textColor.primary : '#2A2320' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: {
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
          zIndex: 0,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { minHeight: 44 },
        label: { textTransform: 'none', fontSize: '0.9375rem', fontWeight: 450 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: paperBg,
          border: `1px solid ${borderColor}`,
          boxShadow: 'none',
          borderRadius: radius.lg,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.xl,
          backgroundColor: paperBg,
          backgroundImage: 'none',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? shadow.card : 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl,
          backgroundColor: isDark ? surface.raised : LIGHT_SURFACE,
          border: `1px solid ${borderColor}`,
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
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiFormHelperText: {
      styleOverrides: {
        root: { ...type.caption, color: textColor.tertiary, marginTop: 6 },
      },
    },
    // Contained rounded inputs, not the 2015-era underline.
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: isDark ? alpha('#000000', 0.2) : LIGHT_BASE,
          minHeight: 44,
          '& .MuiOutlinedInput-notchedOutline': { borderColor },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? surface.borderStrong : '#CDC5BE',
          },
        },
        input: { fontSize: 16 }, // 16px avoids iOS zoom-on-focus
      },
    },
    MuiSelect: { styleOverrides: { select: { fontSize: 16 } } },
    MuiAutocomplete: { styleOverrides: { input: { fontSize: 16 } } },
    MuiInput: {
      styleOverrides: {
        input: { fontSize: 16 },
        underline: {
          '&:before': { borderBottomColor: surface.border },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: 'none',
          boxShadow: 'none',
          backgroundColor: isDark ? alpha(surface.base, 0.9) : alpha(LIGHT_SURFACE, 0.9),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { backgroundColor: 'transparent' } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 48, minHeight: 48 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.pill, fontWeight: 500, fontSize: '0.75rem' },
        colorSuccess: ({ theme }) => getFilledChipStyles(theme, 'success'),
        colorInfo: ({ theme }) => getFilledChipStyles(theme, 'info'),
        colorWarning: ({ theme }) => getFilledChipStyles(theme, 'warning'),
        colorSecondary: ({ theme }) => getFilledChipStyles(theme, 'secondary'),
        colorError: ({ theme }) => getFilledChipStyles(theme, 'error'),
      },
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        // The visual track is 46x28; padding grows the hit area past the 44px
        // minimum without changing how it looks.
        // Visual track is 46x28. The hidden input is stretched vertically so
        // the actual tap area clears the 44px minimum without changing how
        // the switch looks.
        root: {
          width: 46,
          height: 28,
          padding: 0,
          margin: 8,
          overflow: 'visible',
          // The hidden input lives inside switchBase, which is 28px tall and
          // translates 18px when checked. Oversizing it here gives a tap area
          // that comfortably clears 44px in both states; it does travel with
          // the thumb, but at 84x44 over a 46x28 track it still covers the
          // whole control either way. (Repositioning switchBase to stop the
          // travel collapses the track — the thumb is absolutely positioned
          // against it.)
          '& .MuiSwitch-input': {
            top: -8,
            left: -20,
            height: 44,
            width: 84,
          },
        },
        switchBase: ({ theme }) => ({
          padding: 3,
          transition: `transform ${motion.spring}`,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: '#FFFFFF',
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.55),
            },
          },
        }),
        thumb: {
          width: 22,
          height: 22,
          backgroundColor: textColor.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        },
        track: {
          borderRadius: radius.pill,
          backgroundColor: isDark ? alpha('#000000', 0.45) : '#D6CFC9',
          opacity: 1,
          transition: `background-color ${motion.base}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          fontSize: '0.875rem',
          padding: '10px 16px',
          backgroundImage: 'none',
        },
        standardInfo: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.info.main, 0.08),
          border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
          color: theme.palette.info.light,
        }),
        standardWarning: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.warning.main, 0.08),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.18)}`,
          color: theme.palette.warning.light,
        }),
        standardError: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.error.main, 0.08),
          border: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
          color: theme.palette.error.light,
        }),
        standardSuccess: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.success.main, 0.08),
          border: `1px solid ${alpha(theme.palette.success.main, 0.18)}`,
          color: theme.palette.success.light,
        }),
        icon: { opacity: 0.8 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: radius.sm,
          backgroundColor: surface.overlay,
          border: `1px solid ${surface.border}`,
          fontSize: '0.8125rem',
          padding: '7px 11px',
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor } } },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: radius.pill, height: 4 } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 6 },
        rail: {
          backgroundColor: isDark ? alpha('#000000', 0.45) : '#E4DFDA',
          opacity: 1,
        },
        thumb: ({ theme }) => ({
          width: 20,
          height: 20,
          backgroundColor: textColor.primary,
          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0 1px 4px rgba(0,0,0,0.5), 0 0 0 8px ${alpha(theme.palette.primary.main, 0.14)}`,
          },
          '&::before': { boxShadow: 'none' },
        }),
        valueLabel: {
          backgroundColor: surface.overlay,
          border: `1px solid ${surface.border}`,
          borderRadius: radius.sm,
          fontSize: '0.75rem',
        },
        markLabel: { ...type.caption, color: textColor.tertiary },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: `${radius.lg}px !important`,
          '&:before': { display: 'none' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          minHeight: 44,
          '&:hover': { backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : 'rgba(0,0,0,0.03)' },
        },
      },
    },
  } satisfies ThemeOptions['components'];
};

const buildPalette = (mode: PaletteMode): ThemeOptions['palette'] => ({
  mode,
  primary: { main: accent.geo, light: '#A3BCF8', dark: '#5C7FD6' },
  secondary: { main: accent.jess, light: '#EFC0DA', dark: '#C47FA8' },
  success: { main: status.success, light: '#9BCFAB' },
  warning: { main: status.warning, light: '#E6C579' },
  error: { main: status.error, light: '#E39A90' },
  info: { main: status.info, light: '#A3C0E6' },
  divider: getBorderColor(mode),
  // Components read palette.grey[*] directly in places; map it onto the warm
  // neutral ramp so nothing falls back to MUI's cold stock greys.
  grey: {
    50: '#FAF7F4',
    100: '#F0EAE5',
    200: '#DED6D0',
    300: '#C2B8B1',
    400: textColor.secondary,
    500: textColor.tertiary,
    600: '#584F4A',
    700: '#453D39',
    800: surface.borderStrong,
    900: surface.overlay,
  },
  text: mode === 'dark'
    ? { primary: textColor.primary, secondary: textColor.secondary, disabled: textColor.disabled }
    : { primary: '#2A2320', secondary: '#6E645E', disabled: '#A69C95' },
  background: mode === 'dark'
    ? { default: surface.base, paper: surface.raised }
    : { default: LIGHT_BASE, paper: LIGHT_SURFACE },
});

export const buildTheme = (mode: PaletteMode = 'dark') =>
  createTheme({
    typography,
    palette: buildPalette(mode),
    shape: { borderRadius: radius.md },
    components: buildComponents(mode),
  });

export const theme = buildTheme('dark');
