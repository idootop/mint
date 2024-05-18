import { forwardRef } from 'react';

import { BoxProps, getBoxProps } from '@/common/components/Box';

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
      muted={muted}
      autoPlay={autoPlay}
      loop={loop}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
});

Video.displayName = 'Video';

export { Video };
