import type { ReviewCardView } from '@/features/knowledge/actions';

import { ReviewActions, type ReviewHandler } from './review-actions';

export interface ReviewCardProps {
  card: ReviewCardView;
  /** 已掌握数 / 今日总数（头部进度）。 */
  masteredCount: number;
  total: number;
  /** Server Action 引用，由 ReviewStage（服务端）传入，按钮不直连 actions.ts。 */
  onReview: ReviewHandler;
}

/**
 * 屏 04 复习卡：L3 徽标 + 已掌握进度 + 标题 / 摘要 / 来源 + 两枚操作按钮。
 * 按钮为独立客户端叶子（ReviewActions），本组件保持服务端渲染。
 */
export function ReviewCard({ card, masteredCount, total, onReview }: ReviewCardProps) {
  return (
    <article className="review-card">
      <div className="review-card-head">
        <span className="tag tag-l3">L3 技术知识</span>
        <span className="review-progress">{`${masteredCount}/${total}`}</span>
      </div>
      <h2 className="review-card-title">{card.title}</h2>
      <p className="review-card-summary">{card.summary}</p>
      <p className="review-card-source">{`来源 ${card.originText} · 命中 ${card.hitText}`}</p>
      <div className="review-actions">
        <ReviewActions cardId={card.id} onReview={onReview} />
      </div>
    </article>
  );
}
