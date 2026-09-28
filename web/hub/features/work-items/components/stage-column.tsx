import { PlaceholderButton } from '@/components/ui/placeholder-button';

import type { ColumnNoteTone, WorkItemColumn } from '../actions';
import { ArtifactAddButton } from './artifact-add-button';
import { ArtifactCard } from './artifact-card';

export interface StageColumnProps {
  column: WorkItemColumn;
}

const COLUMN_NOTE_CLASS: Record<ColumnNoteTone, string> = {
  plain: 'pipe-col-note',
  ok: 'pipe-col-note is-ok',
  warn: 'pipe-col-note is-warn',
};

/**
 * 一列产物（屏 05 / 07 共用）：列头（列名 + 计数 / 状态说明）+
 * 按 stage 归组的产物卡 + 每列底部「新增产物」占位。
 *
 * 屏 07 的规格列整列灰化（readonly）：降透明度、禁用新增与卡片按钮；
 * 第 4 列额外给「待人工确认」按钮占位。
 */
export function StageColumn({ column }: StageColumnProps) {
  return (
    <section className={`pipe-col${column.readonly ? ' is-readonly' : ''}`}>
      <header className="pipe-col-head">
        <span>{column.title}</span>
        <span className={COLUMN_NOTE_CLASS[column.noteTone]}>{column.note}</span>
      </header>

      {column.artifacts.length === 0 ? (
        <div className="ghost-note">暂无产物</div>
      ) : (
        column.artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} disabled={column.readonly} />
        ))
      )}

      {column.manualConfirm && (
        <div className="pipe-manual-confirm">
          <PlaceholderButton
            label="待人工确认"
            hint="本期为示例数据，真实链路将在这里发起人工收口确认。"
          />
        </div>
      )}

      <ArtifactAddButton
        hint="本期为示例数据，真实链路将在这里新增产物并写回流水线。"
        disabled={column.readonly}
      />
    </section>
  );
}
