import { deleteFile, getFiles, readJSON } from '@/common/utils/io';
import {
  type ImageCache,
  kCompressionDir,
  kDownloadDir,
  kImageCachePath,
  kPublicDir,
} from '@/utils/image';

async function main() {
  const { downloads = [], compressions = [] } = await getImageCaches();
  await deleteUnusedImages(kDownloadDir, downloads);
  await deleteUnusedImages(kCompressionDir, compressions);
  await deleteFile(kImageCachePath);
}

const getImageCaches = async () => {
  const downloads: string[] = [];
  const compressions: string[] = [];
  const caches: Record<string, ImageCache> =
    (await readJSON(kImageCachePath)) ?? {};
  for (const cache of Object.values(caches)) {
    const { downloads: d, compressions: c } = cache.metadata;
    if (d) {
      downloads.push(d.src);
    }
    if (c) {
      compressions.push(c.src);
    }
  }
  return { downloads, compressions };
};

const deleteUnusedImages = async (dir: string, images: string[]) => {
  const imageMap = images.reduce((pre, v) => {
    pre[v] = true;
    return pre;
  }, {} as any);
  for (const file of await getFiles(`${kPublicDir}/${dir}`)) {
    if (!imageMap[`/${dir}/${file}`]) {
      const filePath = `${kPublicDir}/${dir}/${file}`;
      deleteFile(filePath);
      console.log(`❌ 已删除: ${filePath}`);
    }
  }
};

main();
