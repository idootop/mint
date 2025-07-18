import { forwardRef } from 'react';

import { type BoxProps, getBoxProps } from './Box';

interface TextProps extends BoxProps {
  maxLines?: number;
}

const Text = forwardRef((props: TextProps, ref: any) => {
  const { children, maxLines, style = {} } = props;
  const maxLinesStyle: BoxProps = maxLines
    ? {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: maxLines ?? 'none',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        wordBreak: 'break-all',
      }
    : {
        display: 'inline-block',
      };

  const boxProps = getBoxProps({
    ...props,
    style: {
      ...style,
      ...maxLinesStyle,
    },
    excludes: ['maxLines'],
  });

  return (
    <span ref={ref} {...boxProps}>
      {children}
    </span>
  );
});

Text.displayName = 'Text';

export { Text };
