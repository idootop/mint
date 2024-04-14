import configMDX from '@next/mdx';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

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
    config.plugins.push(
      new ctx.webpack.IgnorePlugin({
        resourceRegExp: /^electron$/, // download image with got
      }),
    );
    return config;
  },
};

export default withMDX(nextConfig);
