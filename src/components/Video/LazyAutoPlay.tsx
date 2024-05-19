'use client';

import { useEffect } from 'react';

import { VideoProps } from '@/common/components/Video';
import { useIntersection } from '@/common/hooks/useIntersection';
import { nextTick } from '@/common/utils/base';

import { AutoPlay } from './AutoPlay';

export const LazyAutoPlay = (props: VideoProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  useEffect(() => {
    if (isIntersected) {
      nextTick().then(() => intersectionRef.current.load());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersected]);

  return (
    <AutoPlay
      ref={intersectionRef}
      {...props}
      src={isIntersected ? props.src : ''}
    />
  );
};
