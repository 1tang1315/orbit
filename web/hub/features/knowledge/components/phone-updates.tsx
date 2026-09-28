import Link from 'next/link';

import type { ReviewUpdate } from '@/features/knowledge/actions';

import '../styles.scss';

export interface PhoneUpdatesProps {
  updates: ReviewUpdate[];
}

/**
 * 屏 04「项目更新」卡：项目彩点 + 动态标题 + 相对时间。
 * 「查看全部」与每行动态均指向真实存在的路由（动态流 / 项目 / 工作项等）。
 */
export function PhoneUpdates({ updates }: PhoneUpdatesProps) {
  return (
    <section className="phone-card">
      <div className="phone-card-head">
        <span className="phone-card-title">项目更新</span>
        <Link href="/" className="link">
          查看全部
        </Link>
      </div>
      {updates.map((update) => (
        <Link key={update.id} href={update.href} className="phone-update-row">
          <span className="nav-dot" style={{ backgroundColor: update.color }} />
          <span className="phone-update-title">{update.title}</span>
          <span className="phone-update-time">{update.time}</span>
        </Link>
      ))}
    </section>
  );
}
