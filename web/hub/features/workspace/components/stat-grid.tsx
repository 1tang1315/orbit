import type { WorkspaceStats } from '@/features/workspace/actions';
import { StatCard } from '@/features/workspace/components/stat-card';

import '../styles.scss';

export interface StatGridProps {
  stats: WorkspaceStats;
}

/** 4 张统计卡：接入项目 / L2 文档 / L3 知识卡 / 待复盘（警示色）。 */
export function StatGrid({ stats }: StatGridProps) {
  return (
    <section className="workspace-block" aria-label="工作区统计">
      <div className="stat-grid">
        <StatCard label="接入项目" value={stats.projectCount} note="较上月 +1" />
        <StatCard label="L2 文档" value={stats.l2Total} note="较上周 +4" />
        <StatCard label="L3 知识卡" value={stats.l3Total} note="较上周 +2" />
        <StatCard label="待复盘" value={stats.reviewPending} note="较昨日 +1" warn />
      </div>
    </section>
  );
}
