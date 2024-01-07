import { withContentlayer } from 'next-contentlayer';

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

export default withContentlayer(nextConfig);
