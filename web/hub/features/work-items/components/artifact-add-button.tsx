'use client';

import { IconPlus } from '@/components/ui/icons';

export interface ArtifactAddButtonProps {
  /** 占位提示文案（点击弹出，说明本期为示例数据）。 */
  hint: string;
  /** 屏 07 灰化列禁用新增。 */
  disabled?: boolean;
}

/**
 * 每列底部的「新增产物」占位：本期只弹中文提示，不写库。
 *
 * 视觉用 globals.scss 的 .artifact-add（虚线框），与通用 .btn 区分。
 */
export function ArtifactAddButton({ hint, disabled = false }: ArtifactAddButtonProps) {
  return (
    <button
      type="button"
      className="artifact-add"
      disabled={disabled}
      onClick={() => window.alert(hint)}
    >
      <IconPlus />
      <span>新增产物</span>
    </button>
  );
}
