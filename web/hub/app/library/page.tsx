import type { Metadata } from 'next';

import { getLibraryRows } from '@/features/knowledge/actions';
import { DocListItem } from '@/features/knowledge/components/doc-list-item';

export const metadata: Metadata = {
  title: '知识库',
};

/** 侧栏简化页 · 知识库：全量 L2 文档列表（HUB_PLAN §6 侧栏说明）。 */
export default function LibraryPage() {
  const rows = getLibraryRows();
  const confirmed = rows.filter((row) => row.status === '已确认').length;
  const draft = rows.length - confirmed;

  return (
    <section>
      <p className="eyebrow">知识沉淀</p>
      <h1 className="page-title">知识库</h1>
      <p className="page-sub">
        {`共 ${rows.length} 篇 L2 文档 · 已确认 ${confirmed} 篇 · 草稿 ${draft} 篇`}
      </p>
      <div className="knowledge-list">
        {rows.length > 0 ? (
          rows.map((row) => <DocListItem key={row.id} row={row} />)
        ) : (
          <p className="list-empty">知识库暂无内容 · 接入仓库后，L1 事实层会自动采集，AI 起草的 L2 文档经你确认后落库。</p>
        )}
      </div>
    </section>
  );
}
