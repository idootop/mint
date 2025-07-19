import configMDX from '@next/mdx';
import createNextFileLoader from 'next-file-loader';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

const withNextFileLoader = createNextFileLoader([
  {
    test: /\.(mp4|webm|mkv|ogv|wmv|avi|mov|flv|m4v|3gp)$/i,
    outputPath: 'static/videos/[name].[hash:8].[ext]',
  },
  {
    test: /\.(mp3|wav|flac|ogg|aac|m4a|wma|ape)$/i,
    outputPath: 'static/audios/[name].[hash:8].[ext]',
  },
]);

const withMDX = configMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
    remarkRehypeOptions: { footnoteLabel: '备注' },
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

export default withMDX(withNextFileLoader(nextConfig));
