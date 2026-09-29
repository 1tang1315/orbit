import { listGithubRepos } from '@/features/github/actions';

/**
 * 账户仓库列表端点：GET /api/github/repos 返回已标记 imported 的仓库数组；
 * token 缺失 / 无效 / 网络失败时返回 502 + 中文错误信息。
 */
export async function GET(): Promise<Response> {
  try {
    const repos = await listGithubRepos();
    return Response.json({ count: repos.length, repos });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 502 },
    );
  }
}
