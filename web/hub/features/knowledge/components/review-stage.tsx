import { IconBell, IconBook, IconGrid, IconPulse, IconUser } from '@/components/ui/icons';
import { reviewCard, type ReviewScreenData } from '@/features/knowledge/actions';

import { PhoneUpdates } from './phone-updates';
import { ReviewCard } from './review-card';

import '../styles.scss';

export interface ReviewStageProps {
  data: ReviewScreenData;
}

/** 底部 5 Tab：仅外观（本期不跳转），「复习」为激活态。 */
interface PhoneTab {
  label: string;
  icon: typeof IconPulse;
  active: boolean;
}

const TABS: PhoneTab[] = [
  { label: '动态', icon: IconPulse, active: false },
  { label: '项目', icon: IconGrid, active: false },
  { label: '复习', icon: IconBook, active: true },
  { label: '通知', icon: IconBell, active: false },
  { label: '我的', icon: IconUser, active: false },
];

/**
 * 屏 04 移动复习：桌面页内嵌 390 宽手机框
 * （.review-stage > .phone，结构见 HUB_PLAN §6 与 PDF 第 4 页）。
 */
export function ReviewStage({ data }: ReviewStageProps) {
  const { current, total, masteredCount, reviewedCount, streakDays, updates, weekly } = data;
  const percent = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  return (
    <div className="review-stage">
      <div className="phone">
        <header className="phone-head">
          <h1 className="phone-title">复习</h1>
          <span className="streak-pill">{`连续 ${streakDays} 天`}</span>
        </header>

        <div className="phone-body">
          {current ? (
            <ReviewCard card={current} masteredCount={masteredCount} total={total} onReview={reviewCard} />
          ) : (
            <div className="review-empty">
              <p className="review-empty-title">
                {total > 0 ? '今日复习已完成 🎉' : '暂无到期卡片'}
              </p>
              <p className="review-empty-note">
                {total > 0
                  ? `${total} 张知识卡已全部掌握，明天继续巩固。`
                  : '当前没有需要复习的知识卡，去知识库看看有没有新的 L2 文档吧。'}
              </p>
            </div>
          )}

          <PhoneUpdates updates={updates} />

          <section className="phone-card">
            <div className="phone-card-head">
              <span className="phone-card-title">今日复习进度</span>
              <span className="review-progress">
                {total > 0 ? `${reviewedCount}/${total}` : '暂无'}
              </span>
            </div>
            <div className="progress">
              <i style={{ width: `${percent}%` }} />
            </div>
          </section>

          <section className="phone-card">
            <div className="phone-card-head">
              <span className="phone-card-title">本周沉淀</span>
            </div>
            {weekly.map((stat) => (
              <div className="phone-stat" key={stat.label}>
                <span className="muted">{stat.label}</span>
                <span className="phone-stat-value">{stat.value}</span>
              </div>
            ))}
          </section>
        </div>

        <nav className="phone-tabbar" aria-label="底部导航">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <span
                key={tab.label}
                className={`phone-tab${tab.active ? ' is-active' : ''}`}
                aria-current={tab.active ? 'page' : undefined}
              >
                <Icon size={16} />
                {tab.label}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
