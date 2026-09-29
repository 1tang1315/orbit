export interface WorkspaceHeaderProps {
  projectCount: number;
  /** 页面主标题：项目总览页传「项目总览」，动态流页传「项目动态」。 */
  title?: string;
}

/**
 * 首页/动态流页页头：标题组。GitHub 连接与导入走「GitHub 账户接入」卡，
 * 周报生成等占位按钮在真实链路接通后再挂回操作区。
 */
export function WorkspaceHeader({ projectCount, title = '项目总览' }: WorkspaceHeaderProps) {
  return (
    <header className="workspace-head">
      <div>
        <p className="eyebrow">工作区概览</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">
          {`${projectCount} 个项目接入中 · 自动沉淀 L1 事实 / L2 理解 / L3 跨项目技术知识`}
        </p>
      </div>
    </header>
  );
}
