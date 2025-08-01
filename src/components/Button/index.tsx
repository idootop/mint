import './style.css';

import {
  type BoxProps,
  getBoxProps,
  getClassName,
} from '@/common/components/Box';

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
      userSelect: 'none',
      cursor: disabled ? 'not-allowed' : undefined,
    },
  });

  return (
    <a download={download} href={url} target="_blank" {...boxProps}>
      {children}
    </a>
  );
}
