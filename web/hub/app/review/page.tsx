import type { Metadata } from 'next';

import { getReviewScreenData } from '@/features/knowledge/actions';
import { ReviewStage } from '@/features/knowledge/components/review-stage';

export const metadata: Metadata = {
  title: '移动复习',
};

/**
 * 04 移动复习（HUB_PLAN §6 屏 04）：
 * 桌面页内嵌 390 宽手机框，复习卡走 reviewCard 写路径（刷新后进度保持）。
 */
export default function ReviewPage() {
  const data = getReviewScreenData();
  return <ReviewStage data={data} />;
}
