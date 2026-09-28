import type { KnowledgeCard } from '@/features/projects/actions';

import '../styles.scss';

export interface KnowledgeCardListProps {
  cards: KnowledgeCard[];
  /** 空态文案。 */
  emptyText?: string;
}

/**
 * L3 技术栈知识卡列表：kind 标签（绿）+ 掌握状态 + 摘要 + 命中项目。
 */
export function KnowledgeCardList({ cards, emptyText = '暂无命中该项目的技术知识卡' }: KnowledgeCardListProps) {
  if (cards.length === 0) {
    return <div className="ghost-note">{emptyText}</div>;
  }
  return (
    <div>
      {cards.map((card) => (
        <div key={card.id} className="l3-item">
          <div className="row-between">
            <span className="l3-title">{card.title}</span>
            <span className="tag-row">
              <span className="tag tag-l3">{card.kind}</span>
              <span className={card.mastered ? 'tag tag-ok' : 'tag'}>
                {card.mastered ? '已掌握' : '待复习'}
              </span>
            </span>
          </div>
          <div className="l3-summary">{card.summary}</div>
          <div className="l3-summary">
            命中：
            {card.hitProjects.join(' / ')}
            {card.originProject ? ` · 来源：${card.originProject}` : ' · 来源：跨项目沉淀'}
          </div>
        </div>
      ))}
    </div>
  );
}
