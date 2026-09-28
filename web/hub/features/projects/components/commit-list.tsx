import { formatRelative } from '@/components/ui/format';
import type { CommitItem } from '@/features/projects/actions';

export interface CommitListProps {
  commits: CommitItem[];
  /** 空态文案。 */
  emptyText?: string;
}

/**
 * 提交历史行列表（.commit-row）：短 hash + message + branch + 相对时间。
 */
export function CommitList({ commits, emptyText = '暂无提交记录' }: CommitListProps) {
  if (commits.length === 0) {
    return <div className="ghost-note">{emptyText}</div>;
  }
  return (
    <div>
      {commits.map((commit) => (
        <div key={commit.hash} className="commit-row">
          <div>
            <div className="commit-msg">{commit.message}</div>
            <div className="commit-meta">
              {commit.hash}
              {' · '}
              {commit.branch}
            </div>
          </div>
          <span className="chip">{formatRelative(commit.at)}</span>
        </div>
      ))}
    </div>
  );
}
