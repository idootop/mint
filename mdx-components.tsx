import type { MDXComponents } from 'mdx/types';

import { Audio } from '@/common/components/Audio';
import { Image } from '@/common/components/Image';
import { LazyAudio } from '@/components/Audio/LazyAudio';
import { CodeCard } from '@/components/Code/CodeCard';
import { BannerImage } from '@/components/Image/BannerImage';
import { BaseImage } from '@/components/Image/BaseImage';
import { TableImage } from '@/components/Image/TableImage';
import { WrappedImage } from '@/components/Image/WrappedImage';
import { LinkExternal } from '@/components/MDX/LinkExternal';
import { AutoPlay } from '@/components/Video/AutoPlay';
import { LazyAutoPlay } from '@/components/Video/LazyAutoPlay';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Audio,
    AutoPlay,
    LazyAudio,
    LazyAutoPlay,
    Image,
    BaseImage,
    TableImage,
    BannerImage,
    WrappedImage,
    img: BaseImage as any,
    a: LinkExternal,
    pre: ({ children }) => {
      return <CodeCard>{children}</CodeCard>;
    },
    ...components,
  };
}
