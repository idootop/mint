// Markdown
import './markdown.css';
import './prism.css';
import './highlight.css';

export function MDXBody({ children }) {
  return <article className="markdown-body">{children}</article>;
}
