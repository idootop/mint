declare module 'got' {
  import * as got from 'got/dist/source';

  export = got;
}

declare module '*.css';

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
