import { useEffect, useRef, useState } from 'react';

interface ScreenSize {
  isReady: boolean;
  isMobile: boolean;
  isPC: boolean;
  isPad: boolean;
  isXS: boolean;
  isSM: boolean;
  isMD: boolean;
  isLG: boolean;
  isXL: boolean;
  isXXL: boolean;
  isXXXL: boolean;
}

const getScreenSize = (): Partial<ScreenSize> => {
  const width = document.body.clientWidth;
  if (width < 576) {
    return { isXS: true, isMobile: true };
  }
  if (width >= 576 && width < 768) {
    return { isSM: true, isMobile: true };
  }
  if (width >= 768 && width < 992) {
    return { isMD: true, isPad: true };
  }
  if (width >= 992 && width < 1200) {
    return { isLG: true, isPC: true };
  }
  if (width >= 1200 && width < 1600) {
    return { isXL: true, isPC: true };
  }
  if (width >= 1600 && width < 2000) {
    return { isXXL: true, isPC: true };
  }

  return { isXXXL: true, isPC: true };
};

export const useBreakpoint = (): Partial<ScreenSize> => {
  const [breakpoint, setBreakpoint] = useState<Partial<ScreenSize>>();
  const updateRef = useRef(setBreakpoint);
  updateRef.current = setBreakpoint;

  useEffect(() => {
    const update = () => {
      updateRef.current(getScreenSize());
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return breakpoint
    ? { ...breakpoint, isReady: true }
    : { isMobile: true, isReady: false }; // 默认移动端（优先）
};
