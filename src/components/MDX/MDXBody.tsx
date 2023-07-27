// Markdown
import 'github-markdown-css/github-markdown-light.css';
import '@/src/styles/markdown.css';
// Highlight
import '@/src/styles/highlight.css';

import type { MDXComponents } from 'mdx/types';
import { useMDXComponent } from 'next-contentlayer/hooks';

import { ImageZoom } from '@/src/components/Image/ImageZoom';

import { BannerImage } from '../Image/BannerImage';
import { BaseImage } from '../Image/BaseImage';

const components: MDXComponents = {
  img: ({ src, alt }) => {
    return <BaseImage src={src} alt={alt} zoomable />;
  },
  BannerImage,
};

export function MDXBody(props: { children: string }) {
  const { children } = props;
  const Component = useMDXComponent(children);
  return (
    <>
      <Component components={components as any} />
      <ImageZoom />
    </>
  );
}
