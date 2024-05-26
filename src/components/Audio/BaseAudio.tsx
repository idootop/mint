import { forwardRef } from 'react';

import { Audio, AudioProps } from '@/common/components/Audio';

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
          ref={ref}
          className="center-box"
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
