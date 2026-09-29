'use server';

// ============================================================
// 「GitHub 接入」写动作：项目 Git 数据同步（提交历史 + 分支）。
// 顶层 'use server' 文件，与取数 actions.ts 分离以避免内联指令冲突；
// 拉取成功后回填 projects.commits / commit_count / branch_count。
// ============================================================

import { revalidatePath } from 'next/cache';

import { getProject, updateProjectGitData } from '@/lib/db';

import { listGithubBranches, listGithubCommits } from './actions';

/**
 * 从 GitHub 拉取一个项目的真实提交与分支并落库。
 *
 * 只同步 repo 为 owner/repo 格式的项目（仓库在 GitHub 上不存在时
 * 会直接抛错提示，不改动本地数据）；成功后刷新详情页与首页。
 */
export async function syncProjectGitData(projectId: string): Promise<void> {
  const project = getProject(projectId);
  if (!project) {
    throw new Error('项目不存在');
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(project.repo)) {
    throw new Error(`仓库标识「${project.repo}」不是 owner/repo 格式，无法同步`);
  }

  const [commits, branches] = await Promise.all([
    listGithubCommits(project.repo),
    listGithubBranches(project.repo),
  ]);
  updateProjectGitData(projectId, {
    commits: commits.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      branch: '',
      at: commit.at,
      author: commit.author,
      url: commit.url,
    })),
    branchCount: branches.length,
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/');
}
