import { formatRelative } from '@/components/ui/format';
import type { CommitItem } from '@/features/projects/actions';

export interface CommitListProps {
  commits: CommitItem[];
  /** 空态文案。 */
  emptyText?: string;
}

/**
 * 提交历史行列表（.commit-row）：短 hash + message + 作者/分支 + 相对时间。
 *
 * GitHub 同步的提交带 author 与详情链接（hash 可点）；
 * seed 数据只有 branch，为空时不展示该段。
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
              {commit.url ? (
                <a href={commit.url} target="_blank" rel="noreferrer">
                  {commit.hash}
                </a>
              ) : (
                commit.hash
              )}
              {commit.author ? <> · {commit.author}</> : null}
              {commit.branch ? <> · {commit.branch}</> : null}
            </div>
          </div>
          <span className="chip">{formatRelative(commit.at)}</span>
        </div>
      ))}
    </div>
  );
}
