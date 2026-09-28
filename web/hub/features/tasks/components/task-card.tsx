import Link from 'next/link';
import type { DragEvent } from 'react';

import type { Task } from '@/lib/db';

export interface TaskCardProps {
  task: Task;
  /** 正在被拖拽（半透明反馈）。 */
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLElement>, taskId: string) => void;
  onDragEnd: () => void;
}

/** 优先级强调：0 → is-p0、1 → is-p1（红系高优先级），2/3 保持次级灰。 */
function priorityClass(priority: number): string {
  if (priority === 0) {
    return ' is-p0';
  }
  return priority === 1 ? ' is-p1' : '';
}

/** flag 语义色：warn 橙（默认无修饰）/ ok 绿 / accent 紫。 */
function flagClass(tone: Task['flags'][number]['tone']): string {
  if (tone === 'ok') {
    return ' is-ok';
  }
  return tone === 'accent' ? ' is-accent' : '';
}

/** 看板卡片：P0–P3 + #号 + 标题 + meta + flags，整体可拖拽、可点进 06。 */
export function TaskCard({ task, isDragging, onDragStart, onDragEnd }: TaskCardProps) {
  const className = [
    'task-card',
    task.inReviewQueue ? 'is-highlight' : '',
    isDragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
    >
      <Link href={`/tasks/${task.id}`}>
        <div
          className="flex
            items-center
            justify-between
            gap-2"
        >
          <span className={`task-priority${priorityClass(task.priority)}`}>
            {`P${task.priority}`}
          </span>
          {task.issueNo !== null && (
            <span
              className="mono
                muted"
            >
              {`#${task.issueNo}`}
            </span>
          )}
        </div>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">{task.meta}</div>
        {task.flags.map((flag) => (
          <div
            key={`${flag.tone}-${flag.text}`}
            className={`task-flag${flagClass(flag.tone)}`}
          >
            {flag.text}
          </div>
        ))}
      </Link>
    </article>
  );
}
