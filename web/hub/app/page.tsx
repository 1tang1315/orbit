import {
  getHomeFeed,
  getHomeL3Cards,
  getHomeProjects,
  getHomeReviewQueue,
  getHomeStats,
} from '@/features/workspace/actions';
import { FeedSection } from '@/features/workspace/components/feed-section';
import { ProjectSection } from '@/features/workspace/components/project-section';
import { StatGrid } from '@/features/workspace/components/stat-grid';
import { WorkspaceHeader } from '@/features/workspace/components/workspace-header';

/**
 * 01 首页 · 动态流。
 *
 * 本文件只做数据组装与区块排布：取数一律经 features/workspace/actions，
 * 实现落在本域组件（分层与依赖方向见 docs/开发规范/02 §1、§2.3）。
 */
export default function HomePage() {
  const stats = getHomeStats();
  const projects = getHomeProjects(2);
  const activities = getHomeFeed(8);
  const queueTasks = getHomeReviewQueue(4);
  const l3Cards = getHomeL3Cards(4);

  return (
    <>
      <WorkspaceHeader projectCount={stats.projectCount} />
      <StatGrid stats={stats} />
      <ProjectSection projects={projects} />
      <FeedSection
        activities={activities}
        queueTasks={queueTasks}
        l3Cards={l3Cards}
      />
    </>
  );
}
