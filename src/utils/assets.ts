import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * - https://example.com/file
 * - data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==
 * - blob:https://example.com/xxxxx-xxxx-xxxx-xxx
 * - file:///C:/Users/username/Documents/file.txt
 */
export const isExternalAsset = (url: string | undefined) => {
  return (
    url?.includes('//') ||
    url?.startsWith('data:') ||
    url?.startsWith('blob:') ||
    url?.startsWith('file:')
  );
};

/**
 * - /* -> 绝对路径（非相对路径）
 * - /public/file -> public assets
 * - /_next/static/file -> import assets
 */
export const isInternalAsset = (url: string | undefined) => {
  return url?.startsWith('/') && !isExternalAsset(url);
};

/**
 * /public/file -> /file
 */
export const resolveAssetURL = (src) => {
  if (src.startsWith('/public')) {
    src = src.substring(7);
  }
  return src;
};

/**
 * Next.js 静态资源的磁盘产物目录（相对项目根目录）：
 *
 * - `next dev`（Turbopack）输出到 `.next/dev/static`
 * - `next build` 输出到 `.next/static`
 *
 * 开发环境优先命中前者，否则 `/_next/static/xxx` 会被解析到一个不存在的路径，
 * 导致图片预处理（读取宽高、生成模糊占位图、压缩）失败，图片在 dev 下无法显示。
 */
const kDevStaticDir = '.next/dev/static';
const kBuildStaticDir = '.next/static';
const kNextStaticDirs =
  process.env.NODE_ENV === 'development'
    ? [kDevStaticDir, kBuildStaticDir]
    : [kBuildStaticDir, kDevStaticDir];

/**
 * /_next/static/file -> .next/dev/static/file（dev）或 .next/static/file（build）
 */
const nextStaticAsset2LocalPath = (url: string) => {
  const root = process.cwd();
  const asset = url.replace('/_next/static/', '');
  const dir =
    kNextStaticDirs.find((dir) => existsSync(path.join(root, dir, asset))) ??
    kNextStaticDirs[0];
  return path.join(root, dir, asset);
};

/**
 * - /public/file -> /public/file
 *   - /_next/static/file -> .next/(dev/)static/file
 *      - /file -> /public/file
 */
export const assetURL2LocalPath = (src: string | undefined) => {
  if (!isInternalAsset(src)) {
    return undefined;
  }
  const url = src as string;
  if (url.startsWith('/_next/static/')) {
    return nextStaticAsset2LocalPath(url);
  }
  if (url.startsWith('/public/')) {
    // /public/file -> /public/file
    return path.join(process.cwd(), url);
  }
  // /file -> /public/file
  return path.join(process.cwd(), 'public', url);
};
