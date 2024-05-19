import { Image, ImageProps } from '@/common/components/Image';
import { isNotEmpty } from '@/common/utils/is';
import { resolveAssetURL } from '@/utils/assets';
import { processImage } from '@/utils/image';

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
          width="auto"
          height="auto"
        />
        {isNotEmpty(alt) && <span className="center-label">{alt}</span>}
      </>
    )
  );
};
