import { Image, ImageProps } from '@/common/components/Image';
import { isNotEmpty } from '@/common/utils/is';
import { resolveAssetURL } from '@/utils/assets';
import { processImage } from '@/utils/image';

import styles from './styles.module.css';

export const TableImage = async (
  _props: Omit<ImageProps, 'marginBottom' | 'marginTop'> & {
    size?: number;
    width?: number;
    height?: number;
  },
) => {
  const imageData = await processImage(_props.src);
  const props = { ..._props, ...imageData };
  const { src, alt = '', ...restProps } = props;

  return (
    src && (
      <>
        <Image
          {...restProps}
          src={resolveAssetURL(src)}
          alt={alt}
          width="100%"
          height="100%"
        />
        {isNotEmpty(alt) && <span className={styles.center_label}>{alt}</span>}
      </>
    )
  );
};
