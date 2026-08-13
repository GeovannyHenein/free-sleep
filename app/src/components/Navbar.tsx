import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@state/appStore.tsx';
import { alpha, useTheme } from '@mui/material/styles';
import { PAGES } from './pages';
import Logo from './Logo.tsx';
import { motion, radius, surface, textColor } from '../designTokens.ts';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isUpdating } = useAppStore();
  const theme = useTheme(); // Access the Material-UI theme
  const [mobileNavValue, setMobileNavValue] = React.useState(
    PAGES.findIndex((page) => page.route === pathname)
  );

  // Handle navigation for both desktop and mobile
  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleMobileNavChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setMobileNavValue(newValue);
    handleNavigation(PAGES[newValue].route);
  };

  const gradient = `linear-gradient(
  90deg,
  transparent,
  ${theme.palette.primary.dark},
  transparent,
  ${theme.palette.primary.dark},
  transparent
)`;
  return (
    <>
      { /* Loading Bar */ }
      <Box
        sx={ {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: isUpdating ? gradient : 'transparent',
          backgroundSize: '200% 100%',
          animation: isUpdating
            ? 'slide-gradient 10s linear infinite reverse'
            : 'none',
          zIndex: 1201,
        } }
      />
      { /* Desktop Navigation */ }
      <AppBar
        position="fixed"
        color="transparent"
        sx={ {
          display: { xs: 'none', md: 'flex' },
          // Blur and translucency come from the theme; only the border is set
          // here so the bar reads as a floating layer over the page.
          borderTop: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          top: 'auto', // Push it to the bottom
          bottom: 0, // Stick it to the bottom
          left: 0,
          right: 0,
        } }
      >
        <Toolbar>
          <Box sx={ { flexGrow: 1 } }>
            <Logo size={ 34 } />
          </Box>
          { /* Pill-shaped active state rather than an outlined button. */ }
          <Box sx={ { display: 'flex', gap: 0.5 } }>
            { PAGES.map(({ title, route }) => {
              const isActive = pathname === route;
              return (
                <Button
                  key={ route }
                  onClick={ () => handleNavigation(route) }
                  variant="text"
                  sx={ {
                    borderRadius: `${radius.pill}px`,
                    px: 2,
                    color: isActive ? theme.palette.primary.light : textColor.tertiary,
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.13)
                      : 'transparent',
                    boxShadow: 'none',
                    transition: `color ${motion.base}, background-color ${motion.base}`,
                    '&:hover': {
                      color: isActive ? theme.palette.primary.light : textColor.primary,
                      backgroundColor: isActive
                        ? alpha(theme.palette.primary.main, 0.18)
                        : alpha('#FFFFFF', 0.04),
                    },
                  } }
                >
                  { title }
                </Button>
              );
            }) }
          </Box>
        </Toolbar>
      </AppBar>

      { /* Mobile header. The bottom bar is icon-only, so without this the
           branding never appears on a phone. Fixed rather than inline because
           Layout renders Navbar after the page content. */ }
      <Box
        sx={ {
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          px: 1,
          py: 1.25,
          zIndex: 10,
          backgroundColor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: 'blur(12px)',
        } }
      >
        <Logo size={ 28 } />
      </Box>

      { /* Mobile Bottom Navigation — bare icons on the page, no container.
           The active destination is marked by accent colour alone. */ }
      <Box
        sx={ {
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          // No container: the icons sit directly on the page, with a short
          // fade so content scrolling underneath dissolves rather than
          // colliding with a hard edge.
          background: `linear-gradient(to top, ${surface.base} 55%, ${alpha(surface.base, 0)} 100%)`,
          zIndex: 10,
        } }
      >
        <BottomNavigation
          value={ mobileNavValue }
          onChange={ handleMobileNavChange }
          sx={ {
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 1,
          } }
        >
          { PAGES.map(({ title, icon }, index) => (
            <BottomNavigationAction
              key={ index }
              icon={ icon }
              aria-label={ title }
              disableRipple
              sx={ {
                minWidth: 0,
                color: textColor.disabled,
                '& .MuiSvgIcon-root': { fontSize: 24 },
                transition: `color ${motion.base}, transform ${motion.press}`,
                '&:active': { transform: 'scale(0.9)' },
                // Active state is colour alone — no pill, no background.
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              } }
            />
          )) }
        </BottomNavigation>
      </Box>
      <style>
        { `
@keyframes slide-gradient {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}
        ` }
      </style>
    </>
  );
}
