import { Video, VideoProps } from '@/common/components/Video';

export const AutoPlay = (props: VideoProps) => {
  return (
    <Video {...props} muted autoPlay loop preload="none" marginBottom="16px" />
  );
};
