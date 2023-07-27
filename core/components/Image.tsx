/* eslint-disable @next/next/no-img-element */
import NextImage from 'next/image';
import { forwardRef, ReactNode, useState } from 'react';

import { isEmpty } from '../utils/is';
import { BoxProps, getBoxProps } from './Box';
import { Center } from './Flex';

export interface ImageProps extends BoxProps {
  src?: string;
  alt?: string;
  onLoad?: ReactNode;
  onError?: ReactNode;
}

const imgLoader = (p: { src: string }) => p.src;

export const Image = forwardRef((props: ImageProps, ref: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const src = props.src;

  const boxProps = getBoxProps({
    ...props,
    extStyle: {
      ...props.extStyle,
      display:
        isLoaded && !isError
          ? props.display ??
            props.style?.display ??
            props.extStyle?.display ??
            'block'
          : 'none',
      objectFit: 'cover',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  });

  const {
    alt = '',
    onLoad = (
      <Center
        {...boxProps}
        extStyle={{
          display: 'block',
        }}
      />
    ),
    onError = (
      <Center
        {...boxProps}
        extStyle={{
          display: 'block',
        }}
      />
    ),
  } = props;

  return isEmpty(src) ? (
    (onError as any)
  ) : (
    <>
      <NextImage
        ref={ref}
        {...boxProps}
        src={src!}
        alt={alt}
        width={0}
        height={0}
        unoptimized
        loading="eager"
        loader={imgLoader}
        onLoad={() => {
          setIsLoaded(true);
          setIsError(false);
        }}
        onError={() => {
          setIsLoaded(true);
          setIsError(true);
        }}
      />
      {!isLoaded ? onLoad : undefined}
      {isError ? onError : undefined}
    </>
  );
});
