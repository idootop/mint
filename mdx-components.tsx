import type { MDXComponents } from 'mdx/types';

import { Box } from '@/common/components/Box';
import { Image } from '@/common/components/Image';
import { CodeCard } from '@/components/Code/CodeCard';
import { BannerImage } from '@/components/Image/BannerImage';
import { BaseImage } from '@/components/Image/BaseImage';
import { LinkExternal } from '@/components/MDX/LinkExternal';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Box,
    Image,
    BaseImage,
    BannerImage,
    img: BaseImage,
    a: LinkExternal,
    pre: ({ children }) => {
      return <CodeCard>{children}</CodeCard>;
    },
    ...components,
  };
}
