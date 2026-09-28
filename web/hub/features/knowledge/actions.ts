// ============================================================
// 知识域（L2 文档 / L3 卡 / 复习 / 复盘）服务端逻辑：
// 读查询供屏 04 与侧栏三个简化页（/library /tech-stack /retros）调用；
// 写动作 reviewCard 为 HUB_PLAN §5 写路径第 3 条（复习卡 再复习/已掌握）。
// 页面不得直接 import '@/lib/db'，一律经本文件取数（02 规范 §3）。
// ============================================================

import { revalidatePath } from 'next/cache';

import { formatRelative } from '@/components/ui/format';
import {
  getKnowledgeCards,
  getKnowledgeDocs,
  getProjects,
  getRecentActivity,
  reviewKnowledgeCard,
  type KnowledgeCard,
  type KnowledgeDoc,
  type Project,
} from '@/lib/db';

// region 视图模型（app/ 页面与本域组件之间传递的可序列化数据）

/** 知识库 / 复盘列表行。 */
export interface DocRow {
  id: string;
  title: string;
  kind: string;
  projectName: string;
  status: KnowledgeDoc['status'];
  createdAt: string;
  /** 行落点：项目详情「文档」Tab（真实存在的路由）。 */
  href: string;
}

/** 技术栈知识列表行。 */
export interface TechCardRow {
  id: string;
  title: string;
  summary: string;
  hitProjects: string[];
  mastered: boolean;
  dueToday: boolean;
  href: string;
}

/** 屏 04 当前复习卡（项目名已解析为展示名）。 */
export interface ReviewCardView {
  id: string;
  title: string;
  summary: string;
  /** 来源项目展示名（无来源时为「跨项目」）。 */
  originText: string;
  /** 命中项目展示名，顿号连接。 */
  hitText: string;
}

/** 手机框「项目更新」一条动态。 */
export interface ReviewUpdate {
  id: string;
  title: string;
  time: string;
  color: string;
  href: string;
}

/** 「本周沉淀」一条统计。 */
export interface WeeklyStat {
  label: string;
  value: string;
}

/** 屏 04 整屏数据。 */
export interface ReviewScreenData {
  /** 当前卡；今日已全部掌握时为 null（显示空态）。 */
  current: ReviewCardView | null;
  /** 今日应复习总数。 */
  total: number;
  /** 已掌握数（复习卡头部 N/M）。 */
  masteredCount: number;
  /** 今日已处理数（已掌握 + 已「再复习」重排，进度条口径）。 */
  reviewedCount: number;
  streakDays: number;
  updates: ReviewUpdate[];
  weekly: WeeklyStat[];
}

// endregion

// region 内部工具

/** 项目 id → 展示名（seed 中 id 与 name 同名，仍按 projects 表取值）。 */
function projectNameOf(projects: Project[], id: string): string {
  return projects.find((project) => project.id === id)?.name ?? id;
}

/** L2 文档 → 列表行视图。 */
function toDocRow(doc: KnowledgeDoc, projects: Project[]): DocRow {
  return {
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    projectName: projectNameOf(projects, doc.projectId),
    status: doc.status,
    createdAt: doc.createdAt,
    href: `/projects/${doc.projectId}?tab=docs`,
  };
}

/** L3 卡 → 复习卡视图。 */
function toReviewCardView(card: KnowledgeCard, projects: Project[]): ReviewCardView {
  const hits = card.hitProjects.map((id) => projectNameOf(projects, id));
  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    originText: card.originProject ? projectNameOf(projects, card.originProject) : '跨项目',
    hitText: hits.length > 0 ? hits.join('、') : '暂无',
  };
}

// endregion

// region 读查询

/** 知识库：全量 L2 文档（含复盘类），按创建时间倒序。 */
export function getLibraryRows(): DocRow[] {
  const projects = getProjects();
  return getKnowledgeDocs().map((doc) => toDocRow(doc, projects));
}

/** 复盘报告：kind='复盘' 的 L2 文档。 */
export function getRetroRows(): DocRow[] {
  const projects = getProjects();
  return getKnowledgeDocs({ kind: '复盘' }).map((doc) => toDocRow(doc, projects));
}

/** 技术栈知识：全量 L3 卡。 */
export function getTechStackRows(): TechCardRow[] {
  const projects = getProjects();
  return getKnowledgeCards().map((card) => ({
    id: card.id,
    title: card.title,
    summary: card.summary,
    hitProjects: card.hitProjects.map((id) => projectNameOf(projects, id)),
    mastered: card.mastered,
    dueToday: card.dueToday,
    // 卡片行不单开详情页，落点指向真实存在的 /library
    href: '/library',
  }));
}

/** 连续复习天数：示例数据无该字段，取 PDF 蓝本值 6 天。 */
const STREAK_DAYS = 6;

/** 屏 04 整屏数据：今日复习队列 + 项目更新 + 进度 + 本周沉淀。 */
export function getReviewScreenData(): ReviewScreenData {
  const projects = getProjects();

  // 今日队列：dueToday 的卡按 sortOrder 排序，当前卡 = 第一张未掌握的
  const due = getKnowledgeCards({ dueToday: true });
  const total = due.length;
  const masteredCount = due.filter((card) => card.mastered).length;
  const reviewedCount = due.filter((card) => card.reviewState !== 'pending').length;
  const current = due.find((card) => !card.mastered) ?? null;

  const recent = getRecentActivity(50);
  const colorByProject = new Map(projects.map((project) => [project.id, project.color]));
  const updates: ReviewUpdate[] = recent.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title,
    time: formatRelative(item.occurredAt),
    color: (item.projectId && colorByProject.get(item.projectId)) || '#9B988F',
    href: item.href ?? '/',
  }));

  // 本周沉淀：动态时间轴按「距今 7 天」统计新增 L2/L3，复盘按文档表计数
  const weekAgo = Date.now() - 7 * 86_400_000;
  const countRecent = (kind: 'l2' | 'l3'): number => recent.filter(
    (item) => item.kind === kind && Date.parse(item.occurredAt) >= weekAgo,
  ).length;
  const weekly: WeeklyStat[] = [
    { label: '新增 L2 文档', value: `${countRecent('l2')} 篇` },
    { label: '新增 L3 卡', value: `${countRecent('l3')} 张` },
    { label: '复盘报告', value: `${getKnowledgeDocs({ kind: '复盘' }).length} 份` },
  ];

  return {
    current: current ? toReviewCardView(current, projects) : null,
    total,
    masteredCount,
    reviewedCount,
    streakDays: STREAK_DAYS,
    updates,
    weekly,
  };
}

// endregion

// region 写动作（HUB_PLAN §5 写路径 3）

const REVIEW_RESULTS = ['again', 'mastered'] as const;

export type ReviewResult = (typeof REVIEW_RESULTS)[number];

/**
 * 复习一张 L3 知识卡。
 *
 * 'mastered' 标记已掌握（进度 +1）；'again' 挪到今日队列末尾，
 * 使「再复习」切到下一张。落库后刷新 /review，保证进度与队列保持。
 */
export async function reviewCard(id: string, result: ReviewResult): Promise<void> {
  'use server';

  // 服务端二次校验：result 白名单 + id 存在性，不信任客户端传值
  if (result !== 'again' && result !== 'mastered') {
    throw new Error('非法的复习结果');
  }
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('缺少知识卡 ID');
  }
  if (!getKnowledgeCards().some((card) => card.id === id)) {
    throw new Error('知识卡不存在');
  }

  reviewKnowledgeCard(id, result);
  revalidatePath('/review');
}

// endregion
