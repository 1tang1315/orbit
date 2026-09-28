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

export interface SidebarProject {
  id: string;
  name: string;
  color: string;
}

export interface SidebarProps {
  projects: SidebarProject[];
  projectCount: number;
  syncText: string;
}

interface NavEntry {
  href: string;
  label: string;
  icon: typeof IconPulse;
  exact?: boolean;
}

const WORKSPACE_NAV: NavEntry[] = [
  { href: '/', label: '动态流', icon: IconPulse, exact: true },
  { href: '/projects', label: '项目', icon: IconGrid },
  { href: '/library', label: '知识库', icon: IconBook },
  { href: '/board', label: '任务看板', icon: IconBoard },
  { href: '/tech-stack', label: '技术栈知识', icon: IconChip },
  { href: '/retros', label: '复盘报告', icon: IconRetro },
];

/** 左侧栏：工作区分组 + 项目分组 + 底部连接状态卡。 */
export function Sidebar({ projects, projectCount, syncText }: SidebarProps) {
  const pathname = usePathname();
  const firstProject = projects[0]?.id ?? 'sk-mind';

  const isActive = (entry: NavEntry): boolean => {
    if (entry.href === '/projects') {
      return pathname.startsWith('/projects');
    }
    if (entry.exact) {
      return pathname === entry.href;
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
          <span className="sidebar-brand-meta">
            DSH ·
            {' '}
            {projectCount}
            {' '}
            个项目
          </span>
        </span>
      </div>

      <nav className="nav-group" aria-label="工作区">
        <div className="nav-group-label">工作区</div>
        {WORKSPACE_NAV.map((entry) => {
          const Icon = entry.icon;
          const href = entry.href === '/projects' ? `/projects/${firstProject}` : entry.href;
          return (
            <Link
              key={entry.href}
              href={href}
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

      <nav className="nav-group" aria-label="项目">
        <div className="nav-group-label">项目</div>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className={`nav-item nav-project${pathname === `/projects/${project.id}` ? ' is-active' : ''}`}
          >
            <span className="nav-dot" style={{ backgroundColor: project.color }} />
            {project.name}
          </Link>
        ))}
      </nav>

      <div className="sidebar-status">
        <p>
          <span className="status-dot" />
          GitHub 已连接 ·
          {' '}
          {syncText}
        </p>
        <p>
          <span className="status-dot" />
          DSH 运行中 · 本地优先
        </p>
      </div>
    </aside>
  );
}
