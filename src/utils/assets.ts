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
 * - /public/file -> /public/file
 *   - /_next/static/file -> .next/static/file
 *      - /file -> /public/file
 */
export const assetURL2LocalPath = (src) => {
  if (isInternalAsset(src)) {
    if (src.startsWith('/public/')) {
      // /public/file -> /public/file
    } else if (src.startsWith('/_next/static/')) {
      // /_next/static/file -> .next/static/file
      src = src.replace('/_next/static/', '/.next/static/');
    } else if (src.startsWith('/')) {
      // /file -> /public/file
      src = `/public${src}`;
    } else {
      // Unknown
      src = undefined;
    }
  } else {
    src = undefined;
  }
  if (src) {
    src = process.cwd() + src;
  }
  return src;
};
