import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import { formatNumber, formatRelative } from '@/components/ui/format';
import type { Project } from '@/features/workspace/actions';

import '../styles.scss';

export interface ProjectSectionProps {
  projects: Project[];
}

/**
 * 「接入项目」区块：两列项目卡（项目名 + 彩点 + stack + 最近同步 meta）。
 *
 * 整卡是链接，点进项目详情；「查看全部」与侧栏「项目」入口同规——
 * 本期没有 /projects 列表路由，落到最近同步的第一个项目，避免死链。
 */
export function ProjectSection({ projects }: ProjectSectionProps) {
  const firstId = projects[0]?.id;

  return (
    <section className="workspace-block">
      <div className="workspace-section-head">
        <h2 className="workspace-section-title">接入项目</h2>
        {firstId ? (
          <Link href={`/projects/${firstId}`} className="link link-arrow">
            查看全部
            <IconArrowRight />
          </Link>
        ) : null}
      </div>

      {projects.length > 0 ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card project-card"
            >
              <div className="project-card-name">
                <span className="nav-dot" style={{ backgroundColor: project.color }} />
                {project.name}
              </div>
              <div className="project-card-stack">{project.stack.join(' · ')}</div>
              <div className="project-card-meta">
                {`最近同步 ${formatRelative(project.lastSyncedAt)} · ${formatNumber(project.commitCount)} 次提交`}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">还没有接入项目 · 点击上方「接入仓库」开始连接 GitHub。</p>
      )}
    </section>
  );
}
