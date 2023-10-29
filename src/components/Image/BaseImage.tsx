/* eslint-disable @next/next/no-img-element */

import { isNotEmpty } from '@/core/utils/is';

interface ImageProps {
  src?: string;
  alt?: string;
}

export const BaseImage = (props: ImageProps) => {
  const { src, alt } = props;

  return (
    <span
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <img src={src} alt={alt} />
      {isNotEmpty(alt) && (
        <span
          style={{
            color: '#666',
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '10px',
          }}
        >
          {alt}
        </span>
      )}
    </span>
  );
};
