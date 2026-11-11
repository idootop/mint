/**
 * 构建任务执行器。
 *
 * 一个任务 = 名字 + 执行函数，定义写在任务自己的文件里（见 scripts/*.ts 的导出），
 * prebuild / postbuild 只负责把任务收集成列表。
 */

export interface BuildTask {
  /** 任务名，用于日志 */
  name: string;
  run: () => Promise<void> | void;
}

/** 按顺序串行执行任务，任一任务抛错即中止 */
export const runTasks = async (
  stage: 'prebuild' | 'postbuild',
  tasks: BuildTask[],
) => {
  const label = stage === 'prebuild' ? '前置' : '后置';
  if (tasks.length === 0) {
    console.log(`⏭️  没有${label}任务`);
    return;
  }
  console.log(`▶️  ${label}任务：${tasks.length} 个\n`);
  const startedAt = Date.now();
  for (const [index, task] of tasks.entries()) {
    const begin = Date.now();
    try {
      await task.run();
    } catch (error) {
      console.error(`\n❌ [${index + 1}/${tasks.length}] ${task.name} 失败：`);
      console.error(error instanceof Error ? error.stack : String(error));
      process.exit(1);
    }
    console.log(
      `✅ [${index + 1}/${tasks.length}] ${task.name}（${Date.now() - begin}ms）`,
    );
  }
  console.log(`\n🎉 ${label}任务全部完成（${Date.now() - startedAt}ms）`);
};
