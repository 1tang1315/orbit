import type { Metadata } from 'next';

import { getRetroRows } from '@/features/knowledge/actions';
import { DocListItem } from '@/features/knowledge/components/doc-list-item';

export const metadata: Metadata = {
  title: '复盘报告',
};

/** 侧栏简化页 · 复盘报告：kind='复盘' 的 L2 文档列表。 */
export default function RetrosPage() {
  const rows = getRetroRows();
  const confirmed = rows.filter((row) => row.status === '已确认').length;

  return (
    <section>
      <p className="eyebrow">跨项目复盘</p>
      <h1 className="page-title">复盘报告</h1>
      <p className="page-sub">
        {`共 ${rows.length} 份复盘 · 已确认 ${confirmed} 份 · 草稿 ${rows.length - confirmed} 份`}
      </p>
      <div className="knowledge-list">
        {rows.length > 0 ? (
          rows.map((row) => <DocListItem key={row.id} row={row} />)
        ) : (
          <p className="list-empty">暂无复盘报告，完成任务后会自动生成复盘草稿。</p>
        )}
      </div>
    </section>
  );
}
