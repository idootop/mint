// Markdown
import './markdown.css';
import './prism.css';
import './highlight.css';

import type { MDXComponents } from 'mdx/types';
import { useMDXComponent } from 'next-contentlayer/hooks';

import { CodeCard } from '../Code/CodeCard';
import { BannerImage } from '../Image/BannerImage';
import { BaseImage } from '../Image/BaseImage';
import { LinkExternal } from './LinkExternal';

const components: MDXComponents = {
  a: LinkExternal,
  img: BaseImage,
  BannerImage,
  pre: ({ children }) => {
    return <CodeCard>{children}</CodeCard>;
  },
};

export function MDXBody(props: { children: string }) {
  const { children } = props;
  const Component = useMDXComponent(children);
  return (
    <article className="markdown-body">
      <Component components={components as any} />
    </article>
  );
}
