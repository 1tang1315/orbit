// ============================================================
// 「GitHub 接入」业务域：连接测试、仓库列表与导入。
// 读查询：普通 async 函数直调 GitHub REST API（零第三方依赖，规范 02 §3.2）；
// 写动作：importGithubRepo 函数体首行 'use server'，导入后 revalidatePath（规范 02 §3.3）。
// token 只在服务端读 .env.local 的 GITHUB_TOKEN，绝不进入客户端 bundle。
// ============================================================

// 写动作（Server Action）拆在 import-actions.ts：顶层 'use server' 文件，
// 客户端组件（导入按钮）直接 import 其函数引用，本文件保持纯服务端取数。

import { cache } from 'react';

import { getProjectRepos } from '@/lib/db';

// region 模型

export interface GithubStatus {
  connected: boolean;
  login: string | null;
  error: string | null;
}

export interface GithubRepo {
  fullName: string;
  name: string;
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  pushedAt: string | null;
  htmlUrl: string;
  /** 仓库所有者登录名（分组展示用）。 */
  ownerLogin: string;
  /** 所有者类型：Organization 归「组织」，其余归「个人」。 */
  ownerType: 'User' | 'Organization';
  /** 是否已导入为本中枢项目（按仓库全名比对）。 */
  imported: boolean;
}

/** GitHub 真实提交（/repos/{repo}/commits 的 UI 模型）。 */
export interface GithubCommit {
  hash: string;
  message: string;
  /** 提交作者展示名（优先登录名，缺省取提交信息里的名字）。 */
  author: string;
  at: string;
  url: string;
}

/** GitHub 分支（/repos/{repo}/branches 的 UI 模型）。 */
export interface GithubBranch {
  name: string;
  /** 分支最新提交的短 hash，用于展示。 */
  headHash: string;
}

// endregion

// region REST API 访问（仅服务端）

const API_BASE = 'https://api.github.com';
// api.github.com 经代理/跨境网络可能 7s+ 才返回，超时给足 30s
// （首页已用 Suspense 把该调用隔离在卡片内，不阻塞首屏）。
const FETCH_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 100;
/** 提交历史一次拉取的条数（commits API 单页上限 100）。 */
const DEFAULT_COMMIT_LIMIT = 100;

/** GitHub 调用失败统一走本错误；message 为可直接展示的中文。 */
class GithubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface GithubApiUser {
  login: string;
}

interface GithubApiCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
    committer: { name: string; date: string } | null;
  };
  author: { login: string } | null;
}

interface GithubApiBranch {
  name: string;
  commit: { sha: string };
}

interface GithubApiRepo {
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  private: boolean;
  pushed_at: string | null;
  html_url: string;
  owner: { login: string; type: string };
}

function requireToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GithubError(
      '未配置 GITHUB_TOKEN：请在 web/hub/.env.local 写入后重启 dev 服务',
      0,
    );
  }
  return token;
}

async function ghRequest<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${requireToken()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    throw new GithubError('无法访问 GitHub API：网络超时或被拦截', 0);
  }
  if (response.status === 401) {
    throw new GithubError('GITHUB_TOKEN 无效或已过期（GitHub 返回 401）', 401);
  }
  if (!response.ok) {
    throw new GithubError(`GitHub API 请求失败（HTTP ${response.status}）`, response.status);
  }
  return (await response.json()) as T;
}

// endregion

// region 读查询（服务端组件调用，不加 'use server'）

/**
 * 连接测试：GET /user 验证 token。
 *
 * 失败不抛出——首页与侧栏都直接展示 connected=false + 原因；
 * cache() 让同一次渲染里布局与页面共享一次调用。
 */
export const getGithubStatus = cache(async (): Promise<GithubStatus> => {
  try {
    const user = await ghRequest<GithubApiUser>('/user');
    return { connected: true, login: user.login, error: null };
  } catch (error) {
    return {
      connected: false,
      login: null,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
});

/**
 * 账户可访问的仓库列表（本人 + 协作 + 组织成员），按最近推送倒序。
 *
 * 翻页拉全量后按已接入项目标记 imported；token 缺失或请求失败会抛出，
 * 由调用方决定降级方式（首页 catch 成空列表 + 提示）。
 */
export async function listGithubRepos(): Promise<GithubRepo[]> {
  const apiRepos: GithubApiRepo[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await ghRequest<GithubApiRepo[]>(
      `/user/repos?per_page=${PAGE_SIZE}&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`,
    );
    apiRepos.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
  }
  const importedRepos = new Set(getProjectRepos());
  return apiRepos.map((repo) => ({
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    isPrivate: repo.private,
    pushedAt: repo.pushed_at,
    htmlUrl: repo.html_url,
    ownerLogin: repo.owner.login,
    ownerType: repo.owner.type === 'Organization' ? 'Organization' as const : 'User' as const,
    imported: importedRepos.has(repo.full_name),
  }));
}

/**
 * 仓库最近提交，按时间倒序；不传 sha 时返回默认分支的提交。
 *
 * fullName 为 owner/repo 全名，白名单校验后拼进路径；
 * sha 传分支名时返回该分支的提交（分支筛选用，调用方需先校验分支合法）；
 * 仓库不存在（如手动填写的示例仓库）会抛 GithubError，由调用方回退本地数据。
 */
export async function listGithubCommits(
  fullName: string,
  limit = DEFAULT_COMMIT_LIMIT,
  sha?: string,
): Promise<GithubCommit[]> {
  assertRepoName(fullName);
  const shaQuery = sha ? `&sha=${encodeURIComponent(sha)}` : '';
  const apiCommits = await ghRequest<GithubApiCommit[]>(
    `/repos/${fullName}/commits?per_page=${Math.min(limit, 100)}${shaQuery}`,
  );
  return apiCommits.map((item) => ({
    hash: item.sha.slice(0, 7),
    message: item.commit.message.split('\n')[0],
    author: item.author?.login ?? item.commit.author?.name ?? item.commit.committer?.name ?? '未知',
    at: item.commit.author?.date ?? item.commit.committer?.date ?? new Date().toISOString(),
    url: item.html_url,
  }));
}

/** 仓库全部分支（GitHub 单页最多返回 100 个，足够覆盖常规仓库）。 */
export async function listGithubBranches(fullName: string): Promise<GithubBranch[]> {
  assertRepoName(fullName);
  const apiBranches = await ghRequest<GithubApiBranch[]>(
    `/repos/${fullName}/branches?per_page=100`,
  );
  return apiBranches.map((branch) => ({
    name: branch.name,
    headHash: branch.commit.sha.slice(0, 7),
  }));
}

function assertRepoName(fullName: string): void {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
    throw new GithubError(`仓库标识「${fullName}」不是 owner/repo 格式`, 0);
  }
}

// endregion
