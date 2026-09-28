import { PlaceholderButton } from '@/components/ui/placeholder-button';

import '../styles.scss';

export interface WorkspaceHeaderProps {
  projectCount: number;
}

/**
 * 首页页头：标题组 + 操作按钮。
 *
 * 「接入仓库 / 生成周报」本期无真实链路，用占位按钮弹中文提示，
 * 说明示例数据的边界；跳转类入口一律用 next/link（见各区块卡片）。
 */
export function WorkspaceHeader({ projectCount }: WorkspaceHeaderProps) {
  return (
    <header className="workspace-head">
      <div>
        <p className="eyebrow">工作区概览</p>
        <h1 className="page-title">项目动态</h1>
        <p className="page-sub">
          {`${projectCount} 个项目接入中 · 自动沉淀 L1 事实 / L2 理解 / L3 跨项目技术知识`}
        </p>
      </div>
      <div className="workspace-head-actions">
        <PlaceholderButton
          label="接入仓库"
          variant="primary"
          hint="本期为示例数据：真实 GitHub 仓库扫描与接入不在本期范围，将在后续里程碑接入。"
        />
        <PlaceholderButton
          label="生成周报"
          hint="本期为示例数据：周报依赖 AI 报告生成链路，不在本期范围，将在后续里程碑接入。"
        />
      </div>
    </header>
  );
}
