'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  IconBoard,
  IconBook,
  IconChip,
  IconGrid,
  IconLogo,
  IconPulse,
  IconRetro,
} from '@/components/ui/icons';

export interface SidebarProps {
  syncText: string;
}

interface NavEntry {
  href: string;
  label: string;
  icon: typeof IconPulse;
  exact?: boolean;
}

const WORKSPACE_NAV: NavEntry[] = [
  { href: '/feed', label: '动态流', icon: IconPulse },
  { href: '/', label: '项目', icon: IconGrid, exact: true },
  { href: '/library', label: '知识库', icon: IconBook },
  { href: '/board', label: '任务看板', icon: IconBoard },
  { href: '/tech-stack', label: '技术栈知识', icon: IconChip },
  { href: '/retros', label: '复盘报告', icon: IconRetro },
];

/**
 * 左侧栏：工作区分组导航 + 底部连接状态卡。
 *
 * 「项目」指向首页的项目总览网格（含项目详情页的高亮），
 * 动态流独立为 /feed，侧栏不再单列每个项目。
 */
export function Sidebar({ syncText }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (entry: NavEntry): boolean => {
    if (entry.exact) {
      // 「项目」覆盖首页总览与项目详情页（/projects/[id]）的高亮。
      return pathname === '/' || pathname.startsWith('/projects');
    }
    return pathname === entry.href;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <IconLogo />
        </span>
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">项目知识中枢</span>
        </span>
      </div>

      <nav className="nav-group" aria-label="工作区">
        <div className="nav-group-label">工作区</div>
        {WORKSPACE_NAV.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`nav-item${isActive(entry) ? ' is-active' : ''}`}
            >
              <span className="nav-item-icon">
                <Icon />
              </span>
              {entry.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <p>
          <span className="status-dot" />
          数据已同步 ·
          {' '}
          {syncText}
        </p>
        <p>
          <span className="status-dot" />
          MCP 就绪 · 外部 Agent 可调用
        </p>
      </div>
    </aside>
  );
}
