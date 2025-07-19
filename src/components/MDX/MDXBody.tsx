// Markdown
import './styles/highlight.css';
import './styles/markdown.css';
import './styles/prism.css';

import { type BoxProps, getBoxProps } from '@/common/components/Box';

export function MDXBody({ children, ...rest }: BoxProps) {
  const boxProps = getBoxProps(rest);

  return (
    <article {...boxProps} className="markdown-body">
      {children}
    </article>
  );
}
