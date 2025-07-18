import { forwardRef } from 'react';

import { Video, type VideoProps } from '@/common/components/Video';

const BaseVideo = forwardRef(
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
        <Video className="center-box" ref={ref} {...rest} margin="0 auto" />
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

BaseVideo.displayName = 'BaseVideo';

export { BaseVideo };
