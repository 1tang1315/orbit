import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import type { Activity } from '@/features/workspace/actions';
import { ActivityItem } from '@/features/workspace/components/activity-item';

import '../styles.scss';

export interface ActivityFeedProps {
  activities: Activity[];
}

/**
 * 左栏「最近动态」卡（主次分栏的 2/3）。
 *
 * 「查看全部」落 /library：动态里的 L1/L2/L3 与复盘沉淀产物
 * 最终都归档在知识库，那里是本应用能回溯全部沉淀的唯一入口。
 */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="card">
      <div className="card-title">
        <span>最近动态</span>
        <Link href="/library" className="link link-arrow">
          查看全部
          <IconArrowRight />
        </Link>
      </div>

      {activities.length > 0 ? (
        <ul className="activity-list">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      ) : (
        <p className="muted">暂无新动态 · 接入仓库后，提交、文档和知识沉淀会实时出现在这里。</p>
      )}
    </div>
  );
}
