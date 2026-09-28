import { formatShortDate } from '@/components/ui/format';
import type { KnowledgeDoc } from '@/features/projects/actions';

export interface DocListProps {
  docs: KnowledgeDoc[];
  /** 空态文案。 */
  emptyText?: string;
}

/**
 * L2 文档行列表（.doc-row）：草稿走 .is-pending 橙框并标「AI 起草 · 待你确认」，
 * 已确认行右侧给创建日期。供「最近文档 / 文档 / 复盘」三处复用。
 */
export function DocList({ docs, emptyText = '暂无文档' }: DocListProps) {
  if (docs.length === 0) {
    return <div className="ghost-note">{emptyText}</div>;
  }
  return (
    <div>
      {docs.map((doc) => (
        <article
          key={doc.id}
          className={doc.status === '草稿' ? 'doc-row is-pending' : 'doc-row'}
        >
          <div>
            <div className="doc-title">{doc.title}</div>
            <div className="doc-meta">
              {doc.kind}
              {' · '}
              {doc.meta}
            </div>
          </div>
          {doc.status === '草稿' ? (
            <span className="tag tag-pending">AI 起草 · 待你确认</span>
          ) : (
            <span className="chip">{formatShortDate(doc.createdAt)}</span>
          )}
        </article>
      ))}
    </div>
  );
}
