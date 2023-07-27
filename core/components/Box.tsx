import { CSSProperties, forwardRef, MouseEventHandler, ReactNode } from 'react';

import { isArray } from '../utils/is';

export interface BaseProps {
  // 基础属性
  id?: string;
  key?: any;
  ref?: any;
  className?: string | string[];
  children?: ReactNode;
  src?: string;
  style?: CSSProperties;

  onClick?: MouseEventHandler | undefined;
  // 增强属性
  extStyle?: CSSProperties;
  size?: string | number;
}

export type BoxProps = CSSProperties & BaseProps;

export const getBoxProps = (props: BoxProps) => {
  const {
    id,
    key: _,
    ref: __,
    children: ___,
    className: _class,
    src,
    style,
    extStyle = {},
    onClick,
    size,
    ...styles
  } = props ?? {};

  if (size) {
    extStyle.width = size;
    extStyle.height = size;
  }

  const className = isArray(_class) ? (_class as any)!.join(' ') : _class;

  return {
    id,
    onClick,
    className,
    src,
    style: {
      ...style,
      ...styles,
      ...extStyle,
    },
  };
};

export const Box = forwardRef((props: BoxProps, ref: any) => {
  const { children } = props;
  const boxProps = getBoxProps(props);

  return (
    <div ref={ref} {...boxProps}>
      {children}
    </div>
  );
});
