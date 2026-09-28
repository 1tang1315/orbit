import Link from 'next/link';

/** 404（Not found UI）。 */
export default function NotFound() {
  return (
    <div className="state-page">
      <p className="eyebrow">404</p>
      <h1 className="state-title">没有找到这个页面</h1>
      <p className="muted">链接可能已失效，或该工作项 / 任务尚未收录进知识中枢。</p>
      <Link className="btn btn-primary" href="/">
        回到动态流
      </Link>
    </div>
  );
}
