import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getConfirmation,
  getSessionByTask,
  getTask,
} from '@/features/tasks/actions';
import { ConfirmCard } from '@/features/tasks/components/confirm-card';
import { SessionCard } from '@/features/tasks/components/session-card';
import { StageChecklist } from '@/features/tasks/components/stage-checklist';
import { TaskAside } from '@/features/tasks/components/task-aside';

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await getTask(id);
  return { title: task === null ? '任务详情' : task.title };
}

/** 06 任务详情：左（处理阶段 / MCP 执行 / 人机交接）+ 右（属性 / 关联 / 时间线 / 下一步 / 自动产出）。 */
export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const task = await getTask(id);
  if (task === null) {
    notFound();
  }
  const [session, confirmation] = await Promise.all([
    getSessionByTask(task.id),
    getConfirmation('task', task.id),
  ]);
  const hasChecklist = task.checklist !== null && task.checklist.length > 0;
  const hasLeftBlocks = hasChecklist || session !== null || confirmation !== null;

  return (
    <section>
      <nav className="breadcrumb" aria-label="面包屑">
        <Link href="/board">任务看板</Link>
        <span aria-hidden="true">/</span>
        <span>任务详情</span>
      </nav>
      <h1 className="page-title">{task.title}</h1>
      <p className="page-sub">{task.meta}</p>

      <div className="detail-grid">
        <div
          className="flex
            flex-col
            gap-4"
        >
          {hasChecklist && task.checklist !== null && (
            <StageChecklist steps={task.checklist} />
          )}
          {session !== null && <SessionCard session={session} />}
          {confirmation !== null && (
            <ConfirmCard confirmation={confirmation} task={task} />
          )}
          {!hasLeftBlocks && (
            <p className="ghost-note">
              任务尚未开始执行 · 指定执行者后，处理阶段、MCP 日志和人机交接记录会自动填充。
            </p>
          )}
        </div>
        <TaskAside task={task} session={session} />
      </div>
    </section>
  );
}
