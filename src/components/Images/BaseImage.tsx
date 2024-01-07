/* eslint-disable @next/next/no-img-element */

import { Image } from '@/core/components/Image';
import { isNotEmpty } from '@/core/utils/is';
import { resolveLocalPath } from '@/src/utils/assets';

import styles from './styles.module.css';

const kAspectRatio: any = '--aspect-ratio';

export const BaseImage = props => {
  const { src, alt = '', width = 0, height = 0, ...restProps } = props;
  const aspectRatioStyle =
    height > 0
      ? {
          ...props.style,
          display: 'block',
          width: `${width}px`,
          maxWidth: '100%',
          [kAspectRatio]: width / height,
        }
      : undefined;

  return (
    src && (
      <>
        {height > 0 ? (
          <span className={styles.center_image} style={aspectRatioStyle}>
            <Image
              {...restProps}
              src={resolveLocalPath(src)}
              alt={alt}
              width="100%"
              height="100%"
            />
          </span>
        ) : (
          <Image
            {...restProps}
            src={resolveLocalPath(src)}
            alt={alt}
            className={styles.center_image}
          />
        )}
        {isNotEmpty(alt) && <span className={styles.center_label}>{alt}</span>}
        <span style={{ height: '16px', display: 'block' }} />
      </>
    )
  );
};
