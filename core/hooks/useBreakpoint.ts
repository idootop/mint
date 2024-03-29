import { useEffect } from 'react';
import { useXState, XSta } from 'xsta';

const _getBreakpoint = () => {
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

interface DeviceSize {
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

const kScreenReSizeListenerKey = 'kScreenReSizeListenerKey';
let _initScreenReSizeListener = false;
const initScreenReSizeListener = () => {
  if (!_initScreenReSizeListener) {
    XSta.set(kScreenReSizeListenerKey, _getBreakpoint());
    window.addEventListener('resize', () => {
      XSta.set(kScreenReSizeListenerKey, _getBreakpoint());
    });
    _initScreenReSizeListener = true;
  }
};

export const useBreakpoint = (): Partial<DeviceSize> => {
  // 要先等 useXState 注册 rebuild 回调
  const [breakpoint] = useXState(kScreenReSizeListenerKey);
  useEffect(() => {
    // 然后再初始化 store 的值，触发 client 端更新
    initScreenReSizeListener();
  }, []);
  return breakpoint
    ? { ...breakpoint, isReady: true }
    : { isMobile: true, isReady: false }; // 默认移动端（优先）
};
