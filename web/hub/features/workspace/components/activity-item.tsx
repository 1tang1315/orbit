import Link from 'next/link';

import { formatRelative } from '@/components/ui/format';
import type { Activity, ActivityKind } from '@/features/workspace/actions';

import '../styles.scss';

// kind → 圆点色：commit 灰 / l1 紫 / l2 橙 / l3 绿 / retro 紫 / bug 红。
// 只引用设计令牌变量，日后改色统一在 globals.scss，不在此散落裸色值。
const KIND_DOT_COLOR: Record<ActivityKind, string> = {
  commit: 'var(--muted)',
  l1: 'var(--l1)',
  l2: 'var(--l2)',
  l3: 'var(--l3)',
  retro: 'var(--l1)',
  bug: 'var(--bug)',
};

interface StatusTag {
  label: string;
  className: string;
}

// 状态语义（橙=待确认 / 绿=完成）与来源语义（紫=需求 / 红=Bug）是两套
// 语言，必须互不染色：状态只从 meta 的中文状态词推导，来源只由 kind 决定。
const PENDING_TAG: StatusTag = { label: '待确认', className: 'tag tag-pending' };
const DONE_TAG: StatusTag = { label: '已确认', className: 'tag tag-ok' };

function detectStatus(meta: string): StatusTag | null {
  // 「待你确认 / 待人工确认 / 待你过目」是同一批待确认状态的中文变体。
  if (/待你确认|待人工确认|待你过目|待确认/.test(meta)) {
    return PENDING_TAG;
  }
  if (meta.includes('已确认')) {
    return DONE_TAG;
  }
  return null;
}

export interface ActivityItemProps {
  activity: Activity;
}

/** 单条动态：圆点表来源类型，标签行分别承载「来源」与「状态」两套色语义。 */
export function ActivityItem({ activity }: ActivityItemProps) {
  const status = detectStatus(activity.meta);

  return (
    <li className="activity-item">
      <span
        className="activity-dot"
        style={{ backgroundColor: KIND_DOT_COLOR[activity.kind] }}
      />
      <div className="activity-body">
        <div className="activity-title">
          {activity.href ? (
            <Link href={activity.href} className="activity-link">
              {activity.title}
            </Link>
          ) : (
            activity.title
          )}
        </div>
        <div className="activity-meta">{activity.meta}</div>
        <div className="tag-row">
          {/* 来源标签：项目名保持中性 chip，Bug 来源才上红 */}
          <span className="chip">{activity.sourceLabel}</span>
          {activity.kind === 'bug' ? <span className="tag tag-bug">Bug</span> : null}
          {status ? <span className={status.className}>{status.label}</span> : null}
        </div>
      </div>
      <time className="activity-time" dateTime={activity.occurredAt}>
        {formatRelative(activity.occurredAt)}
      </time>
    </li>
  );
}
