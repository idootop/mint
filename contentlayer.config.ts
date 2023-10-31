import {
  ComputedFields,
  defineDocumentType,
  makeSource,
} from 'contentlayer/source-files';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

const mdxConfig = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypePrism],
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
};

export const Page = defineDocumentType(() => ({
  name: 'Page',
  filePathPattern: `pages/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
    },
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
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
    },
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
