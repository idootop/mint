import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

interface TaskResult<T> {
  status: 'running' | 'completed' | 'failed';
  result?: T;
  error?: string;
  workerId: string;
  timestamp: number;
  pid: number;
}

interface LockInfo {
  workerId: string;
  pid: number;
  timestamp: number;
}

export class FileBasedTaskManager {
  private workerId: string;
  private lockDir: string;
  private resultDir: string;
  private lockTimeout: number = 300000; // 5分钟锁超时
  private initialized: boolean = false;

  constructor(baseDir: string = '.next/shared-tasks') {
    this.workerId = `worker-${process.pid}-${Date.now()}`;
    this.lockDir = path.join(baseDir, 'locks');
    this.resultDir = path.join(baseDir, 'results');
  }

  private ensureDirectories(): void {
    if (this.initialized) return;

    try {
      // 同步创建目录，避免竞态条件
      if (!existsSync(this.lockDir)) {
        mkdirSync(this.lockDir, { recursive: true });
      }
      if (!existsSync(this.resultDir)) {
        mkdirSync(this.resultDir, { recursive: true });
      }
    } finally {
      this.initialized = true;
    }
  }

  async executeTask<T>(
    taskKey: string,
    taskFn: () => Promise<T>,
    options: { timeout?: number } = {},
  ): Promise<T> {
    // 确保目录存在
    this.ensureDirectories();

    const timeout = options.timeout || this.lockTimeout;
    // 使用安全的文件名
    const safeTaskKey = this.sanitizeFileName(taskKey);
    const lockFile = path.join(this.lockDir, `${safeTaskKey}.lock`);
    const resultFile = path.join(this.resultDir, `${safeTaskKey}.json`);

    // 1. 检查是否已有结果
    const existingResult = await this.getExistingResult<T>(resultFile);
    if (existingResult && existingResult.status === 'completed') {
      return existingResult.result!;
    }

    // 2. 尝试获取锁
    const lockAcquired = await this.acquireLock(lockFile, timeout);

    if (lockAcquired) {
      return await this.executeWithLock<T>(
        taskKey,
        taskFn,
        lockFile,
        resultFile,
        timeout,
      );
    } else {
      // 3. 等待其他 worker 完成任务
      return await this.waitForTaskCompletion<T>(resultFile, lockFile, timeout);
    }
  }

