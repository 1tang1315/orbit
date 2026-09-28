import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import type { KnowledgeCard } from '@/features/workspace/actions';

import '../styles.scss';

export interface L3CardListProps {
  cards: KnowledgeCard[];
}

/** 右栏「L3 技术知识」卡：「开始复习」跳屏 04（/review），「查看全部」跳 /tech-stack。 */
export function L3CardList({ cards }: L3CardListProps) {
  return (
    <div className="card">
      <div className="card-title">
        <span>L3 技术知识</span>
        {/* /review 是顶层屏但侧栏无入口（与 PDF 蓝本一致），从这张卡进入 */}
        <span className="flex items-center gap-3">
          <Link href="/review" className="link">
            开始复习
          </Link>
          <Link href="/tech-stack" className="link link-arrow">
            查看全部
            <IconArrowRight />
          </Link>
        </span>
      </div>

      {cards.length > 0 ? (
        cards.map((card) => (
          <div className="l3-item" key={card.id}>
            <div className="l3-title">{card.title}</div>
            <div className="l3-summary">{card.summary}</div>
          </div>
        ))
      ) : (
        <p className="muted">还没有沉淀 L3 知识卡。</p>
      )}
    </div>
  );
}
