// ============================================================
// 「项目」业务域读查询（屏 02 项目详情）。
// 只封装 lib/db.ts 的查询入口：不写 SQL、不引 React 组件；
// 页面与组件一律经此取数（开发规范 02 §3.1–§3.2）。
// 本期该屏全为读，无写动作，故文件不标 'use server'。
// ============================================================

import {
  getKnowledgeCards,
  getKnowledgeDocs,
  getProject as queryProject,
  type KnowledgeCard,
  type KnowledgeDoc,
  type Project,
} from '@/lib/db';

// 跨组件共享的 UI 模型统一从本域转发，组件不直接 import lib/db。
export type {
  ArchNode,
  CommitItem,
  KnowledgeCard,
  KnowledgeDoc,
  Project,
} from '@/lib/db';

/** 单个项目；不存在返回 null（由页面调 notFound() 收口）。 */
export function getProject(id: string): Project | null {
  return queryProject(id);
}

/** 项目全部 L2 文档（按创建时间倒序），供概览知识树与「文档」Tab。 */
export function getProjectDocs(projectId: string): KnowledgeDoc[] {
  return getKnowledgeDocs({ projectId });
}

/** 项目复盘类 L2 文档，供「复盘」Tab。 */
export function getRetroDocs(projectId: string): KnowledgeDoc[] {
  return getKnowledgeDocs({ projectId, kind: '复盘' });
}

/** 命中本项目的 L3 技术栈知识卡，供概览知识树与「技术栈知识」Tab。 */
export function getProjectCards(projectId: string): KnowledgeCard[] {
  return getKnowledgeCards({ hitProject: projectId });
}
