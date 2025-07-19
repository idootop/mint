'use client';

import { useEffect, useRef } from 'react';

import { useRebuildRef } from './useRebuild';

export const useIntersection = (options?: IntersectionObserverInit) => {
  const intersectionRef = useRef<any>(null);
  const rebuildRef = useRebuildRef();
  const stateRef = useRef<{
    isIntersected: boolean;
    isIntersecting: boolean;
    entry?: IntersectionObserverEntry;
  }>({ isIntersected: false, isIntersecting: false });

  useEffect(() => {
    if (!intersectionRef.current) {
      return;
    }
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          stateRef.current.isIntersected = true;
          stateRef.current.isIntersecting = true;
          rebuildRef.current();
        } else {
          stateRef.current.isIntersecting = false;
          rebuildRef.current!();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.0001,
        ...options,
      },
    );
    observer.observe(intersectionRef.current);
    return () => {
      if (intersectionRef.current) {
        observer.unobserve(intersectionRef.current);
      }
    };
  }, [options, rebuildRef.current]);
  return { intersectionRef, ...stateRef.current };
};
