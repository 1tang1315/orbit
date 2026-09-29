import Link from 'next/link';

import type { KnowledgeCard, KnowledgeDoc, Project } from '@/features/projects/actions';

import '../styles.scss';

export interface KnowledgeTreeProps {
  project: Project;
  docs: KnowledgeDoc[];
  cards: KnowledgeCard[];
}

interface TreeEntry {
  label: string;
  note: string;
  /** 不传 href 的条目为静态展示（hover 不变紫、不跳转）。 */
  href?: string;
}

interface TreeEntryRowProps {
  entry: TreeEntry;
}

/** L2 分组展示顺序；seed 之外的新 kind 兜底排在最后。 */
const L2_KIND_ORDER = ['项目解析', '架构理解', '需求与规格', 'ADR', '踩坑', '复盘'];
/** L3 首屏条数，其余收进「查看全部」条目。 */
const L3_LIMIT = 6;

/** L2 文档按 kind 分组计数，并映射到对应 Tab（复盘 → 复盘 Tab，其余 → 文档 Tab）。 */
function groupDocKinds(docs: KnowledgeDoc[], base: string): TreeEntry[] {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1);
  }
  const kinds = [
    ...L2_KIND_ORDER.filter((kind) => counts.has(kind)),
    ...[...counts.keys()].filter((kind) => !L2_KIND_ORDER.includes(kind)),
  ];
  return kinds.map((kind) => ({
    label: kind,
    note: `${counts.get(kind) ?? 0} 篇`,
    href: kind === '复盘' ? `${base}?tab=retro` : `${base}?tab=docs`,
  }));
}

/** 知识树单行：可点击条目 hover 变紫并跳到对应 Tab / 列表。 */
function TreeEntryRow({ entry }: TreeEntryRowProps) {
  const body = (
    <>
      <span className="tree-item-label">{entry.label}</span>
      <span className="tree-item-note">{entry.note}</span>
    </>
  );
  if (entry.href) {
    return (
      <Link className="tree-item" href={entry.href}>
        {body}
      </Link>
    );
  }
  return <div className="tree-item is-static">{body}</div>;
}

/**
 * 屏 02 知识树：L1 项目事实（代码结构 / 架构图 / 提交历史 / 依赖计数）→
 * L2 个人理解（按 kind 分组的文档）→ L3 跨项目技术知识（命中卡）。
 */
export function KnowledgeTree({ project, docs, cards }: KnowledgeTreeProps) {
  const base = `/projects/${project.id}`;

  const l1Entries: TreeEntry[] = [
    { label: '代码结构', note: `${project.l1Count} 项`, href: `${base}?tab=arch` },
    { label: '架构图', note: 'L1 全自动', href: `${base}?tab=arch` },
    { label: '提交历史', note: `${project.commitCount} 条`, href: `${base}?tab=commits` },
    { label: '依赖计数', note: `${project.depsCount} 个` },
  ];
  const l2Entries = groupDocKinds(docs, base);

  const l3Entries: TreeEntry[] = cards.slice(0, L3_LIMIT).map((card) => ({
    label: card.title,
    note: card.mastered ? '已掌握' : '待复习',
    href: `${base}?tab=cards`,
  }));
  if (cards.length > L3_LIMIT) {
    l3Entries.push({
      label: '查看全部技术栈知识卡',
      note: `${cards.length} 张`,
      href: `${base}?tab=cards`,
    });
  }

  return (
    <div>
      <div className="tree-section">
        <div className="tree-head is-l1">L1 · 项目事实</div>
        {l1Entries.map((entry) => (
          <TreeEntryRow key={entry.label} entry={entry} />
        ))}
      </div>

      <div className="tree-section">
        <div className="tree-head is-l2">L2 · 个人理解</div>
        {l2Entries.length > 0 ? (
          l2Entries.map((entry) => (
            <TreeEntryRow key={entry.label} entry={entry} />
          ))
        ) : (
          <div className="ghost-note">暂无 L2 文档 · 接入 AI 后将自动起草，你确认后落库</div>
        )}
      </div>

      <div className="tree-section">
        <div className="tree-head is-l3">L3 · 跨项目技术知识</div>
        {l3Entries.length > 0 ? (
          l3Entries.map((entry) => (
            <TreeEntryRow key={entry.label} entry={entry} />
          ))
        ) : (
          <div className="ghost-note">暂无关联的技术知识卡 · 完成复盘后会自动提炼</div>
        )}
      </div>
    </div>
  );
}