  private async executeWithLock<T>(
    taskKey: string,
    taskFn: () => Promise<T>,
    lockFile: string,
    resultFile: string,
    timeout: number,
  ): Promise<T> {
    try {
      // 双重检查结果
      const doubleCheckResult = await this.getExistingResult<T>(resultFile);
      if (doubleCheckResult && doubleCheckResult.status === 'completed') {
        return doubleCheckResult.result!;
      }

      // 写入运行状态
      await this.safeWriteTaskResult(resultFile, {
        status: 'running',
        workerId: this.workerId,
        timestamp: Date.now(),
        pid: process.pid,
      });

      // 执行任务
      const result = await Promise.race([
        taskFn(),
        this.createTimeoutPromise<T>(timeout),
      ]);

      // 写入成功结果
      await this.safeWriteTaskResult(resultFile, {
        status: 'completed',
        result,
        workerId: this.workerId,
        timestamp: Date.now(),
        pid: process.pid,
      });

      return result;
    } catch (error) {
      // 写入失败结果
      await this.safeWriteTaskResult(resultFile, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        workerId: this.workerId,
        timestamp: Date.now(),
        pid: process.pid,
      });
      throw error;
    } finally {
      await this.releaseLock(lockFile);
    }
  }

  private sanitizeFileName(fileName: string): string {
    // 移除或替换不安全的文件名字符
    return (
      fileName
        // biome-ignore lint/suspicious/noControlCharactersInRegex: just-do-it
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100)
    ); // 限制长度
  }

  private async acquireLock(
    lockFile: string,
    timeout: number,
  ): Promise<boolean> {
    try {
      const lockInfo: LockInfo = {
        workerId: this.workerId,
        pid: process.pid,
        timestamp: Date.now(),
      };

      // 检查现有锁是否过期
      if (existsSync(lockFile)) {
        try {
          const existingLock = JSON.parse(
            await fs.readFile(lockFile, 'utf-8'),
          ) as LockInfo;
          if (Date.now() - existingLock.timestamp < timeout) {
            // 锁还有效，检查进程是否还存在
            if (this.isProcessAlive(existingLock.pid)) {
              return false; // 锁被其他活跃进程持有
            }
          }
          // 锁过期或进程已死，删除旧锁
          await this.safeUnlink(lockFile);
        } catch {
          // 锁文件损坏，删除它
          await this.safeUnlink(lockFile);
        }
      }

      // 尝试创建锁文件
      await fs.writeFile(lockFile, JSON.stringify(lockInfo), { flag: 'wx' });
      return true;
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        return false; // 锁已被其他进程获取
      }
      if (error.code === 'ENOENT') {
        // 目录不存在，重新确保目录存在
        this.ensureDirectories();
        return this.acquireLock(lockFile, timeout); // 重试一次
      }
      return false;
    }
  }

  private async releaseLock(lockFile: string): Promise<void> {
    // 验证锁是否属于当前进程
    if (existsSync(lockFile)) {
      const lockContent = await fs.readFile(lockFile, 'utf-8');
      const lockInfo = JSON.parse(lockContent) as LockInfo;

      if (lockInfo.pid === process.pid) {
        await this.safeUnlink(lockFile);
      }
    }
  }

  private async getExistingResult<T>(
    resultFile: string,
  ): Promise<TaskResult<T> | null> {
    try {
      if (!existsSync(resultFile)) {
        return null;
      }
      const content = await fs.readFile(resultFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async safeWriteTaskResult<T>(
    resultFile: string,
    result: TaskResult<T>,
  ): Promise<void> {
    try {
      // 确保目录存在
      this.ensureDirectories();

      // 写入临时文件，然后原子性地重命名
      const tempFile = `${resultFile}.tmp.${process.pid}`;
      await fs.writeFile(tempFile, JSON.stringify(result, null, 2));

      // 原子性重命名
      await fs.rename(tempFile, resultFile);
    } catch (error) {
      // 清理临时文件
      const tempFile = `${resultFile}.tmp.${process.pid}`;
      await this.safeUnlink(tempFile);
      throw error;
    }
  }

  private async safeUnlink(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch {
      // 文件可能已被删除，忽略错误
    }
  }

  private async waitForTaskCompletion<T>(
    resultFile: string,
    lockFile: string,
    maxWaitTime: number,
  ): Promise<T> {
    const startTime = Date.now();
    const pollInterval = 200; // 200ms
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getExistingResult<T>(resultFile);

        if (result) {
          if (result.status === 'completed') {
            return result.result!;
          } else if (result.status === 'failed') {
            throw new Error(result.error || 'Task failed');
          }
          // 如果状态是 running，继续等待
        }

        // 检查锁是否还存在且有效
        if (!existsSync(lockFile)) {
          // 再等一会儿，可能任务刚完成但结果还没写入
          await this.delay(pollInterval * 2);
          const finalResult = await this.getExistingResult<T>(resultFile);
          if (finalResult?.status === 'completed') {
            return finalResult.result!;
          }
          throw new Error('Task execution was abandoned');
        }

        consecutiveErrors = 0; // 重置错误计数
        await this.delay(pollInterval);
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(
            `Too many consecutive errors while waiting for task: ${error}`,
          );
        }
        await this.delay(pollInterval);
      }
    }

    throw new Error(`Task execution timeout after ${maxWaitTime}ms`);
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 清理过期的锁和结果文件
  async cleanup(maxAge: number = 3600000): Promise<void> {
    this.ensureDirectories();
    const now = Date.now();

    // 清理过期锁
    if (existsSync(this.lockDir)) {
      const lockFiles = await fs.readdir(this.lockDir);
      for (const file of lockFiles) {
        const lockFile = path.join(this.lockDir, file);
        try {
          const stat = await fs.stat(lockFile);
          if (now - stat.mtime.getTime() > maxAge) {
            await this.safeUnlink(lockFile);
          }
        } catch {
          // 文件可能已被删除
        }
      }
    }

    // 清理过期结果
    if (existsSync(this.resultDir)) {
      const resultFiles = await fs.readdir(this.resultDir);
      for (const file of resultFiles) {
        if (file.endsWith('.tmp')) {
          // 清理临时文件
          await this.safeUnlink(path.join(this.resultDir, file));
          continue;
        }

        const resultFile = path.join(this.resultDir, file);
        try {
          const stat = await fs.stat(resultFile);
          if (now - stat.mtime.getTime() > maxAge) {
            await this.safeUnlink(resultFile);
          }
        } catch {
          // 文件可能已被删除
        }
      }
    }
  }
}

let taskManager: FileBasedTaskManager | null = null;

export function getTaskManager(): FileBasedTaskManager {
  if (!taskManager) {
    taskManager = new FileBasedTaskManager();
  }
  return taskManager;
}

export async function executeSharedTask<T>(
  taskKey: string,
  taskFn: () => Promise<T>,
  options?: { timeout?: number },
): Promise<T> {
  const manager = getTaskManager();
  return manager.executeTask(taskKey, taskFn, options);
}
