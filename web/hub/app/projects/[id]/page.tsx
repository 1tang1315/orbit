import { notFound } from 'next/navigation';

import {
  getProject,
  getProjectCards,
  getProjectDocs,
  getRetroDocs,
} from '@/features/projects/actions';
import { ArchDiagram } from '@/features/projects/components/arch-diagram';
import { CommitList } from '@/features/projects/components/commit-list';
import { DocList } from '@/features/projects/components/doc-list';
import { KnowledgeCardList } from '@/features/projects/components/knowledge-card-list';
import { Panel } from '@/features/projects/components/panel';
import { ProjectHeader } from '@/features/projects/components/project-header';
import { ProjectOverview } from '@/features/projects/components/project-overview';
import { ProjectTabs, resolveProjectTab } from '@/features/projects/components/project-tabs';
import { TabPanel } from '@/features/projects/components/tab-panel';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 02 项目详情（/projects/[id]）：单项目全生命周期视图。
 *
 * Tab 走 ?tab= searchParams（服务端渲染、刷新保持），默认概览；
 * 项目不存在时 notFound()。数据全部经 features/projects/actions.ts 取。
 */
export default async function ProjectDetailPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const project = getProject(id);
  if (!project) {
    notFound();
  }

  const tab = resolveProjectTab(query.tab);
  const docs = getProjectDocs(id);
  const cards = getProjectCards(id);
  const retros = getRetroDocs(id);

  return (
    <section>
      <ProjectHeader project={project} />
      <ProjectTabs projectId={project.id} active={tab} />

      {tab === 'overview' ? (
        <ProjectOverview project={project} docs={docs} cards={cards} />
      ) : null}

      {tab === 'arch' ? (
        <TabPanel>
          <ArchDiagram
            nodes={project.arch}
            note="数据流为最近一次扫描的静态快照（L1 全自动），重新扫描后自动更新。"
          />
        </TabPanel>
      ) : null}

      {tab === 'docs' ? (
        <TabPanel>
          <Panel title="文档" note={`${docs.length} 篇`}>
            <DocList docs={docs} emptyText="该项目还没有文档" />
          </Panel>
        </TabPanel>
      ) : null}

      {tab === 'commits' ? (
        <TabPanel>
          <Panel
            title="提交历史"
            note={`${project.commitCount} 条提交 · 示例列出最近 ${project.commits.length} 条`}
          >
            <CommitList commits={project.commits} />
          </Panel>
        </TabPanel>
      ) : null}

      {tab === 'cards' ? (
        <TabPanel>
          <Panel title="技术栈知识" note={`${cards.length} 张命中本项目`}>
            <KnowledgeCardList cards={cards} />
          </Panel>
        </TabPanel>
      ) : null}

      {tab === 'retro' ? (
        <TabPanel>
          <Panel title="复盘" note={`${retros.length} 篇`}>
            <DocList docs={retros} emptyText="暂无复盘报告" />
          </Panel>
        </TabPanel>
      ) : null}
    </section>
  );
}
