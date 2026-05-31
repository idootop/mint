import { deleteFile, getFiles } from '@/common/utils/io';
import { getImageCaches, kCompressionDir, kPublicDir } from '@/utils/image';

async function main() {
  const compressions = await getUsedCompressions();
  await deleteUnusedImages(kCompressionDir, compressions);
}

const getUsedCompressions = async () => {
  const compressions: string[] = [];
  const caches = await getImageCaches();
  for (const cache of caches) {
    const { compressions: c } = cache.metadata;
    if (c) {
      compressions.push(c.src);
    }
  }
  return compressions;
};

const deleteUnusedImages = async (dir: string, usedImages: string[]) => {
  const usedImageMap = usedImages.reduce((pre, v) => {
    pre[v] = true;
    return pre;
  }, {} as any);
  const files = await getFiles(`${kPublicDir}/${dir}`);
  for (const file of files) {
    if (!usedImageMap[`/${dir}/${file}`]) {
      const filePath = `${kPublicDir}/${dir}/${file}`;
      deleteFile(filePath);
      console.log(`❌ 已删除: ${filePath}`);
    }
  }
};

main();
