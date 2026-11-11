/**
 * 构建后置任务（在 next build 之后执行）。
 *
 * 新增任务：在任务自己的文件里导出 `xxxTask`（名字与执行函数写在一起），
 * 然后把它加进下面的列表。数组顺序就是执行顺序。
 */
import { cleanupTask } from './tasks/cleanup';
import { manifestTask } from './tasks/manifest';
import { runTasks } from './tasks/run-tasks';

runTasks('postbuild', [cleanupTask, manifestTask]);
