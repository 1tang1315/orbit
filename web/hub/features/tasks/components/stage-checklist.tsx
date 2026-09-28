import { IconCheck } from '@/components/ui/icons';
import type { ChecklistStep } from '@/features/tasks/actions';

export interface StageChecklistProps {
  steps: ChecklistStep[];
}

function markClass(state: ChecklistStep['state']): string {
  if (state === 'done') {
    return 'stage-mark is-done';
  }
  return state === 'current' ? 'stage-mark is-current' : 'stage-mark';
}

/** 屏 06 左栏第 1 块：处理阶段 checklist（已完成 + 进行中 计为已推进）。 */
export function StageChecklist({ steps }: StageChecklistProps) {
  const advanced = steps.filter((step) => step.state !== 'todo').length;

  return (
    <section className="card">
      <div
        className="card-title"
      >
        <span>处理阶段</span>
        <span className="muted">{`${advanced} / ${steps.length} 已推进`}</span>
      </div>
      <ol className="stage-list">
        {steps.map((step) => (
          <li className="stage-row" key={step.title}>
            <span className={markClass(step.state)}>
              {step.state === 'done' && <IconCheck />}
            </span>
            <span className="stage-text">{step.title}</span>
            <span
              className={
                step.state === 'current'
                  ? 'stage-state is-current'
                  : 'stage-state'
              }
            >
              {step.note}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
