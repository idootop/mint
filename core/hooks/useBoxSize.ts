import { useCallback, useEffect, useRef, useState } from 'react';

export const useBoxSize = () => {
  const boxRef: any = useRef<HTMLElement>();
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });
  const dataRef = useRef({
    size,
    setSize,
  });
  dataRef.current = { size, setSize };

  const onWindowResize = useCallback(() => {
    dataRef.current.setSize({
      width: boxRef.current!.clientWidth,
      height: boxRef.current!.clientHeight,
    });
  }, []);

  useEffect(() => {
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, [onWindowResize]);

  return { boxRef, ...size };
};
