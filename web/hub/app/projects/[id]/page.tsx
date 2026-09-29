import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { listGithubBranches, listGithubCommits } from '@/features/github/actions';
import type { GithubBranch, GithubCommit } from '@/features/github/actions';
import { SyncGitButton } from '@/features/github/components/sync-git-button';
import {
  getProject,
  getProjectCards,
  getProjectDocs,
  getRetroDocs,
} from '@/features/projects/actions';
import { ArchDiagram } from '@/features/projects/components/arch-diagram';
import { CommitList } from '@/features/projects/components/commit-list';
import { BranchFilterSelect } from '@/features/projects/components/branch-filter-select';
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

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  return { title: project === null ? '项目详情' : project.name };
}

/** 实时 GitHub 数据拉取失败时的提示语（回退本地缓存展示）。 */
function gitErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'GitHub 数据拉取失败';
}

/**
 * 02 项目详情（/projects/[id]）：单项目全生命周期视图。
 *
 * Tab 走 ?tab= searchParams（服务端渲染、刷新保持），默认概览；
 * 项目不存在时 notFound()。数据全部经各 feature 的 actions.ts 取；
 * 提交历史与分支优先取 GitHub 实时数据，失败回退本地缓存。
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

  // 分支筛选：仅接受实时分支列表里存在的分支名（防注入 sha 参数），空串 = 全部
  const branchParam = typeof query.branch === 'string' ? query.branch : '';
  // branchApplied：分支通过实时分支列表校验且确实用于拉取（note 与下拉回显以此为准）
  let branchApplied = false;

  // GitHub 实时提交 / 分支：repo 合法才请求，失败不阻塞页面（回退本地缓存）
  let liveCommits: GithubCommit[] | null = null;
  let liveBranches: GithubBranch[] | null = null;
  let gitError: string | null = null;
  if (/^[\w.-]+\/[\w.-]+$/.test(project.repo)) {
    try {
      [liveCommits, liveBranches] = await Promise.all([
        listGithubCommits(project.repo),
        listGithubBranches(project.repo),
      ]);
      if (branchParam !== '' && liveBranches.some((branch) => branch.name === branchParam)) {
        branchApplied = true;
        liveCommits = await listGithubCommits(project.repo, undefined, branchParam);
      }
    } catch (error) {
      gitError = gitErrorMessage(error);
      liveCommits = null;
      liveBranches = null;
    }
  }

  return (
    <section>
      <ProjectHeader project={project} />
      <ProjectTabs projectId={project.id} active={tab} />

      {tab === 'overview' ? (
        <ProjectOverview
          project={project}
          docs={docs}
          cards={cards}
          liveCommits={liveCommits}
        />
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
            <DocList docs={docs} emptyText="暂无文档 · 接入 AI 后将自动起草 L2 文档" />
          </Panel>
        </TabPanel>
      ) : null}

      {tab === 'commits' ? (
        <TabPanel>
          <Panel
            title="提交历史"
            note={
              liveCommits
                ? `GitHub 实时 · ${branchApplied ? `分支 ${branchParam} · ` : ''}最近 ${liveCommits.length} 条提交`
                : `本地缓存 ${project.commits.length} 条 · ${gitError ?? '未配置 GitHub 仓库'}`
            }
          >
            <div className="panel-toolbar">
              {liveBranches && liveBranches.length > 0 ? (
                <BranchFilterSelect
                  projectId={project.id}
                  branches={liveBranches.map((branch) => branch.name)}
                  active={branchApplied ? branchParam : ''}
                />
              ) : null}
              <SyncGitButton projectId={project.id} />
            </div>
            <CommitList
              commits={liveCommits ?? project.commits}
              emptyText={
                liveCommits === null && gitError
                  ? 'GitHub 数据不可用，且本地暂无缓存提交'
                  : '暂无提交记录 · 点击「从 GitHub 同步」拉取真实提交'
              }
            />
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
