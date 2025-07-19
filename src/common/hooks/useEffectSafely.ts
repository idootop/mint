import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react';

export const useEffectSafely = (
  effect: (isDisposed: () => boolean) => ReturnType<EffectCallback>,
  deps?: DependencyList,
) => {
  const effectRef = useRef(0);
  useEffect(() => {
    effectRef.current = effectRef.current + 1;
    const currentEffect = effectRef.current;
    const ret = effect(() => currentEffect !== effectRef.current);
    return () => {
      effectRef.current = effectRef.current + 1;
      ret?.();
    };
  }, deps);
};
