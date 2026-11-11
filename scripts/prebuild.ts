/**
 * 构建前置任务（在 next build 之前执行）。
 *
 * 新增任务：在任务自己的文件里导出 `xxxTask`（名字与执行函数写在一起），
 * 然后把它加进下面的列表。数组顺序就是执行顺序。
 */
import { collectTask } from './tasks/collect';
import { runTasks } from './tasks/run-tasks';

runTasks('prebuild', [collectTask]);
