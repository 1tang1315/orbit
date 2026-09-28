// ============================================================
// 「工作项流水线」业务域读查询（屏 05 需求流水线 / 屏 07 Bug 快轨，
// 同路由 /work-items/[id] 按 sourceType 切换变体）。
//
// 本屏全只读：页面只 import 本文件取数，不直接触碰 lib/db；
// 这里是 lib/db 与页面之间的唯一读封装（开发规范 02 §3）。
// ============================================================

import {
  getProject as readProject,
  getWorkArtifacts as readWorkArtifacts,
  getWorkItem as readWorkItem,
  getWorkItems as readWorkItems,
  type Project,
  type StageMeta,
  type WorkArtifact,
  type WorkItem,
} from '@/lib/db';

// 组件不直接 import lib/db（含类型），跨层 UI 模型统一从本域转发。
export type { ArtifactTone, Project, StageMeta, StageTone, WorkArtifact, WorkItem } from '@/lib/db';

// region 视图模型

/** 流水线固定 4 列（列名与 HUB_PLAN §6 屏 05 一致，no 与 stage 一一对应）。 */
const PIPE_COLUMNS = [
  { stage: 1, title: '01 需求与目标', short: '需求与目标' },
  { stage: 2, title: '02 设计规格', short: '设计规格' },
  { stage: 3, title: '03 执行方案', short: '执行方案' },
  { stage: 4, title: '04 完成与沉淀', short: '完成与沉淀' },
] as const;

export type ColumnNoteTone = 'plain' | 'ok' | 'warn';

export interface WorkItemColumn {
  /** 列序号 1–4（与产物 stage 一致）。 */
  stage: number;
  /** 列名：01 需求与目标 … 04 完成与沉淀。 */
  title: string;
  /** 列头计数 / 状态说明。 */
  note: string;
  /** note 语义色：plain=灰、ok=绿（全部已确认）、warn=橙（待你过目）。 */
  noteTone: ColumnNoteTone;
  /** 该列产物（已按 sort_order 排序）。 */
  artifacts: WorkArtifact[];
  /** 屏 07：Bug 快轨的规格列灰化、不可编辑。 */
  readonly: boolean;
  /** 屏 07：第 4 列放「待人工确认」按钮占位。 */
  manualConfirm: boolean;
}

export interface WorkItemDetail {
  /** 工作项本体。 */
  workItem: WorkItem;
  /** 所属项目（面包屑用；缺失时为 null，页面降级显示）。 */
  project: Project | null;
  /** 规范化后的 4 阶段（seed 的 stages 缺失时按当前 stage 推导，保证进度条不塌）。 */
  stages: StageMeta[];
  /** 按固定 4 列归组并算好列头说明的产物视图。 */
  columns: WorkItemColumn[];
  /** 屏 07 Bug 快轨变体（sourceType === 'Bug'）。 */
  isBugTrack: boolean;
}

/** 面包屑下方的工作项切换入口。 */
export interface WorkItemLink {
  id: string;
  seq: number;
  sourceType: WorkItem['sourceType'];
  title: string;
}

// endregion

// region 基础读查询（页面可直接组合调用）

/** 单个工作项；不存在返回 null（由页面转 404）。 */
export async function getWorkItem(id: string): Promise<WorkItem | null> {
  return readWorkItem(id);
}

/** 全部工作项（切换入口与列表用）。 */
export async function listWorkItems(): Promise<WorkItem[]> {
  return readWorkItems();
}

/** 某工作项的全部产物，已按 stage、sort_order 排序。 */
export async function getWorkArtifacts(workItemId: string): Promise<WorkArtifact[]> {
  return readWorkArtifacts(workItemId);
}

/** 工作项所属项目；缺失时返回 null，页面降级为「未知项目」。 */
export async function getProject(id: string): Promise<Project | null> {
  return readProject(id);
}

// endregion

// region 页面视图组装

/**
 * 屏 05 / 07 页面视图：工作项 + 项目 + 规范化阶段 + 4 列产物。
 *
 * 一次把本屏所需数据组装完，页面不散调 db（开发规范 02 §2.3）。
 */
export async function getWorkItemDetail(id: string): Promise<WorkItemDetail | null> {
  const workItem = readWorkItem(id);
  if (!workItem) {
    return null;
  }
  const project = readProject(workItem.projectId);
  const artifacts = readWorkArtifacts(workItem.id);
  const stages = workItem.stages.length > 0 ? workItem.stages : fallbackStages(workItem);
  const isBugTrack = workItem.sourceType === 'Bug';
  const columns = PIPE_COLUMNS.map((def) => buildColumn(def.stage, def.title, artifacts, isBugTrack));

  return { workItem, project, stages, columns, isBugTrack };
}

/** 工作项切换入口（wi-142 ↔ wi-157 互相可达），按 seq 升序。 */
export async function listWorkItemLinks(): Promise<WorkItemLink[]> {
  return readWorkItems()
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map(({ id, seq, sourceType, title }) => ({ id, seq, sourceType, title }));
}

/** stages 缺失时按当前 stage 推导 4 个阶段，空备注不渲染警示。 */
function fallbackStages(workItem: WorkItem): StageMeta[] {
  return PIPE_COLUMNS.map((def) => ({
    no: def.stage,
    title: def.short,
    note: '',
    tone: workItem.stage > def.stage
      ? 'done'
      : workItem.stage === def.stage
        ? 'current'
        : 'pending',
  }));
}

/**
 * 把产物按 stage 归入一列，并算出列头计数 / 状态说明。
 *
 * - 屏 07 的规格列（stage 2）整列灰化，列头注明「Bug 快轨 · 规格跳过」；
 * - 有 highlight（橙框 = 待你过目）或 confirm_state=pending 的记为待确认，
 *   用橙色 warn；全部确认用绿色 ok——状态色与来源标签两套语义不混用。
 */
function buildColumn(
  stage: number,
  title: string,
  artifacts: WorkArtifact[],
  isBugTrack: boolean,
): WorkItemColumn {
  const items = artifacts.filter((artifact) => artifact.stage === stage);
  const readonly = isBugTrack && stage === 2;
  const pendingCount = items.filter(
    (artifact) => artifact.highlight || artifact.confirmState === 'pending',
  ).length;

  let note: string;
  let noteTone: ColumnNoteTone;
  if (readonly) {
    note = 'Bug 快轨 · 规格跳过';
    noteTone = 'plain';
  } else if (items.length === 0) {
    note = '0 项产物';
    noteTone = 'plain';
  } else if (pendingCount > 0) {
    note = `${pendingCount} 项待你过目`;
    noteTone = 'warn';
  } else {
    note = `${items.length} 项 · 全部已确认`;
    noteTone = 'ok';
  }

  return {
    stage,
    title,
    note,
    noteTone,
    artifacts: items,
    readonly,
    manualConfirm: isBugTrack && stage === 4,
  };
}

// endregion
