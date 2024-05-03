import { Video, VideoProps } from '@/common/components/Video';

export const AutoPlay = (props: VideoProps) => {
  return <Video {...props} muted autoPlay loop marginBottom="16px" />;
};
