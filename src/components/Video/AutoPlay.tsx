import { forwardRef } from 'react';

import { Video, VideoProps } from '@/common/components/Video';

const AutoPlay = forwardRef(
  (
    props: VideoProps & {
      alt?: string;
    },
    ref: any,
  ) => {
    const { alt, marginBottom = '16px', marginTop, ...rest } = props;
    return (
      <>
        {marginTop && <span style={{ height: marginTop, display: 'block' }} />}
        <Video
          ref={ref}
          className="center-box"
          {...rest}
          muted
          autoPlay
          loop
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
  },
);

AutoPlay.displayName = 'AutoPlay';

export { AutoPlay };
