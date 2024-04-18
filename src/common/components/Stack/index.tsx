import { forwardRef } from 'react';

import { flattenChildren } from '../../utils/base';
import { Box, BoxProps } from '../Box';

export const Stack = forwardRef((props: BoxProps, ref: any) => {
  const children = flattenChildren(props.children);
  const [target, ...items] = children;
  const newProps = {
    width: 'fit-content',
    height: 'fit-content',
    ...props,
    position: 'relative' as any,
  };
  return (
    <Box ref={ref} {...newProps}>
      {items}
      {target}
    </Box>
  );
});
