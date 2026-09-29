import { getGithubStatus } from '@/features/github/actions';

/**
 * GitHub 连接测试端点：浏览器打开即可验证 token 是否有效。
 * 返回 { connected, login, error }；connected=false 时带中文原因。
 */
export async function GET(): Promise<Response> {
  const status = await getGithubStatus();
  return Response.json(status, { status: status.connected ? 200 : 503 });
}
