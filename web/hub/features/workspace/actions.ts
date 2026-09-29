// ============================================================
// 屏 01「首页 · 动态流」的读查询封装。
// 页面与组件只从本文件取数、不直接 import @/lib/db：
// 业务域对数据入口保持单点，日后换实现只动这里（开发规范 02 §1、§3）。
// 查询都是同步普通函数——node:sqlite 同步执行，读路径无需 'use server'。
// ============================================================

import {
  getKnowledgeCards,
  getProjects,
  getRecentActivity,
  getReviewQueueTasks,
  getWorkspaceStats,
} from '@/lib/db';
import type {
  Activity,
  ActivityKind,
  KnowledgeCard,
  Project,
  Task,
  WorkspaceStats,
} from '@/lib/db';

// UI 模型随查询一并对外：本域组件只认 actions 的类型，不越过边界摸 lib。
export type {
  Activity,
  ActivityKind,
  KnowledgeCard,
  Project,
  Task,
  WorkspaceStats,
};

/** 四张统计卡数值：接入项目 / L2 文档 / L3 知识卡 / 待复盘。 */
export function getHomeStats(): WorkspaceStats {
  return getWorkspaceStats();
}

/** 首页项目总览：getProjects 已按最近同步倒序，全量返回（电商式网格）。 */
export function getOverviewProjects(): Project[] {
  return getProjects();
}

/** 最近动态：按发生时间倒序取前 limit 条。 */
export function getHomeFeed(limit = 8): Activity[] {
  return getRecentActivity(limit);
}

/** 待复盘任务队列：db 层已按优先级、序号升序（右栏「待复盘任务」）。 */
export function getHomeReviewQueue(limit = 4): Task[] {
  return getReviewQueueTasks().slice(0, limit);
}

/** L3 技术知识卡：按 sort_order 取前 limit 张（seed 把今日到期排在最前）。 */
export function getHomeL3Cards(limit = 4): KnowledgeCard[] {
  return getKnowledgeCards().slice(0, limit);
}
