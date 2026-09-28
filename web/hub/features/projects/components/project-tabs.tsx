import Link from 'next/link';

/** 六个 Tab 的固定顺序与文案（URL：?tab=<key>，缺省 = 概览）。 */
export const PROJECT_TABS = [
  { key: 'overview', label: '概览' },
  { key: 'arch', label: '架构图' },
  { key: 'docs', label: '文档' },
  { key: 'commits', label: '提交历史' },
  { key: 'cards', label: '技术栈知识' },
  { key: 'retro', label: '复盘' },
] as const;

export type ProjectTabKey = (typeof PROJECT_TABS)[number]['key'];

/** 解析 ?tab= 参数：缺省、数组或未知值一律回落到概览。 */
export function resolveProjectTab(raw: string | string[] | undefined): ProjectTabKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const matched = PROJECT_TABS.find((tab) => tab.key === value);
  return matched ? matched.key : 'overview';
}

export interface ProjectTabsProps {
  projectId: string;
  active: ProjectTabKey;
}

/**
 * 屏 02 六 Tab 导航：纯 Link（searchParams 驱动，服务端渲染、零客户端 JS）。
 */
export function ProjectTabs({ projectId, active }: ProjectTabsProps) {
  const base = `/projects/${projectId}`;
  return (
    <nav className="tabs" aria-label="项目详情视图">
      {PROJECT_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === 'overview' ? base : `${base}?tab=${tab.key}`}
          className={`tab${active === tab.key ? ' is-active' : ''}`}
          aria-current={active === tab.key ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
