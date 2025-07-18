import { Image, type ImageProps } from '@/common/components/Image';
import { isNotEmpty } from '@/common/utils/is';
import { resolveAssetURL } from '@/utils/assets';
import { processImage } from '@/utils/image';

export const BaseImage = async (
  _props: ImageProps & { size?: number; width?: number; height?: number },
) => {
  const imageData = await processImage(_props.src);
  const props = { ..._props, ...imageData };
  const {
    src,
    alt = '',
    marginBottom = '16px',
    marginTop,
    ...restProps
  } = props;
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
        {marginTop && <span style={{ height: marginTop, display: 'block' }} />}
        {height > 0 ? (
          <span className="center-box" style={aspectRatioStyle}>
            <Image
              {...restProps}
              alt={alt}
              height="100%"
              src={resolveAssetURL(src)}
              width="100%"
            />
          </span>
        ) : (
          <Image
            {...restProps}
            alt={alt}
            className="center-box"
            src={resolveAssetURL(src)}
          />
        )}
        {isNotEmpty(alt) && <span className="center-label">{alt}</span>}
        {marginBottom && (
          <span style={{ height: marginBottom, display: 'block' }} />
        )}
      </>
    )
  );
};
