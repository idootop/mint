import { deleteFile, getFiles, readJSON } from '../core/utils/io';
import {
  kImageCachePath,
  kImageCompressionDir,
  kImageDownloadDir,
  kPublicDir,
} from './rehype-image-process';

async function main() {
  if (process.env.RUNTIME === 'vercel') {
    return; // 在 vercel 上部署时，无需再重复删除
  }
  const { downloads = [], compressions = [] } =
    (await readJSON(kImageCachePath)) ?? {};
  const downloadsMap = downloads.reduce((pre, v) => {
    pre[v] = true;
    return pre;
  }, {} as any);
  for (const file of await getFiles(`${kPublicDir}/${kImageDownloadDir}`)) {
    if (!downloadsMap[file.split('.')[0]]) {
      const filePath = `${kPublicDir}/${kImageDownloadDir}/${file}`;
      deleteFile(filePath);
      console.log('❌ 已删除：' + filePath);
    }
  }
  const compressionsMap = compressions.reduce((pre, v) => {
    pre[v] = true;
    return pre;
  }, {} as any);
  for (const file of await getFiles(`${kPublicDir}/${kImageCompressionDir}`)) {
    if (!compressionsMap[file.split('.')[0]]) {
      const filePath = `${kPublicDir}/${kImageCompressionDir}/${file}`;
      deleteFile(filePath);
      console.log('❌ 已删除：' + filePath);
    }
  }
  await deleteFile(kImageCachePath);
}

main();
