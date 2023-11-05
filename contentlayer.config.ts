import {
  ComputedFields,
  defineDocumentType,
  FieldDefs,
  makeSource,
} from 'contentlayer/source-files';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

import {
  processCoverImage,
  rehypeImageProcess,
} from './scripts/rehype-image-process';

const mdxConfig = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypePrism, rehypeImageProcess],
};

const baseFields: FieldDefs = {
  title: {
    type: 'string',
    required: true,
  },
  description: {
    type: 'string',
  },
  cover: {
    type: 'string',
  },
};

const baseComputedFields: ComputedFields = {
  slug: {
    type: 'string',
    resolve: doc => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: 'string',
    resolve: doc => doc._raw.flattenedPath.split('/').slice(1).join('/'),
  },
  description: {
    type: 'string',
    resolve: doc => doc.description ?? doc.title,
  },
  cover: {
    type: 'string',
    resolve: doc => processCoverImage(doc.cover),
  },
};

export const Page = defineDocumentType(() => ({
  name: 'Page',
  filePathPattern: `pages/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    ...baseFields,
  },
  computedFields: {
    ...baseComputedFields,
  },
}));

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    ...baseFields,
    date: {
      type: 'string',
      required: true,
    },
    update: {
      type: 'string',
    },
  },
  computedFields: {
    ...baseComputedFields,
    update: {
      type: 'string',
      resolve: doc => doc.update ?? doc.date,
    },
  },
}));

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Page, Post],
  mdx: mdxConfig,
});
