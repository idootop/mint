import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { deleteFile, getFiles, kRoot } from '@/common/utils/io';
import { kCompressionDir, kPublicDir } from '@/utils/image';

const kOutDir = 'out';

/**
 * 清理无用的压缩图片
 *
 * 压缩图文件名为「原图内容的 sha256」。构建产物（out/）的 html / RSC 文本里
 * 包含了真正被引用的压缩图路径，扫描这些引用即可还原“仍在使用”的集合。
 * 据此删除集合之外的文件——既清理产物 out/compressions，也清理源 public/
 * compressions，从而在源码删除图片引用（但未删原图）后也能正确回收压缩图。
 */
const cleanupUnusedCompressions = async () => {
  const outDir = path.join(kRoot, kOutDir);
  if (!existsSync(outDir)) {
    return;
  }
  // 1. 扫描构建产物，收集被引用的压缩图文件名
  const referenced = new Set<string>();
  const pattern = /compressions\/([0-9a-f]{64}\.webp)/g;
  const entries = await readdir(outDir, {
    recursive: true,
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (
      !['.html', '.txt', '.rsc'].includes(
        path.extname(entry.name).toLowerCase(),
      )
    ) {
      continue;
    }
    const content = await readFile(
      path.join(entry.parentPath, entry.name),
      'utf8',
    );
    for (const match of content.matchAll(pattern)) {
      referenced.add(match[1]);
    }
  }
  // 2. 删除产物与源里未被引用的压缩图
  for (const baseDir of [
    `${kOutDir}/${kCompressionDir}`,
    `${kPublicDir}/${kCompressionDir}`,
  ]) {
    if (!existsSync(path.join(kRoot, baseDir))) {
      continue;
    }
    for (const file of await getFiles(baseDir)) {
      if (!referenced.has(file)) {
        const filePath = `${baseDir}/${file}`;
        deleteFile(filePath);
        console.log(`❌ 已删除无用压缩图: ${filePath}`);
      }
    }
  }
};

cleanupUnusedCompressions();
