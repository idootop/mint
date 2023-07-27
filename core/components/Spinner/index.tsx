import { useEffect, useState } from 'react';

import { BoxProps, getBoxProps } from '../Box';
import styles from './style.module.css';

interface SpinnerProps extends BoxProps {
  size?: string;
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
  const style = {
    width: size,
    height: size,
    border: `${thickness} solid ${background}`,
    borderTop: `${thickness} solid ${color}`,
  };
  const boxProps = getBoxProps({
    ...props,
    ...{ style, className: styles.spinner },
  });

  const [inited, setInited] = useState(delay ? false : true);
  useEffect(() => {
    setTimeout(() => {
      setInited(true);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return inited ? <div {...boxProps} /> : <div />;
};
