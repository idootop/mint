import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

export const useEffectSafely = (
  effect: (isDisposed: () => boolean) => ReturnType<EffectCallback>,
  deps?: DependencyList,
) => {
  const effectRef = useRef(0);
  useEffect(() => {
    effectRef.current = effectRef.current + 1;
    const currentEffect = effectRef.current;
    return effect(() => currentEffect !== effectRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
