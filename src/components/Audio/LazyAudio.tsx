'use client';

import type { AudioProps } from '@/common/components/Audio';
import { useIntersection } from '@/common/hooks/useIntersection';

import { BaseAudio } from './BaseAudio';

export const LazyAudio = (props: AudioProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  return (
    <BaseAudio
      playsInline
      ref={intersectionRef}
      {...props}
      src={isIntersected ? props.src : ''}
    />
  );
};
