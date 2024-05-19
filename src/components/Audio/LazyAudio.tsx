'use client';

import { useEffect } from 'react';

import { Audio, AudioProps } from '@/common/components/Audio';
import { useIntersection } from '@/common/hooks/useIntersection';
import { nextTick } from '@/common/utils/base';

export const LazyAudio = (props: AudioProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  useEffect(() => {
    if (isIntersected) {
      nextTick().then(() => intersectionRef.current.load());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersected]);

  return (
    <Audio
      ref={intersectionRef}
      {...props}
      width="100%"
      margin="0 auto"
      marginBottom="16px"
      src={isIntersected ? props.src : ''}
    />
  );
};
