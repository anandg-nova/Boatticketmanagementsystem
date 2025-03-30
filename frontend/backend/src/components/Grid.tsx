import { Grid as MuiGrid } from '@mui/material';
import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  className?: string;
}

export const Grid = ({
  children,
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing,
  className,
}: GridProps) => {
  return (
    <MuiGrid
      container={container}
      item={item}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      spacing={spacing}
      className={className}
    >
      {children}
    </MuiGrid>
  );
}; 