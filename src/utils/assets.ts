export const isLocalAsset = (s): s is string => {
  return s?.startsWith('/public') || !s.includes('//');
};

/**
 * 从 /public/xxx 到 /xxx
 */
export const resolveLocalPath = src => {
  if (isLocalAsset(src)) {
    if (src.startsWith('/public')) {
      src = src.substring(7);
    }
  }
  return src;
};
