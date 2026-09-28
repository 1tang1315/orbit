import { notFound } from 'next/navigation';

import { getWorkItemDetail, listWorkItemLinks } from '@/features/work-items/actions';
import { WorkItemPipeline } from '@/features/work-items/components/work-item-pipeline';

interface WorkItemPageProps {
  /** Next 16：动态段 params 是 Promise，必须 await。 */
  params: Promise<{ id: string }>;
}

/**
 * 05 工作项流水线 / 07 Bug 修复快轨：同一路由按 sourceType 切换变体。
 *
 * 默认服务端组件；数据只经 features/work-items/actions.ts 读取（本屏全只读）。
 */
export default async function WorkItemPage({ params }: WorkItemPageProps) {
  const { id } = await params;
  const detail = await getWorkItemDetail(id);
  if (!detail) {
    return notFound();
  }
  const links = await listWorkItemLinks();

  return <WorkItemPipeline detail={detail} links={links} />;
}
