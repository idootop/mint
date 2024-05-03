import configMDX from '@next/mdx';
import withVideos from 'next-videos';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

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
};

export default withMDX(withVideos(nextConfig));
