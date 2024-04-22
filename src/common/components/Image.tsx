'use client';

import NextImage from 'next/image';
import { forwardRef, ReactNode, useRef, useState } from 'react';

import { isEmpty, isString, kIsDev } from '../utils/is';
import { BoxProps, getBoxProps } from './Box';

export interface ImageProps extends BoxProps {
  src?: string;
  alt?: string;
  onLoad?: ReactNode;
  onError?: ReactNode;
  placeholder?: string;
  blurDataURL?: string;
}

const imgLoader = (p: { src: string }) => p.src;

export const Image = forwardRef((props: ImageProps, ref: any) => {
  const [isLoaded, setIsLoaded] = useState(!!props.placeholder);
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
    width = 0,
    height = 0,
    alt = '',
    placeholder,
    blurDataURL,
    onLoad = _placeholder,
    onError = _placeholder,
  } = props;

  const _ref = useRef();
  const __ref = ref ?? _ref;

  // 在 dev 环境下，将图片的 blur 参数挂到 className 上显示出来
  if (kIsDev) {
    boxProps.className = [
      boxProps.className,
      'placeholder:' + placeholder,
      'blurDataURL:' + blurDataURL,
    ]
      .filter(e => !!e)
      .join(' ');
  }

  return isEmpty(src) ? (
    (onError as any)
  ) : (
    <>
      <NextImage
        ref={__ref}
        {...boxProps}
        src={src!}
        alt={alt}
        width={isString(width) ? 0 : (width as any)}
        height={isString(height) ? 0 : (height as any)}
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
