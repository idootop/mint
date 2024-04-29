// Markdown
import './styles/markdown.css';
import './styles/prism.css';
import './styles/highlight.css';

import { BoxProps, getBoxProps } from '@/common/components/Box';

export function MDXBody({ children, ...rest }: BoxProps) {
  const boxProps = getBoxProps(rest);
  return (
    <article {...boxProps} className="markdown-body">
      {children}
    </article>
  );
}
