import { PropsWithChildren } from 'react';
import { Typography, Card, CardContent } from '@mui/material';

import { textColor } from '../../designTokens.ts';


type SectionProps = PropsWithChildren<{
  title?: string;
}>;

export default function Section({ title, children }: SectionProps) {
  return (
    <Card sx={ { width: '98%', overflowWrap: 'break-word', wordBreak: 'break-word' } }>
      <CardContent sx={ { p: 2.5, '&:last-child': { pb: 2.5 } } }>
        {
          title && (
            // Left-aligned small caps rather than a centred heading — reads as
            // a section marker instead of a page title.
            <Typography
              variant="overline"
              sx={ { display: 'block', color: textColor.tertiary, mb: 2 } }
            >
              { title }
            </Typography>
          )
        }
        { children }
      </CardContent>
    </Card>
  );
}
