import configMDX from '@next/mdx';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

import { nextFileLoader } from './scripts/next-file-loader.mjs';

/** @type {import('@next/mdx').NextMDXOptions} */
const mdxConfig = {
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
    remarkRehypeOptions: { footnoteLabel: '备注' },
  },
};
const withMDX = configMDX(mdxConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  webpack(config, options) {
    config.module.rules.push(
      nextFileLoader({
        config,
        options,
        test: /\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)$/i,
        outputPath: '/static/media/[name].[hash:8].[ext]',
      }),
    );
    return config;
  },
};

export default withMDX(nextConfig);
