import type {
  Activity,
  KnowledgeCard,
  Task,
} from '@/features/workspace/actions';
import { ActivityFeed } from '@/features/workspace/components/activity-feed';
import { L3CardList } from '@/features/workspace/components/l3-card-list';
import { ReviewQueueCard } from '@/features/workspace/components/review-queue-card';

import '../styles.scss';

export interface FeedSectionProps {
  activities: Activity[];
  queueTasks: Task[];
  l3Cards: KnowledgeCard[];
}

/** 主次分栏：左 2/3「最近动态」，右 1/3「待复盘任务」+「L3 技术知识」。 */
export function FeedSection({ activities, queueTasks, l3Cards }: FeedSectionProps) {
  return (
    <section className="workspace-block feed-grid">
      <ActivityFeed activities={activities} />
      <div className="feed-side">
        <ReviewQueueCard tasks={queueTasks} />
        <L3CardList cards={l3Cards} />
      </div>
    </section>
  );
}
