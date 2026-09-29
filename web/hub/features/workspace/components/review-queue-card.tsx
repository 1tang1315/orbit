import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import type { Task } from '@/features/workspace/actions';

import '../styles.scss';

export interface ReviewQueueCardProps {
  tasks: Task[];
}

/** 右栏「待复盘任务」卡：「去任务看板」跳 /board（任务的全量视图）。 */
export function ReviewQueueCard({ tasks }: ReviewQueueCardProps) {
  return (
    <div className="card">
      <div className="card-title">
        <span>待复盘任务</span>
        <Link href="/board" className="link link-arrow">
          去任务看板
          <IconArrowRight />
        </Link>
      </div>

      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div className="queue-item" key={task.id}>
            <div className="queue-title">{task.title}</div>
            <div className="queue-meta">{task.meta}</div>
          </div>
        ))
      ) : (
        <p className="muted">所有任务都已归档 · 新的复盘任务会在这里出现。</p>
      )}
    </div>
  );
}
