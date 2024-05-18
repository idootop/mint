'use client';

import { useEffect } from 'react';

import { Video, VideoProps } from '@/common/components/Video';
import { useIntersection } from '@/common/hooks/useIntersection';
import { nextTick } from '@/common/utils/base';

export const LazyAutoPlay = (props: VideoProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  useEffect(() => {
    if (isIntersected) {
      nextTick().then(() => intersectionRef.current.load());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersected]);

  return (
    <Video
      ref={intersectionRef}
      {...props}
      muted
      autoPlay
      loop
      marginBottom="16px"
      src={isIntersected ? props.src : ''}
    />
  );
};
