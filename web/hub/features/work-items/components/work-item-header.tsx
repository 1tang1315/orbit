import Link from 'next/link';

import { PlaceholderButton } from '@/components/ui/placeholder-button';
import type { Project, WorkItem, WorkItemLink } from '../actions';

export interface WorkItemHeaderProps {
  workItem: WorkItem;
  project: Project | null;
  /** 面包屑下方的工作项切换入口。 */
  links: WorkItemLink[];
}

/**
 * 屏 05 / 07 顶部：面包屑 + 标题行（来源标签 / issue # / 会话 #）+
 * 工作项切换 chip + 右侧「沉淀到知识库」占位按钮。
 *
 * 颜色两套语义不混用：来源标签（紫=需求 / 红=Bug）只回答「从哪来」。
 */
export function WorkItemHeader({ workItem, project, links }: WorkItemHeaderProps) {
  const isBug = workItem.sourceType === 'Bug';
  const sourceTagClass = isBug ? 'tag tag-bug' : 'tag tag-l1';

  return (
    <header className="pipe-head">
      <div>
        <nav className="breadcrumb" aria-label="面包屑">
          <Link href="/">工作区</Link>
          <span aria-hidden="true">/</span>
          {project ? (
            <Link href={`/projects/${project.id}`}>{project.name}</Link>
          ) : (
            <span>未知项目</span>
          )}
          <span aria-hidden="true">/</span>
          <span>工作项 #{workItem.seq}</span>
        </nav>

        <div className="pipe-title-row">
          <h1 className="pipe-title">{workItem.title}</h1>
          <span className={sourceTagClass}>{workItem.sourceType}</span>
          {workItem.issueNo !== null && (
            <span className="chip">Issue #{workItem.issueNo}</span>
          )}
          {workItem.sessionNo !== null && (
            <span className="chip">会话 #{workItem.sessionNo}</span>
          )}
          {isBug && (
            <>
              <span className="tag tag-bug">复现记录即验收</span>
              <span className="tag tag-pending">收口需人工确认</span>
            </>
          )}
        </div>

        <div className="wi-switch">
          <span className="ghost-note">切换工作项</span>
          {links.map((link) => (
            <Link
              key={link.id}
              href={`/work-items/${link.id}`}
              className={`chip${link.id === workItem.id ? ' is-active' : ''}`}
              title={link.title}
            >
              {link.sourceType} #{link.seq}
            </Link>
          ))}
        </div>
      </div>

      <PlaceholderButton
        label="沉淀到知识库"
        hint="将已确认的产物沉淀到知识库，生成 L2 文档或 L3 知识卡。当前为示例数据。"
        variant="primary"
      />
    </header>
  );
}
