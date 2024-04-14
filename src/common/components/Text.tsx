import { forwardRef } from 'react';

import { BoxProps, getBoxProps } from './Box';

interface TextProps extends BoxProps {
  maxLines?: number;
}

export const Text = forwardRef((props: TextProps, ref: any) => {
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
    ...{
      style: {
        ...style,
        ...maxLinesStyle,
      },
    },
  });

  return (
    <span ref={ref} {...boxProps}>
      {children}
    </span>
  );
});
