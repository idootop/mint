export const isLocalAsset = (s): s is string => {
  return s?.startsWith('/public');
};

/**
 * 从 /public/xxx 到 /xxx
 */
export const resolveLocalPath = src => {
  if (isLocalAsset(src)) {
    src = src.substring(7);
  }
  return src;
};
