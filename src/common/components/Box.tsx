/* eslint-disable prefer-const */
import {
  CSSProperties,
  DOMAttributes,
  forwardRef,
  ImgHTMLAttributes,
  ReactNode,
} from 'react';

import { removeEmpty, toSet } from '../utils/base';
import { isArray, isNumber, isString } from '../utils/is';

export type BoxStyle = CSSProperties &
  Partial<{
    size: string | number;
  }>;

export type BaseProps = Partial<{
  ref: any;
  children: ReactNode;
  id: string;
  className?: string | (string | undefined)[];
  style: BoxStyle;
}>;

export type BoxProps = BaseProps &
  BoxStyle & {
    includes?: string[];
    excludes?: string[];
  } & Omit<DOMAttributes<any>, 'onLoad' | 'onError' | 'className'> &
  Omit<ImgHTMLAttributes<any>, 'onLoad' | 'onError' | 'className'> &
  object;

export const getBoxProps = (props: BoxProps) => {
  let {
    ref: _,
    children: __,
    id,
    className: _class,
    style: _style,
    includes = [],
    excludes = [],
    ..._boxStyle
  } = props ?? {};

  _style = removeEmpty(_style);
  _boxStyle = removeEmpty(_boxStyle);

  const boxProps = {
    id,
    className: isArray(_class) ? _class.filter(e => !!e).join(' ') : _class,
    style: {} as BoxStyle,
  };

  Object.entries(_boxStyle).forEach(([key, value]) => {
    if (isNotCSSProperty([key, value], toSet([...includes, ...excludes]))) {
      // 不是 CSS style，而是 Box props
      delete _boxStyle[key];
      boxProps[key] = value;
    }
  });

  boxProps.style = {
    ..._boxStyle,
    ..._style,
  };

  // 处理 size
  if (boxProps.style.size) {
    boxProps.style.width = boxProps.style.size;
    boxProps.style.height = boxProps.style.size;
    delete boxProps.style['size'];
  }

  for (const key of excludes) {
    delete boxProps[key];
  }

  return removeEmpty(boxProps);
};

const Box = forwardRef((props: BoxProps, ref: any) => {
  const { children } = props;
  const boxProps = getBoxProps(props);

  return (
    <div ref={ref} {...boxProps}>
      {children}
    </div>
  );
});

Box.displayName = 'Box';

export { Box };

type GetBoxStyle = (props: BoxProps, key: string, value?: any) => any;
export const getBoxStyle: GetBoxStyle = (props, key, value) => {
  return props.style?.[key] ?? props[key] ?? value;
};

const isNotCSSProperty = (
  [key, value]: [string, any],
  excludes: string[] = [],
) => {
  return excludes.includes(key) || !(isString(value) || isNumber(value));
};
