'use client';

import { useState, useTransition } from 'react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '@/lib/db';

import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';

interface ColumnDef {
  status: TaskStatus;
  label: string;
  review: boolean;
}

/** 5 列看板（列定义只服务展示，服务端白名单以 actions.ts 为准）。 */
const COLUMNS: readonly ColumnDef[] = [
  { status: 'planned', label: '待规划', review: false },
  { status: 'todo', label: '待办', review: false },
  { status: 'doing', label: '进行中', review: false },
  { status: 'review', label: '待复盘', review: true },
  { status: 'done', label: '已完成', review: false },
];

export interface KanbanBoardProps {
  /** 已按 `?filter=` 服务端筛好的任务，拖拽落库后由 revalidatePath 刷新。 */
  tasks: Task[];
  /**
   * Server Action `moveTaskStatus` 的引用：由服务端页面 import 后经 props 下传
   * （actions.ts 依赖 node:sqlite，客户端组件不得直接 import 该模块）。
   */
  onMove: (taskId: string, status: TaskStatus) => Promise<void>;
}

/**
 * 看板网格（HTML5 列间拖拽）：
 * 拖起记录 taskId → 悬停列高亮 → 落下时调 Server Action `onMove`（即 moveTaskStatus），
 * 成功后由服务端 revalidatePath('/board') 回读，刷新后状态不丢。
 */
export function KanbanBoard({ tasks, onMove }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCardDragStart(event: DragEvent<HTMLElement>, taskId: string) {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  }

  function handleCardDragEnd() {
    setDraggingId(null);
    setOverStatus(null);
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overStatus !== status) {
      setOverStatus(status);
    }
  }

  function handleColumnDragLeave(event: DragEvent<HTMLElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setOverStatus(null);
  }

  function handleColumnDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setOverStatus(null);
    if (taskId === '' || isPending) {
      return;
    }
    startTransition(async () => {
      try {
        await onMove(taskId, status);
      } catch (error: unknown) {
        window.alert(
          error instanceof Error ? error.message : '移动任务失败，请稍后再试',
        );
      }
    });
  }

  const gridClass = [
    'board-grid',
    'transition-opacity',
    isPending ? 'opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClass}>
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);
        return (
          <KanbanColumn
            key={column.status}
            label={column.label}
            count={columnTasks.length}
            review={column.review}
            isOver={overStatus === column.status}
            disabled={isPending}
            onDragOver={(event) => handleColumnDragOver(event, column.status)}
            onDragLeave={handleColumnDragLeave}
            onDrop={(event) => handleColumnDrop(event, column.status)}
          >
            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDragging={draggingId === task.id}
                onDragStart={handleCardDragStart}
                onDragEnd={handleCardDragEnd}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
