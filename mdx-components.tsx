import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

import { CodeCard } from '@/components/Code/CodeCard';
import { BannerImage } from '@/components/Images/BannerImage';
import { BaseImage } from '@/components/Images/BaseImage';
import { LinkExternal } from '@/components/MDX/LinkExternal';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
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
