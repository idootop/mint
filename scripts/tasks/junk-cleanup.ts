import { existsSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { kRoot } from '@/common/utils/io';

import type { BuildTask } from './run-tasks';

const kOutDir = 'out';

/**
 * 产物里不该存在的系统垃圾文件
 *
 * 主要是 macOS 在浏览目录时自动生成的 .DS_Store，Windows 的 Thumbs.db，
 * 以及占位用的 .gitkeep。它们会跟着产物一起被部署：
 * - Dokploy 打包整个 out/，会把这些文件一并传给 Dokploy
 * - FTP / COS 靠清单增量，本来就不会传（manifest 里已忽略），
 *   但产物干净一点总是好的，也省得各条链路各写一份排除规则
 */
const kJunkFiles = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);

const removeJunk = async () => {
  const outDir = path.join(kRoot, kOutDir);
  if (!existsSync(outDir)) {
    return 0;
  }

  const entries = await readdir(outDir, {
    recursive: true,
    withFileTypes: true,
  });
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !kJunkFiles.has(entry.name)) {
      continue;
    }
    // Dirent 上带有父目录路径，直接拼出来就行
    const fullPath = path.join(entry.parentPath, entry.name);
    await rm(fullPath, { force: true });
    removed += 1;
  }
  return removed;
};

export const junkCleanupTask: BuildTask = {
  name: '清理系统垃圾文件',
  run: async () => {
    const removed = await removeJunk();
    if (removed > 0) {
      console.log(`🧹 清理系统垃圾文件 ${removed} 个`);
    }
  },
};
