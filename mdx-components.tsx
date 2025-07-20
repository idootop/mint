import type { MDXComponents } from 'mdx/types';

import { BaseAudio } from '@/components/Audio/BaseAudio';
import { LazyAudio } from '@/components/Audio/LazyAudio';
import { CodeCard } from '@/components/Code/CodeCard';
import { BannerImage } from '@/components/Image/BannerImage';
import { BaseImage } from '@/components/Image/BaseImage';
import { RawImage } from '@/components/Image/RawImage';
import { TableImage } from '@/components/Image/TableImage';
import { WrappedImage } from '@/components/Image/WrappedImage';
import { LinkExternal } from '@/components/MDX/LinkExternal';
import { AutoPlayVideo } from '@/components/Video/AutoPlayVideo';
import { BaseVideo } from '@/components/Video/BaseVideo';
import { LazyVideo } from '@/components/Video/LazyVideo';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    BaseAudio,
    LazyAudio,
    BaseVideo,
    LazyVideo,
    AutoPlayVideo,
    RawImage,
    BaseImage,
    TableImage,
    BannerImage,
    WrappedImage,
    a: LinkExternal,
    img: BaseImage,
    pre: CodeCard,
  };
}
