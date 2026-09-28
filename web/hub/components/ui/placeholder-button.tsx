'use client';

export interface PlaceholderButtonProps {
  label: string;
  /** 占位提示文案（点击弹出）。 */
  hint: string;
  variant?: 'default' | 'primary' | 'dark';
}

/**
 * 占位按钮：本期为示例数据，点击只弹中文提示，不执行真实动作。
 *
 * 用于「接入仓库 / 生成周报 / 重新扫描 / 生成文档 / 新建任务」等
 * 未来接真实数据链路的入口。
 */
export function PlaceholderButton({ label, hint, variant = 'default' }: PlaceholderButtonProps) {
  const className = variant === 'primary'
    ? 'btn btn-primary'
    : variant === 'dark'
      ? 'btn btn-dark'
      : 'btn';
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.alert(hint)}
    >
      {label}
    </button>
  );
}
