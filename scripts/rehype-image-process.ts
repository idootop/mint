import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import download from 'download';
import sharp from 'sharp';
import { visit } from 'unist-util-visit';

import { toSet } from '../core/utils/base';
import { deleteFile, readJSON, writeJSON } from '../core/utils/io';
import { isLocalAsset, resolveLocalPath } from '../src/utils/assets';

export const kImageCachePath = '.imagecache';
export const kPublicDir = 'public';
export const kImageDownloadDir = 'downloads';
export const kImageCompressionDir = 'compressions';

let imageCaches;
export const addImageCache = async (
  checksum: string,
  type: 'downloads' | 'compressions',
) => {
  if (!imageCaches) {
    imageCaches = (await readJSON(kImageCachePath)) ?? {
      downloads: [],
      compressions: [],
    };
  }
  imageCaches[type] = toSet([...imageCaches[type], checksum]);
  return await writeJSON(kImageCachePath, imageCaches);
};

const kRootDir = process.cwd();

export const processCoverImage = async cover => {
  const res = await processImage({
    properties: {
      src: cover,
    },
  });
  return res?.properties?.src ?? cover;
};

const isReactImage = node => {
  return (
    node.type === 'mdxJsxFlowElement' &&
    node.attributes?.some(e => e.name === 'src' && e.value)
  );
};

export const rehypeImageProcess = () => {
  deleteFile(kImageCachePath);
  return async (tree, file, next) => {
    const tasks: Promise<void>[] = [];
    visit(tree, ['element', 'mdxJsxFlowElement'], node => {
      if (
        isReactImage(node) ||
        (node.tagName === 'img' && node.properties?.src)
      ) {
        tasks.push(processImage(node));
      }
    });
    await Promise.all(tasks).catch(() => undefined);
    next();
  };
};

const processImage = async _image => {
  let image;
  if (isReactImage(_image)) {
    const srcAttribute = _image.attributes.find(
      e => e.name === 'src' && e.value,
    );
    image = { properties: { src: srcAttribute.value } };
  } else {
    image = _image;
  }

  if (!image.properties?.src) {
    return;
  }
  const imgPath = await getImageData(image);
  if (!imgPath) {
    return;
  }
  const { data, checksum, targetPath } = imgPath;

  const imgProps = await getImageProps(data, targetPath);
  if (!imgProps) {
    return;
  }
  const compressedImgProps = await compressImage(imgProps, checksum);
  if (!image.properties) {
    image.properties = {};
  }
  image.properties = {
    ...image.properties,
    ...imgProps.properties,
    ...compressedImgProps,
  };
  if (isReactImage(_image)) {
    for (const [key, value] of Object.entries(image.properties)) {
      const attribute = _image.attributes.find(e => e.name === key);
      if (attribute) {
        attribute.value = value;
      } else {
        _image.attributes.push({
          type: 'mdxJsxAttribute',
          name: key,
          value,
        });
      }
    }
  }
  return image;
};

const compressImage = async (image, checksum) => {
  const { data, format, size } = image;
  const sharpImage = await sharp(data);
  const targetPath = path.join('/' + kImageCompressionDir, checksum + '.webp');
  const fullPath = path.join(kRootDir, kPublicDir, targetPath);
  if (size < 100) {
    // 不需要压缩 100 KB 以下的图片
    // console.log(`✅ 图片无需压缩 ${image.properties.src}`);
    return {};
  }
  if (['gif', 'webp', 'svg'].includes(format)) {
    // 不需要压缩的图片类型
    // console.log(`✅ 图片无需压缩 ${image.properties.src}`);
    return {};
  }
  let width, height;
  if (!existsSync(fullPath)) {
    const w = image.properties.width > 1024 ? 1024 : undefined;
    const h = image.properties.height > 1024 ? 1024 : undefined;
    // 压缩图片
    const buffer = await sharpImage
      .webp({ quality: 75 })
      .resize(w, h, { fit: 'inside' })
      .toBuffer();
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    // 重新读取压缩后图片的尺寸
    const m = await sharp(buffer).metadata();
    width = m.width;
    height = m.height;
  } else {
    // 重新读取压缩后图片的尺寸
    const buffer = await readFile(fullPath);
    const m = await sharp(buffer).metadata();
    width = m.width;
    height = m.height;
  }
  // console.log(`✅ 图片已压缩 ${fullPath}`);
  await addImageCache(checksum, 'compressions');
  return {
    width,
    height,
    src: targetPath,
  };
};

const getImageData = async image => {
  // 只保留 /public 之后的相对路径
  let targetPath: string = image.properties.src;
  let fullPath = kRootDir;
  let checksum = '';
  let data;
  if (isLocalAsset(targetPath)) {
    // 本地图片
    targetPath = resolveLocalPath(targetPath);
    fullPath = path.join(kRootDir, kPublicDir, targetPath);
    try {
      data = await readFile(fullPath);
    } catch (_) {
      return;
    }
    checksum = await checksumFile(data);
  } else {
    // 网络图片
    checksum = await hashSha256(targetPath);
    // 无论原始图片是什么格式，一律使用 .webp 扩展名（方便预览图片内容）
    targetPath = path.join('/' + kImageDownloadDir, checksum + '.webp');
    fullPath = path.join(kRootDir, kPublicDir, targetPath);
    if (!existsSync(fullPath)) {
      // 下载图片到本地
      console.log(`🔥 开始下载图片 ${image.properties.src}`);
      try {
        data = await download(image.properties.src, {
          retry: 3,
          decompress: true,
          followRedirect: true,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0',
            Referer: new URL(image.properties.src).origin,
          },
        });
        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, data);
        console.log(`✅ 图片下载成功 ${image.properties.src}`);
      } catch (error) {
        console.log(`❌ 图片下载失败 ${image.properties.src}\n`, error);
        return;
      }
    } else {
      data = await readFile(fullPath);
    }
    await addImageCache(checksum, 'downloads');
  }
  return {
    data,
    checksum,
    targetPath,
    fullPath,
  };
};

const getImageProps = async (data, targetPath: string) => {
  const sharpImage = await sharp(data);
  const { width, height, format, size = 0 } = await sharpImage.metadata();
  if (!width || !height) {
    console.log('❌ 获取图片尺寸失败', targetPath);
    return null;
  }
  return {
    size: size / 1024, //KB
    data,
    format,
    properties: {
      width,
      height,
      src: targetPath,
      placeholder: 'blur',
      blurDataURL: await createBlurDataURL(sharpImage, width, height),
    },
  };
};

const createBlurDataURL = async (image: sharp.Sharp, width, height) => {
  const imgAspectRatio = width / height;
  const placeholderImgWidth = 8;
  const placeholderImgHeight = Math.round(placeholderImgWidth / imgAspectRatio);

  return image
    .resize(placeholderImgWidth, placeholderImgHeight)
    .png({
      quality: 75,
    })
    .toBuffer()
    .then(buffer => `data:image/png;base64,${buffer.toString('base64')}`);
};

const hashSha256 = async (dataOrString: string | Buffer) => {
  if (typeof dataOrString === 'string') {
    dataOrString = Buffer.from(dataOrString, 'utf8');
  }
  return crypto.createHash('sha256').update(dataOrString).digest('hex');
};

const checksumFile = async (filePathOrData: Buffer | string) => {
  if (typeof filePathOrData === 'string') {
    try {
      // 尝试获取本地文件文件 hash
      return checksumFile(await readFile(filePathOrData));
    } catch (_) {
      // 读取本地文件失败，可能是文件不存在
      return filePathOrData;
    }
  }
  // 获取本地文件文件 hash
  return hashSha256(filePathOrData);
};
