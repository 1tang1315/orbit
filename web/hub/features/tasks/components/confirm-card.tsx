import { PlaceholderButton } from '@/components/ui/placeholder-button';
import { formatRelative, formatShortDate } from '@/components/ui/format';
import { acceptConfirmation } from '@/features/tasks/actions';
import type { Confirmation, Task } from '@/features/tasks/actions';

import { AcceptButton } from './accept-button';

export interface ConfirmCardProps {
  confirmation: Confirmation;
  task: Task;
}

/** 交接状态文案：橙=待你确认，绿=已采纳/已修改执行。 */
function stateText(state: Confirmation['state']): string {
  if (state === 'accepted') {
    return '已采纳';
  }
  return state === 'edited' ? '已修改执行' : '待你确认';
}

/** 屏 06 左栏第 3 块：人机交接橙框卡（pending 给两个动作，采纳后转已确认）。 */
export function ConfirmCard({ confirmation, task }: ConfirmCardProps) {
  const accepted = confirmation.state !== 'pending';
  const today = formatShortDate(new Date().toISOString());

  return (
    <section
      className={
        accepted
          ? 'confirm-card is-accepted'
          : 'confirm-card'
      }
    >
      <div className="confirm-label">
        <span>{`人机交接 · ${stateText(confirmation.state)}`}</span>
        <time dateTime={task.createdAt}>{formatRelative(task.createdAt)}</time>
      </div>
      <h2 className="confirm-title">{confirmation.question}</h2>
      <p className="confirm-body">{confirmation.body}</p>

      {accepted ? (
        <div className="confirm-actions">
          <span className="tag tag-ok">
            {confirmation.state === 'accepted'
              ? `已采纳 · ${today} 已按建议执行`
              : `已按你的修改执行 · ${today}`}
          </span>
        </div>
      ) : (
        <div className="confirm-actions">
          <AcceptButton
            confirmationId={confirmation.id}
            taskId={task.id}
            onAccept={acceptConfirmation}
          />
          <PlaceholderButton
            label="我要改一下"
            hint="打开修改表单，调整 AI 建议后通过 MCP 执行。当前为示例数据。"
          />
        </div>
      )}
    </section>
  );
}
