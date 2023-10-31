// Markdown
import './markdown.css';
import './prism.css';
import './highlight.css';

import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { useMDXComponent } from 'next-contentlayer/hooks';

import { CodeCard } from '../Code/CodeCard';
import { BannerImage } from '../Image/BannerImage';
import { BaseImage } from '../Image/BaseImage';

const components: MDXComponents = {
  a: ({ href, children }) => {
    return (
      <Link href={href ?? '#'} target="_blank">
        {children}
      </Link>
    );
  },
  img: ({ src, alt }) => {
    return <BaseImage src={src} alt={alt} />;
  },
  pre: ({ children }) => {
    return <CodeCard>{children}</CodeCard>;
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
