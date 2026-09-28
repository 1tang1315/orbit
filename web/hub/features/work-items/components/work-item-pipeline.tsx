import type { WorkItemDetail, WorkItemLink } from '../actions';

import { StageColumn } from './stage-column';
import { StageProgress } from './stage-progress';
import { WorkItemHeader } from './work-item-header';

import '../styles.scss';

export interface WorkItemPipelineProps {
  /** getWorkItemDetail 组装好的页面视图。 */
  detail: WorkItemDetail;
  /** 工作项切换入口。 */
  links: WorkItemLink[];
}

/**
 * 屏 05「工作项流水线」/ 屏 07「Bug 修复快轨」：同一路由的两个变体。
 *
 * sourceType=需求 → 标准 4 列流水线；sourceType=Bug → 追加语义标签、
 * 规格列灰化（detail.columns[].readonly）、第 4 列人工收口占位。
 */
export function WorkItemPipeline({ detail, links }: WorkItemPipelineProps) {
  return (
    <>
      <WorkItemHeader workItem={detail.workItem} project={detail.project} links={links} />
      <StageProgress stages={detail.stages} />
      <div className="pipe-cols">
        {detail.columns.map((column) => (
          <StageColumn key={column.stage} column={column} />
        ))}
      </div>
    </>
  );
}
