import { forwardRef } from 'react';

import { Box, BoxProps, getBoxStyle } from './Box';

const Row = forwardRef((props: BoxProps, ref: any) => {
  return (
    <Box
      ref={ref}
      {...props}
      style={{
        ...props.style,
        display: 'flex',
        flexDirection: 'row',
        alignItems: props?.style?.alignItems ?? props?.alignItems ?? 'center',
      }}
    >
      {props?.children}
    </Box>
  );
});

Row.displayName = 'Row';

const Column = forwardRef((props: BoxProps, ref: any) => {
  return (
    <Box
      ref={ref}
      {...props}
      style={{
        ...props.style,
        display: 'flex',
        flexDirection: 'column',
        alignItems: getBoxStyle(props, 'alignItems', 'center'),
      }}
    >
      {props?.children}
    </Box>
  );
});

Column.displayName = 'Column';

const Expand = forwardRef((props: BoxProps, ref: any) => {
  const newProps = { flex: 1, display: 'flex', ...(props as any) };

  return (
    <Box ref={ref} {...newProps}>
      {props?.children}
    </Box>
  );
});

Expand.displayName = 'Expand';

const Center = forwardRef((props: BoxProps, ref: any) => {
  return (
    <Box
      ref={ref}
      {...props}
      style={{
        ...props.style,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {props?.children}
    </Box>
  );
});

Center.displayName = 'Center';

export { Center, Column, Expand, Row };
