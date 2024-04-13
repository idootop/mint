import configMDX from '@next/mdx';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

// import { rehypeImageProcess } from './scripts/rehype-image-process';

const withMDX = configMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  webpack: (config, ctx) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    config.plugins.push(
      new ctx.webpack.IgnorePlugin({
        resourceRegExp: /^electron$/,
      }),
    );
    return config;
  },
};

export default withMDX(nextConfig);
