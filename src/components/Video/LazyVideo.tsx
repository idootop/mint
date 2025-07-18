'use client';

import type { VideoProps } from '@/common/components/Video';
import { useIntersection } from '@/common/hooks/useIntersection';

import { BaseVideo } from './BaseVideo';

export const LazyVideo = (props: VideoProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  return (
    <BaseVideo
      ref={intersectionRef}
      {...props}
      src={isIntersected ? props.src : ''}
    />
  );
};
