import './style.css';

import { BoxProps, getBoxProps } from '@/common/components/Box';

export function Button(
  props: BoxProps & { url: string; secondary?: boolean; download?: boolean },
) {
  const { secondary, url, download, children, ...rest } = props;
  const boxProps = getBoxProps({
    ...rest,
    className: ['button', secondary ? 'button-secondary' : 'button-primary'],
  });

  return (
    <a href={url} download={download} target="_blank" {...boxProps}>
      {children}
    </a>
  );
}
