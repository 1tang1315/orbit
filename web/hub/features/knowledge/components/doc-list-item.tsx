import Link from 'next/link';

import { formatRelative } from '@/components/ui/format';
import type { DocRow } from '@/features/knowledge/actions';

import '../styles.scss';

export interface DocListItemProps {
  row: DocRow;
}

/**
 * 侧栏简化列表行（知识库 / 复盘报告）：
 * 左侧标题 + 「kind · 项目 · 相对时间」，右侧状态标签（绿=已确认 / 橙=草稿）。
 * 整行链接到该项目详情的「文档」Tab（真实存在的路由）。
 */
export function DocListItem({ row }: DocListItemProps) {
  const statusClass = row.status === '已确认' ? 'tag tag-ok' : 'tag tag-pending';

  return (
    <Link href={row.href} className="list-row">
      <span className="list-row-body">
        <span className="list-row-title">{row.title}</span>
        <span className="list-row-meta">
          {`${row.kind} · ${row.projectName} · ${formatRelative(row.createdAt)}`}
        </span>
      </span>
      <span className="list-row-side">
        <span className={statusClass}>{row.status}</span>
      </span>
    </Link>
  );
}
