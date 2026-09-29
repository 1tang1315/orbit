// ============================================================
// GitHub REST API 访问（零第三方依赖，规范 02 §3.2）。
// 从 features/github/actions.ts 抽出的共享层：不依赖 react / next，
// 供 Server Actions 与 MCP 服务（mcp/server.ts）两个进程形态复用。
// token 只在服务端读 .env.local 的 GITHUB_TOKEN，绝不进入客户端 bundle。
// ============================================================

const API_BASE = 'https://api.github.com';
// api.github.com 经代理/跨境网络可能 7s+ 才返回，超时给足 30s。
const FETCH_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 100;
/** 提交历史一次拉取的条数（commits API 单页上限 100）。 */
export const DEFAULT_COMMIT_LIMIT = 100;

// region 模型

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

/**
 * GitHub 调用失败统一走本错误；message 为可直接展示的中文。
 *
 * 注意：不用构造器参数属性（readonly status: number）——
 * MCP 服务以 node 原生类型剥离运行本文件，参数属性不可剥。
 */
export class GithubError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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

export function requireGithubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GithubError(
      '未配置 GITHUB_TOKEN：请在 web/hub/.env.local 写入后重启服务',
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
        Authorization: `Bearer ${requireGithubToken()}`,
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

export function assertRepoName(fullName: string): void {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
    throw new GithubError(`仓库标识「${fullName}」不是 owner/repo 格式`, 0);
  }
}

/**
 * 仓库最近提交，按时间倒序；不传 sha 时返回默认分支的提交。
 *
 * fullName 为 owner/repo 全名，白名单校验后拼进路径；
 * sha 传分支名时返回该分支的提交（分支筛选用，调用方需先校验分支合法）；
 * 仓库不存在时会抛 GithubError，由调用方回退本地数据。
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

export { PAGE_SIZE, ghRequest };
