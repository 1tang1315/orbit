import type { Metadata } from 'next';

import { getTechStackRows } from '@/features/knowledge/actions';
import { TechCardListItem } from '@/features/knowledge/components/tech-card-list-item';

export const metadata: Metadata = {
  title: '技术栈知识',
};

/** 侧栏简化页 · 技术栈知识：全量 L3 卡列表。 */
export default function TechStackPage() {
  const rows = getTechStackRows();
  const mastered = rows.filter((row) => row.mastered).length;
  const due = rows.filter((row) => row.dueToday && !row.mastered).length;

  return (
    <section>
      <p className="eyebrow">跨项目沉淀</p>
      <h1 className="page-title">技术栈知识</h1>
      <p className="page-sub">
        {`共 ${rows.length} 张 L3 卡 · 已掌握 ${mastered} 张 · 今日到期 ${due} 张`}
      </p>
      <div className="knowledge-list">
        {rows.length > 0 ? (
          rows.map((row) => <TechCardListItem key={row.id} row={row} />)
        ) : (
          <p className="list-empty">暂无技术栈知识卡 · 完成任务复盘后，可复用的技术经验会自动提炼为 L3 跨项目知识。</p>
        )}
      </div>
    </section>
  );
}
