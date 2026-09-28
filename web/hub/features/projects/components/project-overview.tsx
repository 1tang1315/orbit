import type { KnowledgeCard, KnowledgeDoc, Project } from '@/features/projects/actions';

import { ArchDiagram } from './arch-diagram';
import { CommitList } from './commit-list';
import { DocList } from './doc-list';
import { KnowledgeTree } from './knowledge-tree';
import { Panel } from './panel';
import '../styles.scss';

export interface ProjectOverviewProps {
  project: Project;
  docs: KnowledgeDoc[];
  cards: KnowledgeCard[];
}

/** 概览「最近文档」条数。 */
const RECENT_DOC_LIMIT = 4;
/** 概览「最近提交」条数。 */
const RECENT_COMMIT_LIMIT = 5;

/**
 * 屏 02 概览 Tab：知识树（左栏）+ 架构图卡 / 最近文档 / 最近提交（右栏）。
 */
export function ProjectOverview({ project, docs, cards }: ProjectOverviewProps) {
  const base = `/projects/${project.id}`;
  return (
    <div className="project-cols">
      <Panel
        title="知识树"
        note={`L1 ${project.l1Count} · L2 ${project.l2Count} · L3 ${project.l3Count}`}
      >
        <KnowledgeTree project={project} docs={docs} cards={cards} />
      </Panel>

      <div className="panel-stack">
        <ArchDiagram nodes={project.arch} />

        <Panel title="最近文档" more={{ href: `${base}?tab=docs` }}>
          <DocList docs={docs.slice(0, RECENT_DOC_LIMIT)} />
        </Panel>

        <Panel
          title="最近提交"
          note={`${project.commitCount} 条`}
          more={{ href: `${base}?tab=commits` }}
        >
          <CommitList commits={project.commits.slice(0, RECENT_COMMIT_LIMIT)} />
        </Panel>
      </div>
    </div>
  );
}
