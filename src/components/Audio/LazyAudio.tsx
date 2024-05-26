'use client';

import { AudioProps } from '@/common/components/Audio';
import { useIntersection } from '@/common/hooks/useIntersection';

import { BaseAudio } from './BaseAudio';

export const LazyAudio = (props: AudioProps) => {
  const { intersectionRef, isIntersected } = useIntersection();

  return (
    <BaseAudio
      ref={intersectionRef}
      playsInline
      {...props}
      src={isIntersected ? props.src : ''}
    />
  );
};
