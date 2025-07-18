import { forwardRef } from 'react';

import { Audio, type AudioProps } from '@/common/components/Audio';

const BaseAudio = forwardRef(
  (
    props: AudioProps & {
      alt?: string;
    },
    ref: any,
  ) => {
    const { alt, marginBottom = '16px', marginTop, ...rest } = props;
    return (
      <>
        {marginTop && <span style={{ height: marginTop, display: 'block' }} />}
        <Audio
          className="center-box"
          ref={ref}
          {...rest}
          margin="0 auto"
          width="100%"
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

BaseAudio.displayName = 'BaseAudio';

export { BaseAudio };
