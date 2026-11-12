/**
 * 为构建产物 out/ 生成文件 hash 清单（manifest）。
 *
 * 用途：部署到对象存储时，先读取云端上一版的清单，比对后只上传内容真正变化
 * 的文件——文件名带 hash 的静态资源本来就不会重复，但图片、RSC 载荷这类
 * 同名文件每次全量覆盖很浪费，靠清单可以跳过。
 *
 * 产物：out/manifest.json
 *   {
 *     "version": 1,
 *     "generatedAt": "2026-11-11T14:00:00.000Z",
 *     "files": { "index.html": "sha256:...", "images/a.png": "sha256:..." }
 *   }
 *
 * 清单本身也参与上传（不过不放进 files 映射里，避免自我引用）。
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { BuildTask } from './run-tasks';

const kOutDir = 'out';
const kManifestName = 'manifest.json';
/** 清单里记录的文件在 COS 上的 key 前缀，部署脚本据此定位 */
const kManifestVersion = 1;

/** 不该出现在产物里的文件（macOS 系统垃圾等） */
const isIgnored = (relative: string) =>
  relative
    .split('/')
    .some(
      (segment) =>
        segment === '.DS_Store' ||
        segment === 'Thumbs.db' ||
        segment === '.gitkeep',
    );

const hashFile = (file: string) =>
  new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(file);
    stream.once('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.once('end', () => resolve(`sha256:${hash.digest('hex')}`));
  });

const collect = async (root: string) => {
  const files: Record<string, string> = {};
  const walk = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(absolute);
          return;
        }
        if (!entry.isFile()) {
          return;
        }
        const relative = path
          .relative(root, absolute)
          .split(path.sep)
          .join('/');
        // 清单自身不入表，避免自引用；系统垃圾文件也不记录（部署时同样会跳过）
        if (relative === kManifestName || isIgnored(relative)) {
          return;
        }
        files[relative] = await hashFile(absolute);
      }),
    );
  };
  await walk(root);
  return files;
};

const manifest = async () => {
  const root = path.join(process.cwd(), kOutDir);
  const files = await collect(root);
  const sorted = Object.fromEntries(
    Object.keys(files)
      .sort()
      .map((key) => [key, files[key]]),
  );
  const manifest = {
    version: kManifestVersion,
    generatedAt: new Date().toISOString(),
    files: sorted,
  };
  await writeFile(
    path.join(root, kManifestName),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  const count = Object.keys(sorted).length;
  console.log(`✅ ${kOutDir}/${kManifestName}（${count} 个文件）`);
};

export const manifestTask: BuildTask = {
  name: '生成产物 hash 清单（manifest.json）',
  run: manifest,
};
