import configMDX from '@next/mdx';
import type { NextConfig } from 'next';
import createNextFileLoader from 'next-file-loader';

const withNextFileLoader = createNextFileLoader(
  [
    {
      test: /\.(mp4|webm|mkv|ogv|wmv|avi|mov|flv|m4v|3gp)$/i,
      outputPath: 'static/videos/[name].[hash:8].[ext]',
    },
    {
      test: /\.(mp3|wav|flac|ogg|aac|m4a|wma|ape)$/i,
      outputPath: 'static/audios/[name].[hash:8].[ext]',
    },
    {
      test: /\.(glb|gltf)$/i,
      outputPath: 'static/models/[name].[hash:8].[ext]',
    },
  ],
  { ignoreWarnings: true },
);

const withMDX = configMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [['remark-gfm']],
    rehypePlugins: [['rehype-prism-plus']],
    remarkRehypeOptions: { footnoteLabel: '备注' },
  },
});

const nextConfig: NextConfig = {
  output: 'export',
  // buildId 会内联进每个 HTML/RSC 产物。Next 默认每次构建都用随机值，
  // 会让全站文件内容变化、增量部署失效。固定后产物可复现；
  // 缓存是否失效由各文件自身内容决定（HTML 走 no-cache，_next/static 走内容哈希）。
  generateBuildId: () => 'mint',
  images: { unoptimized: true },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

export default withMDX(withNextFileLoader(nextConfig));
