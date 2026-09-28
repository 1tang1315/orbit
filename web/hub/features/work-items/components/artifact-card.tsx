import { PlaceholderButton } from '@/components/ui/placeholder-button';
import type { ArtifactTone, WorkArtifact } from '@/features/work-items/actions';

export interface ArtifactCardProps {
  artifact: WorkArtifact;
  /** 屏 07 灰化列：卡片按钮禁用。 */
  disabled?: boolean;
}

const KIND_TAG_CLASS: Record<ArtifactTone, string> = {
  muted: 'tag',
  ok: 'tag tag-ok',
  pending: 'tag tag-pending',
};

/**
 * 产物卡：kind 标签（.tag 系列）+ 标题 + meta。
 *
 * highlight（橙框 = 待你过目）由 globals.scss 的 .artifact.is-highlight 负责；
 * showActions 的卡在底部给「状态 + 采纳」操作区，本期采纳为占位按钮。
 */
export function ArtifactCard({ artifact, disabled = false }: ArtifactCardProps) {
  const pending = artifact.confirmState === 'pending';

  return (
    <article className={`artifact${artifact.highlight ? ' is-highlight' : ''}`}>
      <span className={KIND_TAG_CLASS[artifact.tagTone]}>{artifact.kind}</span>
      <div className="artifact-title">{artifact.title}</div>
      <div className="artifact-meta">{artifact.meta}</div>

      {artifact.showActions && (
        <div className="artifact-actions">
          <span className={pending ? 'tag tag-pending' : 'tag tag-ok'}>
            {pending ? '待你过目' : '已确认'}
          </span>
          {disabled ? (
            <button type="button" className="btn" disabled>
              采纳
            </button>
          ) : (
            <PlaceholderButton
              label="采纳"
              hint="本期为示例数据，真实链路将在这里采纳该产物并更新确认状态。"
            />
          )}
        </div>
      )}
    </article>
  );
}
