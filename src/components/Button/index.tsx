import './style.css';

import { BoxProps, getBoxProps, getClassName } from '@/common/components/Box';

export function Button(
  props: BoxProps & {
    url?: string;
    secondary?: boolean;
    download?: boolean;
    disabled?: boolean;
  },
) {
  const {
    secondary,
    url,
    download,
    disabled = false,
    children,
    className,
    ...rest
  } = props;
  const boxProps = getBoxProps({
    ...rest,
    className: [
      'button',
      secondary ? 'button-secondary' : 'button-primary',
      getClassName(className),
    ],
    style: {
      ...rest.style,
      cursor: disabled ? 'not-allowed' : undefined,
    },
  });

  return (
    <a href={url} download={download} target="_blank" {...boxProps}>
      {children}
    </a>
  );
}
