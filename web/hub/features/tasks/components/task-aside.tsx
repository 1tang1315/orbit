import Link from 'next/link';

import { formatRelative } from '@/components/ui/format';
import type { Session, Task, TaskHandler, TaskStatus } from '@/features/tasks/actions';

export interface TaskAsideProps {
  task: Task;
  session: Session | null;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  planned: '待规划',
  todo: '待办',
  doing: '进行中',
  review: '待复盘',
  done: '已完成',
};

const HANDLER_LABELS: Record<TaskHandler, string> = {
  me: '你',
  session: 'MCP 执行',
  cron: '定时任务',
};

const SOURCE_LABELS: Record<Task['source'], string> = {
  manual: '手动',
  ai: 'AI',
  issue: 'Issue',
};

/** 状态值用色：进行中紫（激活态）、待复盘橙（待你处理）、已完成绿（标签）。 */
function statusValue(status: TaskStatus) {
  if (status === 'done') {
    return <span className="tag tag-ok">{STATUS_LABELS.done}</span>;
  }
  if (status === 'doing') {
    return <span className="prop-value-accent">{STATUS_LABELS.doing}</span>;
  }
  if (status === 'review') {
    return <span className="prop-value-warn">{STATUS_LABELS.review}</span>;
  }
  return <span>{STATUS_LABELS[status]}</span>;
}

/** 「接下来会发生什么」：按任务当前状态给 3–4 条贴合的下一步。 */
function buildNextSteps(task: Task): string[] {
  switch (task.status) {
    case 'planned':
      return [
        '补充任务细节，把状态推进到「待办」',
        '指定交给 MCP 执行，或等定时任务到点调用',
        '执行中的关键决策会生成人机交接卡等你确认',
        '完成后进入「待复盘」，自动起草复盘草稿',
      ];
    case 'todo':
      return [
        'MCP 按队列领取任务，开始执行',
        '步骤日志会实时回传到本页 MCP 执行卡',
        '遇到需要你拍板的点，会弹出人机交接卡',
        '全部步骤完成后状态推进到「待复盘」',
      ];
    case 'doing':
      return [
        'MCP 继续推进处理阶段，步骤日志持续更新',
        '关键决策生成人机交接卡，等你采纳或修改',
        '暂存区改动先由外部 MCP 服务隔离，不直接进主干',
        '执行完成后状态推进到「待复盘」',
      ];
    case 'review':
      return [
        '你过目改动摘要与复盘草稿，给出通过或修改意见',
        '通过后把复盘草稿一键落库到 L2',
        '状态推进到「已完成」，卡片移到已完成列',
        '关联的 Issue 与工作项状态同步回写',
      ];
    case 'done':
      return [
        '复盘草稿已写入 L2，可在项目详情回看',
        '可复用经验提炼为 L3 知识卡，进入复习队列',
        '任务卡保留在已完成列，可随时回看时间线',
      ];
    default:
      return [
        '状态异常：请联系维护者核对看板数据',
      ];
  }
}

/** 屏 06 右栏：任务属性 / 来源与关联 / 时间线 / 接下来会发生什么 / 完成后自动产出。 */
export function TaskAside({ task, session }: TaskAsideProps) {
  const hasRelation =
    task.issueNo !== null || task.workItemId !== null || task.sessionId !== null;

  return (
    <div>
      <section className="aside-card">
        <h2 className="aside-title">任务属性</h2>
        <dl>
          <div className="prop-row">
            <dt>优先级</dt>
            <dd
              className={
                task.priority <= 1
                  ? 'prop-value-warn'
                  : undefined
              }
            >
              {`P${task.priority}`}
            </dd>
          </div>
          <div className="prop-row">
            <dt>状态</dt>
            <dd>{statusValue(task.status)}</dd>
          </div>
          <div className="prop-row">
            <dt>来源</dt>
            <dd>{SOURCE_LABELS[task.source]}</dd>
          </div>
          <div className="prop-row">
            <dt>执行者</dt>
            <dd>{HANDLER_LABELS[task.handler]}</dd>
          </div>
          <div className="prop-row">
            <dt>创建时间</dt>
            <dd>{formatRelative(task.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="aside-card">
        <h2 className="aside-title">来源与关联</h2>
        {hasRelation ? (
          <dl>
            {task.issueNo !== null && (
              <div className="prop-row">
                <dt>Issue</dt>
                <dd>
                  <a
                    className="link"
                    href="#"
                    title="示例外链，本期不跳转"
                  >
                    {`#${task.issueNo} · 外链示例`}
                  </a>
                </dd>
              </div>
            )}
            {task.workItemId !== null && (
              <div className="prop-row">
                <dt>工作项</dt>
                <dd>
                  <Link
                    className="link mono"
                    href={`/work-items/${task.workItemId}`}
                  >
                    {task.workItemId}
                  </Link>
                </dd>
              </div>
            )}
            {task.sessionId !== null && (
              <div className="prop-row">
                <dt>MCP 执行</dt>
                <dd>
                  {session !== null && session.id === task.sessionId
                    ? `MCP 执行 #${session.no}`
                    : `MCP 执行 ${task.sessionId}`}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="ghost-note">暂无关联项 · 从 Issue 导入或关联工作项后会自动显示。</p>
        )}
      </section>

      {task.timeline !== null && task.timeline.length > 0 && (
        <section className="aside-card">
          <h2 className="aside-title">时间线</h2>
          <div>
            {task.timeline.map((item) => (
              <div className="timeline-row" key={`${item.label}-${item.time}`}>
                <span
                  className={
                    item.tone === 'current'
                      ? 'timeline-dot is-current'
                      : 'timeline-dot'
                  }
                />
                <span>{item.label}</span>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="aside-card">
        <h2 className="aside-title">接下来会发生什么</h2>
        <div>
          {buildNextSteps(task).map((step, index) => (
            <div className="next-row" key={step}>
              <span className="next-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="aside-card">
        <h2 className="aside-title">完成后自动产出</h2>
        <div>
          <div className="auto-row">
            <span className="timeline-dot is-l2" />
            <span>复盘草稿自动写入 L2 · 项目理解层</span>
          </div>
          <div className="auto-row">
            <span className="timeline-dot is-l3" />
            <span>可复用经验提炼为 L3 知识卡</span>
          </div>
          <div className="auto-row">
            <span className="timeline-dot" />
            <span>时间线与首页动态同步更新</span>
          </div>
        </div>
      </section>
    </div>
  );
}
