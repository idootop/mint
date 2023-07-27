import { withContentlayer } from 'next-contentlayer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  webpack: config => {
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

export default withContentlayer(nextConfig);
