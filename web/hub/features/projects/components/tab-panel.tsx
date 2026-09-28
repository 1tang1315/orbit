import type { ReactNode } from 'react';

import '../styles.scss';

export interface TabPanelProps {
  children: ReactNode;
}

/**
 * 非概览 Tab 的内容容器：与 tabs 下边线留出 20px 间距。
 * 概览自带 .project-cols 间距，不套这层。
 */
export function TabPanel({ children }: TabPanelProps) {
  return <div className="tab-panel">{children}</div>;
}
