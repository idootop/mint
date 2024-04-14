import { Image } from '@/common/components/Image';
import { isNotEmpty } from '@/common/utils/is';
import { resolveAssetURL } from '@/utils/assets';
import { processImage } from '@/utils/image';

import styles from './styles.module.css';

export const BaseImage = async props => {
  const imageData = await processImage(props.src);
  props = { ...props, ...imageData };
  const { src, alt = '', width = 0, height = 0, ...restProps } = props;
  const aspectRatioStyle =
    height > 0
      ? {
          ...props.style,
          display: 'block',
          width: `${width}px`,
          maxWidth: '100%',
          '--aspect-ratio': width / height,
        }
      : undefined;

  return (
    src && (
      <>
        {height > 0 ? (
          <span className={styles.center_image} style={aspectRatioStyle}>
            <Image
              {...restProps}
              src={resolveAssetURL(src)}
              alt={alt}
              width="100%"
              height="100%"
            />
          </span>
        ) : (
          <Image
            {...restProps}
            src={resolveAssetURL(src)}
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
