import { IconBell, IconSearch, IconUser } from '@/components/ui/icons';

export interface TopbarProps {
  syncText: string;
}

/** 顶栏：搜索框 + 同步状态胶囊 + 通知 + 头像。 */
export function Topbar({ syncText }: TopbarProps) {
  return (
    <header className="topbar">
      <label className="relative flex items-center">
        <span className="muted absolute left-3 flex">
          <IconSearch />
        </span>
        <input
          className="search-input pl-9"
          type="search"
          placeholder="搜索项目、文档、知识卡…"
          aria-label="搜索"
        />
      </label>
      <div className="topbar-right">
        <span className="sync-pill">
          <span className="status-dot" />
          已同步 ·
          {' '}
          {syncText}
        </span>
        <button type="button" className="icon-btn" aria-label="通知">
          <IconBell />
        </button>
        <button type="button" className="avatar-btn" aria-label="账号">
          <IconUser />
        </button>
      </div>
    </header>
  );
}
