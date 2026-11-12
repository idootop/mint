/**
 * 清理产物里没有被引用的图片。
 *
 * 背景：文中超过 200 KB 的 jpg/png 会被压缩成 compressions/<sha256>.webp，
 * 页面引用的是压缩版；但 Next 的 loader 仍会把原图拷一份到
 * _next/static/media/<name>.<hash>.<ext>，这份从来不会被引用。
 *
 * 做法：扫描产物里所有可能出现引用的文件（html/txt/js/css/xml），
 * 把 _next/static/media 下没有出现在任何引用中的文件删掉。
 * 只动 media 目录，其余文件一概不碰。
 */
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

import type { BuildTask } from './run-tasks';

const kOutDir = 'out';
const kMediaDir = path.join(kOutDir, '_next', 'static', 'media');
/** 可能包含引用的产物类型 */
const kScanDirs = ['', '_next'];
const kScanExt = ['.html', '.txt', '.js', '.css', '.xml'];
/** 产物清单记录的是全部文件名，不能当作"引用" */
const kManifestName = '.manifest.json';

/** 递归收集需要扫描引用的文件 */
const listScanFiles = async (): Promise<string[]> => {
  const result: string[] = [];
  const walk = async (current: string) => {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // media 目录本身只放图片，不需要从中找引用
        if (path.resolve(full) === path.resolve(kMediaDir)) {
          continue;
        }
        await walk(full);
      } else if (
        entry.name !== kManifestName &&
        kScanExt.includes(path.extname(entry.name))
      ) {
        result.push(full);
      }
    }
  };
  for (const dir of kScanDirs) {
    const target = path.join(kOutDir, dir);
    try {
      await stat(target);
      await walk(target);
    } catch {
      // 目录不存在就跳过
    }
  }
  return result;
};

const cleanupOrphanMedia = async () => {
  const mediaDir = path.join(process.cwd(), kMediaDir);
  let mediaFiles: string[];
  try {
    mediaFiles = await readdir(mediaDir);
  } catch {
    console.log('⏭️  没有 _next/static/media，跳过');
    return;
  }
  if (mediaFiles.length === 0) {
    return;
  }

  const scanFiles = await listScanFiles();
  const blob = (
    await Promise.all(
      scanFiles.map((file) => readFile(file, 'utf8').catch(() => '')),
    )
  ).join('\n');

  let removed = 0;
  let bytes = 0;
  for (const name of mediaFiles) {
    if (blob.includes(name)) {
      continue;
    }
    const full = path.join(mediaDir, name);
    const size = (await stat(full)).size;
    await rm(full, { force: true });
    removed += 1;
    bytes += size;
  }
  if (removed > 0) {
    console.log(
      `💾 清理未引用的图片 ${removed} 个（${(bytes / 1024 / 1024).toFixed(1)} MB）`,
    );
  } else {
    console.log('💾 没有需要清理的图片');
  }
};

export const mediaCleanupTask: BuildTask = {
  name: '清理未引用的图片',
  run: cleanupOrphanMedia,
};
