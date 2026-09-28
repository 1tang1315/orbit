import Link from 'next/link';

import { PlaceholderButton } from '@/components/ui/placeholder-button';
import type { Project } from '@/features/projects/actions';

import '../styles.scss';

export interface ProjectHeaderProps {
  project: Project;
}

/**
 * 屏 02 页头：面包屑（工作区 / 项目名）+ 标题行（项目名 + repo + 占位按钮）。
 */
export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <header className="project-head">
      <div>
        <nav className="breadcrumb" aria-label="面包屑">
          <Link href="/">工作区</Link>
          <span aria-hidden="true">/</span>
          <span>{project.name}</span>
        </nav>
        <div className="project-title-row">
          <span className="nav-dot" style={{ backgroundColor: project.color }} />
          <h1 className="project-title">{project.name}</h1>
          <span className="chip mono">{project.repo}</span>
        </div>
      </div>
      <div className="head-actions">
        <PlaceholderButton
          label="重新扫描"
          hint="重新扫描：本期为示例数据；接入 GitHub 后将按最新提交重建 L1，并刷新同步时间。"
        />
        <PlaceholderButton
          label="生成文档"
          variant="primary"
          hint="生成文档：本期为示例数据；接入 AI 后将自动起草 L2 文档，生成后进入「待你确认」。"
        />
      </div>
    </header>
  );
}
