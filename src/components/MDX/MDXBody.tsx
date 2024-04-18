// Markdown
import './styles/markdown.css';
import './styles/prism.css';
import './styles/highlight.css';

export function MDXBody({ children }) {
  return <article className="markdown-body">{children}</article>;
}
