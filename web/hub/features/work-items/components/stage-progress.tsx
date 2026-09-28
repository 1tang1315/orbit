import type { StageMeta, StageTone } from '@/features/work-items/actions';

export interface StageProgressProps {
  /** 规范化后的 4 阶段（actions.ts 已保证非空 fallback）。 */
  stages: StageMeta[];
}

const STAGE_BLOCK_CLASS: Record<StageTone, string> = {
  done: 'stage-block is-done',
  current: 'stage-block is-current',
  pending: 'stage-block',
};

/**
 * 备注需要橙色警示（状态语义：橙 = 待确认）：
 * 未完成的阶段且备注里含「待 / 需」（如「复盘草稿待你过目」）。
 */
function isNoteWarn(stage: StageMeta): boolean {
  return stage.tone !== 'done' && /(待|需)/.test(stage.note);
}

/** 顶部 4 阶段进度条：done 紫顶线、current 橙顶线（globals.scss 已预置）。 */
export function StageProgress({ stages }: StageProgressProps) {
  if (stages.length === 0) {
    return null;
  }

  return (
    <section className="stage-progress" aria-label="阶段进度">
      {stages.map((stage) => (
        <div key={stage.no} className={STAGE_BLOCK_CLASS[stage.tone]}>
          <div className="stage-block-no">
            <span>{String(stage.no).padStart(2, '0')}</span>
            <span>{stage.title}</span>
          </div>
          {stage.note !== '' && (
            <div className={`stage-block-note${isNoteWarn(stage) ? ' is-warn' : ''}`}>
              {stage.note}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
