import { BoxProps, getBoxProps } from '@/common/components/Box';

const kDefaultIconSize = '32px';

export function getIconProps(props: BoxProps) {
  const { size = kDefaultIconSize, color = '#000' } = props;
  const boxProps = getBoxProps({
    ...props,
    style: { size, color, ...props.style },
  });
  return {
    fill: 'currentColor',
    stroke: 'currentColor',
    width: size,
    height: size,
    ...boxProps,
  };
}
