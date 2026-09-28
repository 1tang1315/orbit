import type { FileChange, Session } from '@/features/tasks/actions';

export interface SessionCardProps {
  session: Session;
}

/** 进度：以 steps 中 current 的位置计算（无 current 时按已完成步数，全完成即 100%）。 */
function progressPercent(session: Session): number {
  const total = session.steps.length;
  if (total === 0) {
    return 0;
  }
  const doneCount = session.steps.filter((step) => step.state === 'done').length;
  const currentIndex = session.steps.findIndex((step) => step.state === 'current');
  const passed = currentIndex >= 0 ? currentIndex : doneCount;
  return Math.round((passed / total) * 100);
}

/** 暂存区圆点：新增绿 / 普通灰 / 待补与告警橙。 */
function dotClass(tone: FileChange['tone']): string {
  if (tone === 'plain') {
    return 'change-dot is-muted';
  }
  return tone === 'warn' ? 'change-dot is-warn' : 'change-dot';
}

/** 增删行右侧文案色：新增绿 / 告警橙 / 普通次级灰。 */
function diffClass(tone: FileChange['tone']): string {
  if (tone === 'add') {
    return 'change-diff is-add';
  }
  return tone === 'warn' ? 'change-diff is-warn' : 'change-diff';
}

/** 屏 06 左栏第 2 块：会话执行卡（进度条 + 步骤日志 + 暂存区文件列表）。 */
export function SessionCard({ session }: SessionCardProps) {
  const percent = progressPercent(session);
  const doneCount = session.steps.filter((step) => step.state === 'done').length;

  return (
    <section className="card">
      <div className="session-head">
        <span className="session-name">
          {`会话 #${session.no}`}
          <span className="chip">{`${session.queue} 队列`}</span>
        </span>
        <span
          className="flex
            items-center
            gap-2"
        >
          <span className="muted">{`已运行 ${session.elapsedMin} 分钟`}</span>
          <span className="tag tag-pending">{session.status}</span>
        </span>
      </div>

      <div
        className="mt-4"
      >
        <div className="progress">
          <i style={{ width: `${percent}%` }} />
        </div>
        <p className="ghost-note mt-2">
          {`已完成 ${doneCount} / ${session.steps.length} 步 · ${percent}%`}
        </p>
      </div>

      {session.steps.length > 0 && (
        <>
          <p
            className="muted
              mt-4
              mb-1"
          >
            步骤日志
          </p>
          <div>
            {session.steps.map((step, index) => (
              <div className="session-step" key={`${step.title}-${index}`}>
                <span
                  className={
                    step.state === 'current'
                      ? 'session-step-dot is-current'
                      : 'session-step-dot'
                  }
                />
                <span>{step.title}</span>
                <span
                  className={
                    step.state === 'current'
                      ? 'session-step-time is-current'
                      : 'session-step-time'
                  }
                >
                  {step.time}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {session.changes.length > 0 && (
        <>
          <p
            className="muted
              mt-4
              mb-1"
          >
            {`暂存区 · ${session.changes.length} 个文件`}
          </p>
          <div>
            {session.changes.map((change) => (
              <div className="change-row" key={change.path}>
                <span className={dotClass(change.tone)} />
                <span>{change.path}</span>
                <span className={diffClass(change.tone)}>{change.diff}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
