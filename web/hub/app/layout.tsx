import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shell/app-shell';
import { formatRelative } from '@/components/ui/format';
import { getLatestSyncAt } from '@/lib/db';

import './globals.scss';
import './tw.css';

export const metadata: Metadata = {
  title: {
    default: '项目知识中枢',
    template: '%s · 项目知识中枢',
  },
  description: '连接 GitHub 仓库、自动理解代码、主动沉淀 L1/L2/L3 知识的项目知识中枢。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const syncText = formatRelative(getLatestSyncAt());

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell syncText={syncText}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
