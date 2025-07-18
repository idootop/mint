import { forwardRef } from 'react';

import { flattenChildren } from '../../utils/base';
import { Box, type BoxProps } from '../Box';

const Stack = forwardRef((props: BoxProps, ref: any) => {
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

Stack.displayName = 'Stack';

export { Stack };
