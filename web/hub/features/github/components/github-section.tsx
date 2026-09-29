import { getGithubStatus, listGithubRepos } from '../actions';
import { GithubConnectCard } from './github-connect-card';

/**
 * 首页 GitHub 区块（async 服务端组件）：在 Suspense 边界内异步取数，
 * 外部 API 慢或失败都不阻塞首页首屏；失败时卡片降级为引导提示。
 */
export async function GithubSection() {
  const status = await getGithubStatus();
  const repos = status.connected ? await listGithubRepos().catch(() => []) : [];

  return <GithubConnectCard status={status} repos={repos} />;
}
