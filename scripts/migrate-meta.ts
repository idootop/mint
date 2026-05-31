/**
 * 一次性迁移脚本（迁移完成后可删除）：
 * 把每个 content.mdx 顶部的 `import cover ...` 与 `export const metadata = {...}`
 * 抽到同目录的 meta.ts，并从 content.mdx 中移除，使正文与元数据解耦。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const kRoot = process.cwd();

const findContentMdx = async (dir: string) => {
  const root = path.join(kRoot, dir);
  if (!existsSync(root)) {
    return [];
  }
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name === 'content.mdx')
    .map((e) => path.join(e.parentPath, e.name));
};

const migrate = (filePath: string) => {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  const startIdx = lines.findIndex((l) =>
    l.startsWith('export const metadata'),
  );
  if (startIdx < 0) {
    return false; // 已迁移或无元数据（如 about）
  }
  // 元数据块结束于首个独占一行的 `};`
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '};');
  if (endIdx < 0) {
    throw new Error(`未找到 metadata 结束行: ${filePath}`);
  }

  // metadata 块之前的 import 行（仅 cover），归入 meta.ts
  const headerImports = lines
    .slice(0, startIdx)
    .filter((l) => l.startsWith('import '));
  const metadataBlock = lines.slice(startIdx, endIdx + 1);

  const metaParts: string[] = [];
  if (headerImports.length) {
    metaParts.push(headerImports.join('\n'), '');
  }
  metaParts.push(metadataBlock.join('\n'), '');
  const metaContent = metaParts.join('\n');

  // 正文：metadata 块之后的内容，去掉开头多余空行
  let body = lines.slice(endIdx + 1);
  while (body.length && body[0].trim() === '') {
    body = body.slice(1);
  }
  const bodyContent = `${body.join('\n').replace(/\s+$/, '')}\n`;

  const metaPath = path.join(path.dirname(filePath), 'meta.ts');
  writeFileSync(metaPath, metaContent);
  writeFileSync(filePath, bodyContent);
  return true;
};

const main = async () => {
  const files = [
    ...(await findContentMdx('app/posts')),
    ...(await findContentMdx('app/projects')),
  ];
  let migrated = 0;
  for (const file of files) {
    if (migrate(file)) {
      migrated++;
      console.log(`✅ ${path.relative(kRoot, file)}`);
    }
  }
  console.log(`\n迁移完成：${migrated}/${files.length}`);
};

main();
