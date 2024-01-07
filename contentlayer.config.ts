import {
  ComputedFields,
  defineDocumentType,
  FieldDefs,
  makeSource,
} from 'contentlayer/source-files';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

import {
  processImage,
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
  date: {
    type: 'string',
    required: true,
  },
  hide: {
    type: 'boolean',
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
  cover: {
    type: 'string',
    resolve: async doc => (await processImage(doc.cover)).src,
  },
};

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    ...baseFields,
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

export const Project = defineDocumentType(() => ({
  name: 'Project',
  filePathPattern: `projects/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    ...baseFields,
    emoji: {
      type: 'string',
      required: true,
    },
    // 项目地址
    url: {
      type: 'string',
    },
    // 分类
    category: {
      type: 'string',
    },
  },
  computedFields: {
    ...baseComputedFields,
    // 是否有详情页面
    hasDetail: {
      type: 'boolean',
      resolve: doc => doc.body.raw.includes('#'),
    },
  },
}));

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Post, Project],
  mdx: mdxConfig,
});
