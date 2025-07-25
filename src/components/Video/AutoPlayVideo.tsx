'use client';

import { useEffect } from 'react';

import type { VideoProps } from '@/common/components/Video';
import { useIntersection } from '@/common/hooks/useIntersection';

import { BaseVideo } from './BaseVideo';
import { LazyVideo } from './LazyVideo';

export const AutoPlayVideo = (props: VideoProps & { lazy?: boolean }) => {
  const { intersectionRef, isIntersected } = useIntersection();

  useEffect(() => {
    const autoPlay = () => {
      if (isIntersected && intersectionRef.current) {
        if (intersectionRef.current.paused) {
          intersectionRef.current.play();
        }
      }
    };
    document.addEventListener('click', autoPlay);
    return () => {
      document.removeEventListener('click', autoPlay);
    };
  }, [intersectionRef, isIntersected]);

  const _Video = props.lazy ? LazyVideo : BaseVideo;

  return (
    <_Video
      autoPlay
      loop
      muted
      playsInline
      ref={intersectionRef}
      {...props}
      src={isIntersected ? props.src : ''}
      style={{
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="32" viewBox="0 0 100 32"><text x="50" y="16" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="rgba(0,0,0,50%)">点击查看</text></svg>')`,
        backgroundPosition: 'center',
        backgroundSize: '100px 32px',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};
