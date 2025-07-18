import { getBoxProps } from '@/common/components/Box';
import type { ImageProps } from '@/common/components/Image';

import { BaseImage } from './BaseImage';

export const WrappedImage = async (
  props: ImageProps & { size?: number; width?: number; height?: number },
) => {
  const { src, alt, ...rest } = props;
  const imgProps = { src, alt };
  const boxProps = getBoxProps({
    ...rest,
    style: { margin: '0 auto', ...rest.style },
  });
  return (
    <div {...boxProps}>
      <BaseImage {...imgProps} />
    </div>
  );
};
