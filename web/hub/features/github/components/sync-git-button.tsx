'use client';

import { useState, useTransition } from 'react';

import { syncProjectGitData } from '../sync-actions';
import '../styles.scss';

/**
 * 提交历史 Tab 的「同步」按钮：调 Server Action 从 GitHub 拉取
 * 真实提交与分支并落库，成功后由 revalidatePath 刷新详情页。
 */
export function SyncGitButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="gh-import-cell">
      <button
        type="button"
        className="btn btn-soft"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await syncProjectGitData(projectId);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : '同步失败，请重试');
            }
          });
        }}
      >
        {pending ? '同步中…' : '从 GitHub 同步'}
      </button>
      {error ? <span className="gh-import-error">{error}</span> : null}
    </span>
  );
}
