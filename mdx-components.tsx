import type { MDXComponents } from 'mdx/types';

import { BaseAudio } from '@/components/Audio/BaseAudio';
import { LazyAudio } from '@/components/Audio/LazyAudio';
import { CodeCard } from '@/components/Code/CodeCard';
import { BannerImage } from '@/components/Image/BannerImage';
import { BaseImage } from '@/components/Image/BaseImage';
import { TableImage } from '@/components/Image/TableImage';
import { WrappedImage } from '@/components/Image/WrappedImage';
import { LinkExternal } from '@/components/MDX/LinkExternal';
import { AutoPlayVideo } from '@/components/Video/AutoPlayVideo';
import { BaseVideo } from '@/components/Video/BaseVideo';
import { LazyVideo } from '@/components/Video/LazyVideo';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    BaseAudio,
    LazyAudio,
    BaseVideo,
    LazyVideo,
    AutoPlayVideo,
    BaseImage,
    TableImage,
    BannerImage,
    WrappedImage,
    a: LinkExternal,
    img: BaseImage as any,
    pre: CodeCard as any,
    ...components,
  };
}
