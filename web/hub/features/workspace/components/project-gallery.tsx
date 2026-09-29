import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import { formatNumber, formatRelative } from '@/components/ui/format';
import type { Project } from '../actions';
import '../styles.scss';

export interface ProjectGalleryProps {
  projects: Project[];
}

/**
 * 首页「接入项目」总览网格：电商商品卡式的流式布局。
 *
 * 整卡是链接，点进项目详情；封面带用项目色渐变 + 首字母头像，
 * 网格随内容区宽度自适应换行（auto-fill），项目多时自然流式排布。
 */
export function ProjectGallery({ projects }: ProjectGalleryProps) {
  if (projects.length === 0) {
    return (
      <section className="card workspace-block">
        <p className="muted">
          还没有接入项目 · 在上方「GitHub 账户接入」卡里连接账户并导入仓库，项目会出现在这里。
        </p>
      </section>
    );
  }

  return (
    <section className="workspace-block">
      <div className="workspace-section-head">
        <h2 className="workspace-section-title">接入项目</h2>
        <span className="muted">{`${projects.length} 个`}</span>
      </div>

      <div className="gallery-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="card gallery-card"
          >
            <div
              className="gallery-cover"
              style={{
                background: `linear-gradient(135deg, ${project.color}2E, ${project.color}14)`,
              }}
            >
              <span
                className="gallery-avatar"
                style={{ backgroundColor: project.color }}
                aria-hidden
              >
                {project.name.charAt(0).toUpperCase()}
              </span>
              <span className="gallery-cover-repo">{project.repo}</span>
            </div>

            <div className="gallery-body">
              <div className="gallery-name">
                <span className="nav-dot" style={{ backgroundColor: project.color }} />
                {project.name}
              </div>

              {project.stack.length > 0 ? (
                <div className="gallery-tags">
                  {project.stack.map((tech) => (
                    <span key={tech} className="tag">{tech}</span>
                  ))}
                </div>
              ) : null}

              <div className="gallery-stats">
                <span className="gallery-stat">
                  <b>{formatNumber(project.commitCount)}</b>
                  提交
                </span>
                <span className="gallery-stat">
                  <b>{formatNumber(project.branchCount)}</b>
                  分支
                </span>
                <span className="gallery-stat">
                  <b>{formatNumber(project.l2Count)}</b>
                  L2 文档
                </span>
              </div>

              <div className="gallery-foot">
                <span>{`最近同步 ${formatRelative(project.lastSyncedAt)}`}</span>
                <span className="gallery-foot-arrow">
                  <IconArrowRight />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
