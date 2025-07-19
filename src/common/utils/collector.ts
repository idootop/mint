import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { toSet } from './base';
import { readJSON, writeJSON } from './io';

export class FileBasedCollector<T = any> {
  private filePath: string;
  private lockPath: string;
  private byKey?: (e: T) => any;
  private buffer: T[] = [];
  private isDestroyed = false;
  private static registeredCollectors = new Set<FileBasedCollector<any>>();

  constructor(name: string = 'items', byKey?: (e: T) => any) {
    const dir = '.next/collectors';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.byKey = byKey;
    this.filePath = path.join(dir, `${name}.json`);
    this.lockPath = path.join(dir, `${name}.lock`);

    FileBasedCollector.registeredCollectors.add(this);

    if (FileBasedCollector.registeredCollectors.size === 1) {
      this.registerGlobalFlushHandler();
    }
  }

  addItem(item: T): void {
    if (this.isDestroyed) return;
    this.buffer.push(item);
  }

  addItems(items: T[]): void {
    if (this.isDestroyed) return;
    this.buffer.push(...items);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const itemsToFlush = [...this.buffer];
    this.buffer = [];

    await this.withLock(async () => {
      const existing = await this.readItems();
      const updated = toSet([...existing, ...itemsToFlush], this.byKey);
      await writeJSON(this.filePath, updated);
    });
  }

  // 获取所有项目（包括缓冲区中的）
  async getAllItems(): Promise<T[]> {
    const fileItems = await this.readItems();
    const allItems = toSet([...fileItems, ...this.buffer], this.byKey);
    return allItems;
  }

  // 获取缓冲区状态
  getBufferStatus(): { size: number; isEmpty: boolean } {
    return {
      size: this.buffer.length,
      isEmpty: this.buffer.length === 0,
    };
  }

  async clear(): Promise<void> {
    this.buffer = [];
    await this.withLock(async () => {
      await writeJSON(this.filePath, []);
    });
  }

  // 销毁收集器
  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    FileBasedCollector.registeredCollectors.delete(this);
  }

  private async readItems(): Promise<T[]> {
    try {
      if (!existsSync(this.filePath)) {
        return [];
      }
      const data = await readJSON(this.filePath);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  private async withLock(fn: () => Promise<void>): Promise<void> {
    const maxRetries = 50; // 5秒超时

    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.writeFile(this.lockPath, process.pid.toString(), {
          flag: 'wx',
        });

        try {
          await fn();
        } finally {
          if (existsSync(this.lockPath)) {
            await fs.unlink(this.lockPath);
          }
        }
        return;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          await this.sleep(100);
          continue;
        }
        throw error;
      }
    }

    throw new Error('获取锁超时');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 注册全局刷新处理器
  private registerGlobalFlushHandler(): void {
    const flushAllCollectors = async () => {
      const flushPromises = Array.from(FileBasedCollector.registeredCollectors)
        .filter((collector) => !collector.isDestroyed)
        .map(async (collector) => {
          try {
            await collector.flush();
          } catch {}
        });

      await Promise.all(flushPromises);
    };

    process.on('SIGINT', async () => {
      await flushAllCollectors();
      process.exit(0);
    });
  }

  static async flushAll(): Promise<void> {
    const flushPromises = Array.from(FileBasedCollector.registeredCollectors)
      .filter((collector) => !collector.isDestroyed)
      .map((collector) => collector.flush());

    await Promise.all(flushPromises);
  }

  static getAllStatus(): Array<{ size: number; isEmpty: boolean }> {
    return Array.from(FileBasedCollector.registeredCollectors)
      .filter((collector) => !collector.isDestroyed)
      .map((collector) => collector.getBufferStatus());
  }
}
