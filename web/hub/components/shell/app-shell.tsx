import type { ReactNode } from 'react';

import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

export interface AppShellProps {
  children: ReactNode;
  syncText: string;
}

/** 应用外壳：固定侧栏 + 顶栏 + 内容区。 */
export function AppShell({ children, syncText }: AppShellProps) {
  return (
    <div className="shell">
      <Sidebar syncText={syncText} />
      <div className="main">
        <Topbar syncText={syncText} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
