import { getProjects, getWorkspaceStats } from '@/lib/db';

/** 健康检查端点：验证 SQLite 与 seed 装载正常。 */
export function GET(): Response {
  const stats = getWorkspaceStats();
  return Response.json({
    status: 'ok',
    db: 'node:sqlite',
    projects: getProjects().length,
    l2: stats.l2Total,
    l3: stats.l3Total,
    time: new Date().toISOString(),
  });
}
