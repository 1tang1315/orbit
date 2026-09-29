import {
  getHomeFeed,
  getHomeL3Cards,
  getHomeReviewQueue,
  getHomeStats,
} from '@/features/workspace/actions';
import { FeedSection } from '@/features/workspace/components/feed-section';
import { StatGrid } from '@/features/workspace/components/stat-grid';
import { WorkspaceHeader } from '@/features/workspace/components/workspace-header';

/**
 * 动态流页（/feed）：工作区统计 + 最近动态 + 待复盘队列 + L3 知识卡。
 *
 * 本文件只做数据组装与区块排布：取数一律经 features/workspace/actions，
 * 实现落在本域组件（分层与依赖方向见 docs/开发规范/02 §1、§2.3）。
 */
export default function FeedPage() {
  const stats = getHomeStats();
  const activities = getHomeFeed(8);
  const queueTasks = getHomeReviewQueue(4);
  const l3Cards = getHomeL3Cards(4);

  return (
    <>
      <WorkspaceHeader projectCount={stats.projectCount} title="项目动态" />
      <StatGrid stats={stats} />
      <FeedSection
        activities={activities}
        queueTasks={queueTasks}
        l3Cards={l3Cards}
      />
    </>
  );
}
