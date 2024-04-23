'use client';

import NextImage from 'next/image';
import { forwardRef, ReactNode, useRef, useState } from 'react';

import { isEmpty, isString } from '../utils/is';
import { BoxProps, getBoxProps, getBoxStyle } from './Box';

export interface ImageProps extends BoxProps {
  src: string;
  alt?: string;
  onLoad?: ReactNode;
  onError?: ReactNode;
  placeholder?: string;
  blurDataURL?: string;
}

const imgLoader = (p: { src: string }) => p.src;

const Image = forwardRef((props: ImageProps, ref: any) => {
  const [isLoaded, setIsLoaded] = useState(!!props.placeholder);
  const [isError, setIsError] = useState(false);

  const display = getBoxStyle(props, 'display', 'block');
  const boxProps = getBoxProps({
    ...props,
    style: {
      ...props.style,
      objectFit: 'cover',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: isLoaded && !isError ? display : 'none',
    },
    includes: ['placeholder', 'blurDataURL'],
    excludes: ['alt', 'src', 'onLoad', 'onError'],
  });

  const _placeholder = (
    <span
      {...boxProps}
      style={{
        ...boxProps.style,
        display: 'block',
      }}
    />
  );

  const {
    src,
    alt = '',
    onLoad = _placeholder,
    onError = _placeholder,
  } = props;

  const { width = 0, height = 0 } = boxProps.style;

  const _ref = useRef();
  const __ref = ref ?? _ref;

  if (isEmpty(src)) {
    return onError;
  }

  return (
    <>
      <NextImage
        ref={__ref}
        {...boxProps}
        src={src}
        alt={alt}
        width={isString(width) ? 0 : width}
        height={isString(height) ? 0 : height}
        unoptimized
        loading="lazy"
        loader={imgLoader}
        onLoad={() => {
          __ref.current.removeAttribute('with');
          __ref.current.removeAttribute('height');
          if (!props.width) {
            __ref.current.style.width = 'auto';
          }
          if (isString(width)) {
            __ref.current.style.width = width;
          }
          if (!props.height) {
            __ref.current.style.height = 'auto';
          }
          if (isString(height)) {
            __ref.current.style.height = height;
          }
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

Image.displayName = 'Image';

export { Image };
