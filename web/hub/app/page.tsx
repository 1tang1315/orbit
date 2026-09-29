import { Suspense } from 'react';

import { GithubSection } from '@/features/github/components/github-section';
import { getHomeStats, getOverviewProjects } from '@/features/workspace/actions';
import { ProjectGallery } from '@/features/workspace/components/project-gallery';
import { StatGrid } from '@/features/workspace/components/stat-grid';
import { WorkspaceHeader } from '@/features/workspace/components/workspace-header';

/**
 * 01 首页 · 项目总览。
 *
 * 本文件只做数据组装与区块排布：取数一律经各业务域 actions，
 * 实现落在本域组件（分层与依赖方向见 docs/开发规范/02 §1、§2.3）。
 * GitHub 区块包 Suspense：外部 API 慢/挂只影响卡片自身，首屏即时渲染。
 */
export default function HomePage() {
  const stats = getHomeStats();
  const projects = getOverviewProjects();

  return (
    <>
      <WorkspaceHeader projectCount={stats.projectCount} />
      <StatGrid stats={stats} />
      <Suspense
        fallback={
          <section className="card workspace-block">
            <p className="muted">正在连接 GitHub…</p>
          </section>
        }
      >
        <GithubSection />
      </Suspense>
      <ProjectGallery projects={projects} />
    </>
  );
}
