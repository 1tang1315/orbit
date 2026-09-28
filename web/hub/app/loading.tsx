/** 全局骨架屏（Loading UI）。 */
export default function Loading() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="加载中">
      <div className="skeleton-block is-title" />
      <div className="skeleton-block" style={{ width: '420px' }} />
      <div className="skeleton-block is-card" />
      <div className="skeleton-block is-card" />
    </div>
  );
}
