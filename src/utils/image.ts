import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { FileBasedCollector } from '@/common/utils/collector';
import { readFile, writeFile } from '@/common/utils/io';
import { isEmpty } from '@/common/utils/is';

import { assetURL2LocalPath, isInternalAsset, resolveAssetURL } from './assets';
import { download } from './download';
import { checksumFile, hashSha256 } from './hash';

interface ImageWithData {
  src: string;
  filePath: string;
  data: Buffer;
  checksum: string;
}

interface ImageWithMetadata extends ImageWithData {
  /**
   * 图片格式
   */
  format: string;
  /**
   * 图片大小（单位：KB）
   */
  size: number;
  width: number;
  height: number;
  sharpImage: sharp.Sharp;
}

interface ImageProps {
  src: string;
  width: number;
  height: number;
  placeholder: string;
  blurDataURL: string;
}

export interface ImageCache {
  props?: ImageProps;
  metadata: {
    local?: Omit<ImageWithMetadata, 'data' | 'sharpImage'>;
    [kDownloadDir]?: Omit<ImageWithMetadata, 'data' | 'sharpImage'>;
    [kCompressionDir]?: Omit<ImageWithMetadata, 'data' | 'sharpImage'>;
  };
}

const kRootDir = process.cwd();

export const kPublicDir = 'public';
export const kDownloadDir = 'downloads';
export const kCompressionDir = 'compressions';
export const kImageCachePath = '.next/images-cache.json';

type ImageCacheInfo = ImageCache & { url: string };
const urlCollector = new FileBasedCollector<ImageCacheInfo>(
  'urls',
  (e) => e.url,
);

export const getImageCaches = () => {
  return urlCollector.getAllItems();
};

const getImageCache = async (url = '404'): Promise<ImageCache | undefined> => {
  return (await getImageCaches()).find((e) => e.url === url);
};

export const addImageCache = async (url: string, data: ImageCache) => {
  await urlCollector.addItem({ url, ...data });
};

export const processImage = async (url: string | undefined) => {
  if (!url) {
    return;
  }
  if (url.includes('img.shields.io')) {
    return { src: url };
  }
  const { props } = (await getImageCache(url)) ?? {};
  if (props) {
    return props;
  }
  const image = await downloadImage(url);
  if (!image) {
    return;
  }
  const compressedImage = await compressImage(image);
  const result = await getImageProps({
    ...image,
    ...compressedImage,
  });
  const getMetadata = (e) => {
    const { data: _, sharpImage: __, ...metadata } = e ?? {};
    return isEmpty(metadata) ? undefined : metadata;
  };
  if (result) {
    const local = getMetadata(image);
    const downloaded = local?.src?.startsWith(`/${kDownloadDir}/`)
      ? local
      : undefined;
    await addImageCache(url, {
      props: result,
      metadata: {
        local,
        [kDownloadDir]: downloaded,
        [kCompressionDir]: getMetadata(compressedImage),
      },
    });
  }
  return result;
};

const getImageMetadata = async (
  img: ImageWithData,
  data?: Buffer,
): Promise<ImageWithMetadata | undefined> => {
  if (!data) {
    return;
  }
  const sharpImage = await sharp(data);
  const {
    width,
    height,
    format = 'webp',
    size = 0,
  } = await sharpImage.metadata();
  if (!width || !height) {
    return;
  }
  return {
    ...img,
    data,
    format,
    size: size / 1280, //KB
    width,
    height,
    sharpImage,
  };
};

const downloadImage = async (
  url: string,
): Promise<ImageWithMetadata | undefined> => {
  let src: string;
  let filePath: string;
  let data: Buffer | undefined;
  let checksum: string | undefined;
  if (isInternalAsset(url)) {
    // 本地图片
    src = resolveAssetURL(url);
    filePath = assetURL2LocalPath(src);
    data = await readFile(filePath);
    checksum = await checksumFile(data);
  } else {
    // 网络图片
    checksum = await hashSha256(url);
    src = path.join('/', kDownloadDir, `${checksum}.webp`);
    filePath = path.join(kRootDir, kPublicDir, src);
    if (!existsSync(filePath)) {
      // 下载图片到本地
      data = await download(url);
      const saved = await writeFile(filePath, data);
      if (!saved) {
        return;
      }
    } else {
      data = await readFile(filePath);
    }
  }
  if (!data || !checksum) {
    return;
  }
  return getImageMetadata({ src, filePath, data, checksum }, data);
};

const compressImage = async (
  img: ImageWithMetadata,
): Promise<ImageWithMetadata | undefined> => {
  const newImage = { ...img };
  const { checksum, format, size, sharpImage } = newImage;
  if (size < 200) {
    // 不需要压缩 200 KB 以下的图片
    return;
  }
  if (['gif', 'webp', 'svg'].includes(format)) {
    // 不需要压缩的图片类型
    return;
  }
  const src = path.join(`/${kCompressionDir}`, `${checksum}.webp`);
  const filePath = path.join(kRootDir, kPublicDir, src);
  newImage.src = src;
  newImage.filePath = filePath;
  let compressedImageData: Buffer | undefined;
  if (!existsSync(filePath)) {
    const w = newImage.width > 1280 ? 1280 : undefined;
    const h = newImage.height > 1280 ? 1280 : undefined;
    // 压缩图片
    compressedImageData = await sharpImage
      .webp({ quality: 75 })
      .resize(w, h, { fit: 'inside' })
      .toBuffer();
    const saved = await writeFile(filePath, compressedImageData);
    if (!saved) {
      // 保存图片失败
      return;
    }
  } else {
    // 重新读取压缩后的图片
    compressedImageData = await readFile(filePath);
  }
  return getImageMetadata(newImage, compressedImageData);
};

const getImageProps = async (img: ImageWithMetadata) => {
  return {
    src: img.src,
    width: img.width,
    height: img.height,
    placeholder: 'blur',
    blurDataURL: await createBlurDataURL(img),
  };
};

const createBlurDataURL = async (img: ImageWithMetadata) => {
  const imgAspectRatio = img.width / img.height;
  const placeholderImgWidth = 8;
  const placeholderImgHeight = Math.round(placeholderImgWidth / imgAspectRatio);
  return img.sharpImage
    .resize(placeholderImgWidth, placeholderImgHeight)
    .png({ quality: 75 })
    .toBuffer()
    .then((buffer) => `data:image/png;base64,${buffer.toString('base64')}`);
};
