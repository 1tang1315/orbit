'use server';

// ============================================================
// 「GitHub 接入」写动作：顶层 'use server' 文件（客户端组件可直接
// import 函数引用），与取数 actions.ts 分离以避免内联指令冲突。
// ============================================================

import { revalidatePath } from 'next/cache';

import { createGithubProject } from '@/lib/db';

/** 新项目配色轮换池：与 seed 项目色板同一观感（品紫/橙/绿等）。 */
const PROJECT_COLORS = ['#9B5DE5', '#F26430', '#0F9D58', '#3B82F6', '#E5484D', '#0EA5E9'];

function pickColor(fullName: string): string {
  let hash = 0;
  for (const char of fullName) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

/**
 * 把 GitHub 仓库导入为本中枢项目（首页「接入项目」网格立即出现）。
 *
 * fullName 做白名单校验（owner/repo 格式）后再拼进 API 路径，
 * 防止客户端传值注入额外路径；已导入过时静默成功（幂等）。
 */
export async function importGithubRepo(fullName: string): Promise<void> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
    throw new Error('仓库标识不合法，无法导入');
  }
  const response = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
  });
  if (response.status === 401) {
    throw new Error('GITHUB_TOKEN 无效或已过期（GitHub 返回 401）');
  }
  if (!response.ok) {
    throw new Error(`GitHub API 请求失败（HTTP ${response.status}）`);
  }
  const repo = (await response.json()) as {
    name: string;
    full_name: string;
    language: string | null;
  };
  createGithubProject({
    name: repo.name,
    repo: repo.full_name,
    color: pickColor(repo.full_name),
    stack: repo.language ? [repo.language] : [],
  });
  revalidatePath('/');
}
