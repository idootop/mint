// Markdown
import 'github-markdown-css/github-markdown-light.css';
import './markdown.css';
import './highlight.css';

import type { MDXComponents } from 'mdx/types';
import { useMDXComponent } from 'next-contentlayer/hooks';

import { BannerImage } from '../Image/BannerImage';
import { BaseImage } from '../Image/BaseImage';

const components: MDXComponents = {
  img: ({ src, alt }) => {
    return <BaseImage src={src} alt={alt} />;
  },
  BannerImage,
};

export function MDXBody(props: { children: string }) {
  const { children } = props;
  const Component = useMDXComponent(children);
  return (
    <article
      id="markdown"
      className="markdown-body"
      style={{
        padding: '24px 0',
      }}
    >
      <Component components={components as any} />
    </article>
  );
}
