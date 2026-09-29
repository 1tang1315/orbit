'use client';

import { useState, useTransition } from 'react';

import { importGithubRepo } from '../import-actions';
import '../styles.scss';

export interface ImportRepoButtonProps {
  fullName: string;
  imported: boolean;
}

/**
 * 单个仓库行的「导入」按钮：调 Server Action 落库，成功后由
 * revalidatePath('/') 刷新首页与仓库列表的已导入标记。
 */
export function ImportRepoButton({ fullName, imported }: ImportRepoButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (imported) {
    return <span className="tag tag-ok">已导入</span>;
  }

  return (
    <span className="gh-import-cell">
      <button
        type="button"
        className="btn btn-primary gh-import-btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await importGithubRepo(fullName);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : '导入失败，请重试');
            }
          });
        }}
      >
        {pending ? '导入中…' : '导入'}
      </button>
      {error ? <span className="gh-import-error">{error}</span> : null}
    </span>
  );
}
