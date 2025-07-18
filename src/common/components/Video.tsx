import { forwardRef } from 'react';

import { type BoxProps, getBoxProps } from '@/common/components/Box';

export type VideoProps = BoxProps &
  React.VideoHTMLAttributes<HTMLVideoElement> &
  Partial<{
    src: string;
    muted: boolean;
    autoPlay: boolean;
    loop: boolean;
    controls: boolean;
    playsInline: boolean;
    preload: 'none' | 'metadata' | 'auto';
  }>;

const Video = forwardRef((props: VideoProps, ref: any) => {
  const {
    src,
    muted = false,
    autoPlay = false,
    loop = false,
    controls = false,
    playsInline = false,
    preload = 'auto',
    ...rest
  } = props;

  const boxProps = getBoxProps(rest);

  return (
    <video
      ref={ref}
      {...boxProps}
      autoPlay={autoPlay}
      controls={controls}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      src={src}
    />
  );
});

Video.displayName = 'Video';

export { Video };
