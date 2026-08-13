import React from 'react';
import { Container, ContainerProps } from '@mui/material';
import { SxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ErrorBoundary from '@components/ErrorBoundary.tsx';


type PageContainerProps = {
  containerProps?: ContainerProps;
  sx?: SxProps
}

export default function PageContainer({ children, sx, containerProps }: React.PropsWithChildren<PageContainerProps>) {
  const theme = useTheme();

  return (
    <ErrorBoundary componentName='Page container'>
      <Container
        { ...containerProps }
        id='PageContainer'
        sx={ {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          alignItems: 'center',
          gap: 2,
          margin: 0,
          // Top-aligned, not centred. Centring pushed tall pages past their
          // own bottom padding, so the last row slid under the fixed nav.
          justifyContent: 'flex-start',
          [theme.breakpoints.up('sm')]: {
            width: '90%',
            padding: 0,
            paddingTop: 6,
            paddingBottom: 6,
            maxWidth: '700px',
          },
          [theme.breakpoints.down('sm')]: {
            width: '100%',
            padding: 1,
          },
          // Clear the fixed mobile brand header and the floating bottom nav,
          // which would otherwise sit on top of the page content.
          [theme.breakpoints.down('md')]: {
            paddingTop: 7,
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          },
          ...sx,
        } }
      >
        { children }
      </Container>
    </ErrorBoundary>
  );
}
