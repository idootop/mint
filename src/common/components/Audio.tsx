import { forwardRef } from 'react';

import { type BoxProps, getBoxProps } from '@/common/components/Box';

export type AudioProps = BoxProps &
  React.AudioHTMLAttributes<HTMLAudioElement> &
  Partial<{
    src: string;
    muted: boolean;
    autoPlay: boolean;
    loop: boolean;
    controls: boolean;
    playsInline: boolean;
    preload: 'none' | 'metadata' | 'auto';
  }>;

const Audio = forwardRef((props: AudioProps, ref: any) => {
  const {
    src,
    muted = false,
    autoPlay = false,
    loop = false,
    controls = true,
    playsInline = false,
    preload = 'auto',
    ...rest
  } = props;

  const boxProps = getBoxProps(rest);

  return (
    <audio
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

Audio.displayName = 'Audio';

export { Audio };
