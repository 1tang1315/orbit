import Link from 'next/link';

import type { TechCardRow } from '@/features/knowledge/actions';

import '../styles.scss';

export interface TechCardListItemProps {
  row: TechCardRow;
}

/**
 * 技术栈知识列表行：标题 + summary 摘要 + 命中项目 chips；
 * 右侧状态（mastered→.tag-ok「已掌握」，否则→.tag-l3「待复习」），
 * 非已掌握且今日到期再加 .tag-pending「今日到期」。
 * 整行链接到 /library（本行没有独立详情页，指向真实存在的落点）。
 */
export function TechCardListItem({ row }: TechCardListItemProps) {
  return (
    <Link href={row.href} className="list-row">
      <span className="list-row-body">
        <span className="list-row-title">{row.title}</span>
        <span className="list-row-meta">{row.summary}</span>
        <span className="list-row-chips">
          {row.hitProjects.map((project) => (
            <span className="chip" key={project}>
              {project}
            </span>
          ))}
        </span>
      </span>
      <span className="list-row-side">
        {row.mastered ? (
          <span className="tag tag-ok">已掌握</span>
        ) : (
          <span className="tag tag-l3">待复习</span>
        )}
        {!row.mastered && row.dueToday ? (
          <span className="tag tag-pending">今日到期</span>
        ) : null}
      </span>
    </Link>
  );
}
