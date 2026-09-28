import type { Metadata } from 'next';
import Link from 'next/link';

import { PlaceholderButton } from '@/components/ui/placeholder-button';
import {
  getBoardTasks,
  getRunningSessionCount,
  moveTaskStatus,
} from '@/features/tasks/actions';
import type { BoardFilter } from '@/features/tasks/actions';
import { KanbanBoard } from '@/features/tasks/components/kanban-board';

export const metadata: Metadata = {
  title: '任务看板',
};

interface FilterTab {
  value: BoardFilter;
  label: string;
}

/** 顶部筛选 Tab：与 `?filter=` 一一对应，服务端渲染、刷新保持。 */
const FILTER_TABS: readonly FilterTab[] = [
  { value: 'all', label: '全部' },
  { value: 'mine', label: '我的' },
  { value: 'session', label: '交给会话执行' },
  { value: 'cron', label: '定时任务' },
];

/** 白名单解析：非法 filter 一律回落到「全部」。 */
function parseFilter(raw: string | string[] | undefined): BoardFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'mine' || value === 'session' || value === 'cron') {
    return value;
  }
  return 'all';
}

interface BoardPageProps {
  searchParams: Promise<{ filter?: string | string[] }>;
}

/** 03 任务看板：顶行（标题 + 执行中会话数 + 新建任务）+ 筛选 Tab + 5 列看板。 */
export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const [tasks, runningCount] = await Promise.all([
    getBoardTasks(filter),
    getRunningSessionCount(),
  ]);

  return (
    <section>
      <div className="board-head">
        <div>
          <p className="eyebrow">任务管理</p>
          <h1 className="page-title">任务看板</h1>
          <p className="page-sub">
            {`${runningCount} 个会话执行中 · 拖拽卡片到目标列即可切换状态`}
          </p>
        </div>
        <PlaceholderButton
          label="新建任务"
          variant="primary"
          hint="本期为示例数据：真实场景将在这里打开新建任务表单（标题 / 优先级 / 交给谁执行）。"
        />
      </div>

      <nav className="filter-tabs" aria-label="任务筛选">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/board?filter=${tab.value}`}
            className={
              filter === tab.value
                ? 'filter-tab is-active'
                : 'filter-tab'
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <KanbanBoard tasks={tasks} onMove={moveTaskStatus} />
    </section>
  );
}
