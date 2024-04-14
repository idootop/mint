import fs from 'fs';
import path from 'path';
import { lock, unlock } from 'proper-lockfile';

import { jsonDecode, jsonEncode } from './base';

export const kRoot = process.cwd();

export const kEnvs = process.env as any;

export const exists = (filePath: string) => fs.existsSync(filePath);

export const deleteFile = (filePath: string) => {
  try {
    fs.rmSync(filePath);
    return true;
  } catch {
    return false;
  }
};

export const lockFile = async path => {
  return lock(path, {
    realpath: false,
    retries: { retries: 100, minTimeout: 10, maxTimeout: 100 },
  }).catch(() => {});
};

export const unlockFile = async path => {
  return unlock(path, { realpath: false }).catch(() => {});
};

export const withLockFile = async (path: string, fn: VoidFunction) => {
  let result;
  try {
    await lockFile(path);
    result = await fn();
  } finally {
    await unlockFile(path);
  }
  return result;
};

export const readFile = async <T = any>(
  filePath: string,
  options?: fs.WriteFileOptions,
) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    return undefined;
  }
  const result = await new Promise<T | undefined>(resolve => {
    fs.readFile(filePath, options, (err, data) => {
      resolve(err ? undefined : (data as any));
    });
  });
  return result;
};

export const writeFile = async (
  filePath: string,
  data?: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions,
) => {
  if (!data) {
    return false;
  }
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  const result = await new Promise<boolean>(resolve => {
    if (options) {
      fs.writeFile(filePath, data, options, err => {
        resolve(err ? false : true);
      });
    } else {
      fs.writeFile(filePath, data, err => {
        resolve(err ? false : true);
      });
    }
  });
  return result;
};

export const readString = (filePath: string) =>
  readFile<string>(filePath, 'utf8');

export const writeString = (filePath: string, content: string) =>
  writeFile(filePath, content, 'utf8');

export const readJSON = async (filePath: string) =>
  jsonDecode(await readFile<string>(filePath, 'utf8'));

export const writeJSON = (filePath: string, content: any) =>
  writeFile(filePath, jsonEncode(content) ?? '', 'utf8');

export const getFiles = (dir: string) => {
  return new Promise<string[]>(resolve => {
    fs.readdir(dir, (err, files) => {
      resolve(err ? [] : files);
    });
  });
};
