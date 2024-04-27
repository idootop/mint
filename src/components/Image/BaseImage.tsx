import { Image } from '@/common/components/Image';
import { isNotEmpty } from '@/common/utils/is';
import { resolveAssetURL } from '@/utils/assets';
import { processImage } from '@/utils/image';

import styles from './styles.module.css';

export const BaseImage = async _props => {
  const imageData = await processImage(_props.src);
  const props = { ..._props, ...imageData };
  const { src, alt = '', ...restProps } = props;
  const width = _props.size ?? props.width ?? 0;
  const height = _props.size ?? props.height ?? 0;
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