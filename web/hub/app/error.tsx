'use client';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** 错误边界（Error UI）。 */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="state-page">
      <p className="eyebrow">出错了</p>
      <h1 className="state-title">页面渲染失败</h1>
      <p className="muted">
        {error.message || '发生了未预期的错误。'}
        {' '}
        可以重试，或回到首页继续。
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        重试
      </button>
    </div>
  );
}
