// ============================================================
// 「任务 · 看板」业务域的服务端逻辑（屏 03 看板 + 屏 06 任务详情）。
// 读查询：普通 async 函数，服务端组件直调，不需要 'use server'（规范 02 §3.2）。
// 写动作：moveTaskStatus / acceptConfirmation，
//        函数体首行 'use server'，落库后 revalidatePath（规范 02 §3.3）。
// 页面只从本文件取数，不直接 import '@/lib/db'。
// ============================================================

import { revalidatePath } from 'next/cache';

import {
  advanceTaskChecklist,
  getBoardTasks as queryBoardTasks,
  getConfirmation as queryConfirmation,
  getRunningSessionCount as queryRunningSessionCount,
  getSessionByTask as querySessionByTask,
  getTask as queryTask,
  setConfirmationState,
  updateTaskStatus,
} from '@/lib/db';
import type {
  BoardFilter,
  Confirmation,
  Session,
  Task,
  TaskStatus,
} from '@/lib/db';

// 供组件按类型引用（type-only，客户端组件导入会被擦除，不引入 node:sqlite）。
export type {
  BoardFilter,
  ChecklistStep,
  Confirmation,
  FileChange,
  Session,
  Task,
  TaskHandler,
  TaskStatus,
  TimelineItem,
} from '@/lib/db';

/** 看板列状态白名单：写动作的服务端二次校验用（与 TaskStatus 联合类型对齐）。 */
const TASK_STATUSES: readonly TaskStatus[] = [
  'planned',
  'todo',
  'doing',
  'review',
  'done',
];

// region 读查询（服务端组件调用，不加 'use server'）

/** 看板任务列表；filter 对应顶部筛选 Tab（`?filter=`，刷新保持）。 */
export async function getBoardTasks(filter: BoardFilter = 'all'): Promise<Task[]> {
  return queryBoardTasks(filter);
}

/** 执行中的会话数（看板副标题）。 */
export async function getRunningSessionCount(): Promise<number> {
  return queryRunningSessionCount();
}

/** 单条任务；不存在返回 null，由页面调用 notFound()。 */
export async function getTask(id: string): Promise<Task | null> {
  return queryTask(id);
}

/** 任务最近一次 MCP 执行记录（屏 06 MCP 执行卡）。 */
export async function getSessionByTask(taskId: string): Promise<Session | null> {
  return querySessionByTask(taskId);
}

/** 人机交接确认卡；屏 06 传 refType='task'。 */
export async function getConfirmation(
  refType: Confirmation['refType'],
  refId: string,
): Promise<Confirmation | null> {
  return queryConfirmation(refType, refId);
}

// endregion

// region 写动作（Server Actions，共 2 个，见 HUB_PLAN §5）

/**
 * 看板拖拽：把任务移动到目标列。
 *
 * status 在服务端做白名单二次校验（不信任客户端传值），
 * 任务不存在或状态非法直接抛中文错误。
 */
export async function moveTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  'use server';
  if (typeof taskId !== 'string' || taskId === '') {
    throw new Error('任务 id 不合法，无法移动该任务');
  }
  if (!TASK_STATUSES.includes(status)) {
    throw new Error(`非法的任务状态：${String(status)}`);
  }
  const task = queryTask(taskId);
  if (!task) {
    throw new Error('任务不存在，无法移动该任务');
  }
  if (task.status === status) {
    return;
  }
  updateTaskStatus(task.id, status);
  revalidatePath('/board');
  revalidatePath(`/tasks/${task.id}`);
}

/**
 * 人机交接「采纳默认建议」：确认卡转已采纳，并推进任务的处理阶段 checklist。
 *
 * confirmationId 与 taskId 交叉校验（确认卡必须是该任务下的那张），
 * 已采纳过的卡片不会重复推进 checklist。
 */
export async function acceptConfirmation(confirmationId: string, taskId: string): Promise<void> {
  'use server';
  if (
    typeof confirmationId !== 'string'
    || confirmationId === ''
    || typeof taskId !== 'string'
    || taskId === ''
  ) {
    throw new Error('参数不完整，无法采纳默认建议');
  }
  const task = queryTask(taskId);
  if (!task) {
    throw new Error('任务不存在，无法采纳默认建议');
  }
  const confirmation = queryConfirmation('task', task.id);
  if (!confirmation || confirmation.id !== confirmationId) {
    throw new Error('确认卡不存在或不属于该任务');
  }
  if (confirmation.state === 'pending') {
    setConfirmationState(confirmation.id, 'accepted');
    advanceTaskChecklist(task.id);
  }
  revalidatePath(`/tasks/${task.id}`);
}

// endregion
