import { useEffect, useState } from 'react';

import { BoxProps, getBoxProps } from '../Box';
import styles from './style.module.css';

interface SpinnerProps extends BoxProps {
  size?: string | number;
  color?: string;
  background?: string;
  thickness?: string;
  delay?: number;
  theme?: 'light' | 'dark';
}

export const Spinner = (props?: SpinnerProps) => {
  const {
    size = 40,
    delay,
    thickness = '4px',
    theme,
    color = theme === 'light' ? '#2d5cf6' : '#fff',
    background = theme === 'light'
      ? 'rgba(0, 0, 0, 0.1)'
      : 'rgba(255, 255, 255, 0.1)',
  } = props ?? {};

  const boxProps = getBoxProps({
    ...props,
    className: styles.spinner,
    style: {
      ...props?.style,
      width: size,
      height: size,
      background: 'transparent',
      border: `${thickness} solid ${background}`,
      borderTop: `${thickness} solid ${color}`,
    },
    excludes: ['delay', 'theme', 'thickness'],
  });

  const [initialized, setInitialized] = useState(delay ? false : true);
  useEffect(() => {
    setTimeout(() => {
      setInitialized(true);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return initialized ? <div {...boxProps} /> : <div />;
};
