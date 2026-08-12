import { PaletteMode, alpha, createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import {
  accent,
  blur,
  font,
  motion,
  radius,
  shadow,
  status,
  surface,
  surfaceTreatment,
  textColor,
  type,
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
  // Headings map onto the display tier of the scale. Nothing sits between the
  // hero readouts and the small caps labels — that gap is the hierarchy.
  h1: { ...type.hero },
  h2: { ...type.display },
  h3: { fontSize: '1.625rem', fontWeight: 620, letterSpacing: '-0.03em', lineHeight: 1.15 },
  h4: { ...type.metric },
  h5: { fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 },
  h6: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.35 },
  body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
  button: { fontWeight: 600, letterSpacing: '0.01em' },
  caption: { ...type.labelTight },
  // Small caps for every supporting label across the app.
  overline: { ...type.label },
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
        disableRipple: true, // the ripple is the single most recognisable MUI tell
      },
      styleOverrides: {
        // Buttons are built as moulded objects: a vertical gradient for form, a
        // top hairline so they catch light, and a press that sinks them 1px
        // while flipping the highlight to an inner shadow.
        root: {
          textTransform: 'none',
          borderRadius: radius.sm,
          padding: '9px 18px',
          position: 'relative',
          transition: [
            `background ${motion.fast}`,
            `border-color ${motion.fast}`,
            `color ${motion.fast}`,
            `box-shadow ${motion.fast}`,
            `transform ${motion.press}`,
          ].join(', '),
          '&:active': {
            transform: 'translateY(1px) scale(0.985)',
            boxShadow: shadow.pressed,
          },
          '&.Mui-disabled': {
            opacity: 0.4,
          },
        },
        outlined: ({ theme }) => ({
          borderColor: isDark ? surface.borderStrong : borderColor,
          background: isDark ? surfaceTreatment.control : 'transparent',
          boxShadow: isDark ? shadow.hairline : 'none',
          '&:hover': {
            borderColor: isDark ? alpha(theme.palette.primary.main, 0.5) : '#CDD2DA',
            background: isDark
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
              : 'rgba(0,0,0,0.02)',
          },
        }),
        contained: ({ theme }) => {
          const { light, main, dark } = theme.palette.primary;
          return {
            background: `linear-gradient(180deg, ${alpha(light, 0.95)} 0%, ${main} 55%, ${dark} 100%)`,
            color: '#0B0C0E',
            boxShadow: `${shadow.hairlineStrong}, 0 2px 8px ${alpha(main, 0.25)}`,
            '&:hover': {
              background: `linear-gradient(180deg, ${light} 0%, ${alpha(main, 0.98)} 55%, ${main} 100%)`,
              boxShadow: `${shadow.hairlineStrong}, 0 4px 14px ${alpha(main, 0.35)}`,
            },
          };
        },
        text: {
          '&:hover': {
            backgroundColor: isDark ? alpha(surface.hover, 0.6) : 'rgba(0,0,0,0.03)',
          },
        },
        sizeLarge: {
          padding: '13px 24px',
          fontSize: '0.9375rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: `background-color ${motion.fast}, color ${motion.fast}, transform ${motion.press}`,
          '&:active': {
            transform: 'scale(0.92)',
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    // Segmented control: a recessed track with a raised pill riding inside it.
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? alpha('#000000', 0.32) : LIGHT_BASE,
          borderRadius: radius.pill,
          padding: 4,
          gap: 2,
          border: `1px solid ${isDark ? alpha('#FFFFFF', 0.05) : borderColor}`,
          boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.45)' : 'none',
        },
        grouped: {
          border: 'none !important',
          borderRadius: `${radius.pill}px !important`,
        },
      },
    },
    MuiToggleButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.01em',
          color: textColor.tertiary,
          border: 'none',
          padding: '7px 18px',
          transition: [
            `background ${motion.base}`,
            `color ${motion.base}`,
            `box-shadow ${motion.base}`,
            `transform ${motion.press}`,
          ].join(', '),
          '&:hover': {
            color: isDark ? textColor.secondary : '#101828',
            backgroundColor: 'transparent',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
          '&.Mui-selected': {
            background: isDark ? surfaceTreatment.control : LIGHT_SURFACE,
            backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
            color: isDark ? textColor.primary : '#101828',
            boxShadow: isDark
              ? `${shadow.hairlineStrong}, 0 2px 8px rgba(0,0,0,0.4)`
              : '0 1px 3px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: isDark ? surface.hover : LIGHT_SURFACE,
            },
          },
        },
      },
    },
    // Tabs use a pill behind the active item rather than an underline. The
    // indicator is stretched to full height and pushed behind the labels.
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          minHeight: 40,
          minWidth: 0,
          padding: '8px 14px',
          borderRadius: radius.pill,
          zIndex: 1,
          color: textColor.tertiary,
          transition: `color ${motion.base}`,
          '&.Mui-selected': {
            color: isDark ? textColor.primary : '#101828',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: '100%',
          borderRadius: radius.pill,
          background: isDark ? surfaceTreatment.control : LIGHT_SURFACE,
          backgroundColor: isDark ? surface.overlay : LIGHT_SURFACE,
          boxShadow: isDark
            ? `${shadow.hairlineStrong}, 0 2px 8px rgba(0,0,0,0.4)`
            : '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: 0,
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
          backgroundImage: isDark ? surfaceTreatment.raised : 'none',
          backgroundColor: paperBg,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? shadow.hairline : 'none',
          borderRadius: radius.md,
        },
      },
    },
    // Cards are frosted panels: a translucent fill over a backdrop blur, a
    // diagonal sheen, and a top hairline that reads as an edge catching light.
    MuiCard: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.lg,
          backgroundColor: isDark ? alpha(surface.raised, 0.72) : paperBg,
          backgroundImage: isDark ? surfaceTreatment.glass : 'none',
          backdropFilter: isDark ? blur.glass : 'none',
          WebkitBackdropFilter: isDark ? blur.glass : 'none',
          border: `1px solid ${isDark ? alpha('#FFFFFF', 0.07) : borderColor}`,
          boxShadow: isDark ? `${shadow.hairline}, ${shadow.card}` : 'none',
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
          boxShadow: 'none',
          backgroundColor: isDark
            ? alpha(surface.base, 0.55)
            : alpha(LIGHT_SURFACE, 0.72),
          backdropFilter: blur.nav,
          WebkitBackdropFilter: blur.nav,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
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
    // iOS-style switch: recessed track, raised thumb, spring on the throw.
    MuiSwitch: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          width: 46,
          height: 28,
          padding: 0,
          margin: 8,
          overflow: 'visible',
        },
        switchBase: ({ theme }) => ({
          padding: 3,
          transition: `transform ${motion.spring}`,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: '#FFFFFF',
            '& + .MuiSwitch-track': {
              opacity: 1,
              background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderColor: alpha(theme.palette.primary.light, 0.4),
            },
          },
        }),
        thumb: {
          width: 22,
          height: 22,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25)',
          transition: `box-shadow ${motion.fast}`,
        },
        track: {
          borderRadius: radius.pill,
          backgroundColor: isDark ? alpha('#000000', 0.45) : '#D0D5DD',
          border: `1px solid ${isDark ? alpha('#FFFFFF', 0.07) : 'transparent'}`,
          boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.5)' : 'none',
          opacity: 1,
          transition: `background ${motion.base}, border-color ${motion.base}`,
        },
      },
    },
    // Alerts as tinted glass panels rather than MUI's saturated fills, which
    // are one of the most recognisable library defaults.
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          fontSize: '0.875rem',
          padding: '10px 16px',
          backgroundImage: 'none',
          backdropFilter: isDark ? blur.glass : 'none',
          WebkitBackdropFilter: isDark ? blur.glass : 'none',
          boxShadow: isDark ? shadow.hairline : 'none',
        },
        standardInfo: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.info.main, 0.09),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          color: theme.palette.info.light,
        }),
        standardWarning: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.warning.main, 0.09),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          color: theme.palette.warning.light,
        }),
        standardError: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.error.main, 0.09),
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          color: theme.palette.error.light,
        }),
        standardSuccess: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.success.main, 0.09),
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          color: theme.palette.success.light,
        }),
        icon: {
          opacity: 0.85,
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
    // Slider: recessed track with a raised, light-catching thumb.
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6,
        },
        rail: {
          backgroundColor: isDark ? alpha('#000000', 0.5) : '#E4E7EC',
          opacity: 1,
          border: `1px solid ${isDark ? alpha('#FFFFFF', 0.05) : 'transparent'}`,
          boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.5)' : 'none',
        },
        track: ({ theme }) => ({
          border: 'none',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.65)} 0%, ${theme.palette.primary.main} 100%)`,
        }),
        thumb: ({ theme }) => ({
          width: 20,
          height: 20,
          backgroundColor: '#FFFFFF',
          boxShadow: `0 1px 3px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.3)`,
          transition: `box-shadow ${motion.fast}, transform ${motion.press}`,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0 1px 3px rgba(0,0,0,0.45), 0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
          },
          '&.Mui-active': {
            transform: 'scale(1.15)',
          },
          '&::before': { boxShadow: 'none' },
        }),
        valueLabel: {
          backgroundColor: surface.overlay,
          border: `1px solid ${surface.border}`,
          borderRadius: radius.sm,
          fontSize: '0.75rem',
          fontWeight: 600,
        },
        markLabel: {
          fontSize: '0.75rem',
          color: textColor.tertiary,
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
