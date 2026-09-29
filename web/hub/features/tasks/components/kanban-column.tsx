import type { DragEvent, ReactNode } from 'react';

export interface KanbanColumnProps {
  /** 列标题（待规划 / 待办 / 进行中 / 待复盘 / 已完成）。 */
  label: string;
  /** 当前筛选下的卡片计数。 */
  count: number;
  /** 待复盘列（橙色列头）。 */
  review: boolean;
  /** 拖拽悬停在本列。 */
  isOver: boolean;
  /** 写动作进行中，暂不接受新的落下。 */
  disabled: boolean;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  children: ReactNode;
}

/** 看板单列：列头（标题 + 计数）+ 卡片堆；作为拖拽的放置目标。 */
export function KanbanColumn({
  label,
  count,
  review,
  isOver,
  disabled,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: KanbanColumnProps) {
  const className = [
    'kcol',
    review ? 'is-review' : '',
    isOver ? 'is-dragover' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={className}
      aria-label={`${label}（${count}）`}
      aria-disabled={disabled}
      onDragOver={(event) => {
        if (!disabled) {
          onDragOver(event);
        }
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        if (!disabled) {
          onDrop(event);
        }
      }}
    >
      <header
        className="kcol-head"
      >
        <span>{label}</span>
        <span className="kcol-count">{count}</span>
      </header>
      {children}
      {count === 0 && (
        <p className="ghost-note">拖拽任务卡到此列</p>
      )}
    </section>
  );
}
