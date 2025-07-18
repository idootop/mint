import { forwardRef } from 'react';

import { Box, type BoxProps } from '../Box';

export type AlignTypes =
  | 'center'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'centerLeft'
  | 'centerRight'
  | 'topCenter'
  | 'bottomCenter';

export interface PositionProps {
  top: number | string;
  left: number | string;
  right: number | string;
  bottom: number | string;
  align: AlignTypes;
  transform: string;
}

const Position = forwardRef(
  (props: BoxProps & Partial<PositionProps>, ref: any) => {
    const position = getStackPosition(props);
    const newProps = {
      ...props,
      ...position,
      position: 'absolute' as any,
    };
    return <Box ref={ref} {...newProps} />;
  },
);

Position.displayName = 'Position';

export { Position };

const getStackPosition = (props: Partial<PositionProps>) => {
  const alignMap: Record<string, Partial<PositionProps>> = {
    topLeft: {
      top: 0,
      left: 0,
    },
    topRight: {
      top: 0,
      right: 0,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
    },
    center: {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    topCenter: {
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
    },
    bottomCenter: {
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
    },
    centerLeft: {
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
    },
    centerRight: {
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
    },
  };
  return alignMap[props.align ?? '404'];
};
