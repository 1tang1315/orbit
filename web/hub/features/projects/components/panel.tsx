import type { ReactNode } from 'react';
import Link from 'next/link';

import '../styles.scss';

export interface PanelMore {
  href: string;
  label?: string;
}

export interface PanelProps {
  title: string;
  /** 标题右侧计数/说明（灰色小字）。 */
  note?: string;
  /** 标题右侧「查看全部」链接（与 note 可并存）。 */
  more?: PanelMore;
  children: ReactNode;
}

/**
 * 屏 02 通用卡片：白底卡 + 标题行 + 右侧信息，内容由调用方下传。
 */
export function Panel({ title, note, more, children }: PanelProps) {
  const hasSide = note !== undefined || more !== undefined;
  return (
    <section className="card">
      <div className="card-title">
        <span>{title}</span>
        {hasSide ? (
          <span className="card-side">
            {note !== undefined ? <span className="card-note">{note}</span> : null}
            {more !== undefined ? (
              <Link className="card-more" href={more.href}>
                {more.label ?? '查看全部'}
              </Link>
            ) : null}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
