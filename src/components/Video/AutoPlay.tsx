import { Video, VideoProps } from '@/common/components/Video';

export const AutoPlay = (
  props: VideoProps & {
    alt?: string;
  },
) => {
  const { alt, marginBottom = '16px', marginTop, ...rest } = props;
  return (
    <>
      {marginTop && <span style={{ height: marginTop, display: 'block' }} />}
      <Video
        className="center-box"
        {...rest}
        muted
        autoPlay
        loop
        preload="none"
        margin="0 auto"
      />
      {alt && (
        <span className="center-label" style={{ margin: '0 auto' }}>
          {alt}
        </span>
      )}
      {marginBottom && (
        <span style={{ height: marginBottom, display: 'block' }} />
      )}
    </>
  );
};
