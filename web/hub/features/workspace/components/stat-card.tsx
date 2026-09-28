import { formatNumber } from '@/components/ui/format';

export interface StatCardProps {
  label: string;
  /** 原始数值，千分位格式化在组件内完成。 */
  value: number;
  /** 同比小字（示例文案，本期无历史对比数据）。 */
  note: string;
  /** 需要警示语义（如待复盘）时用橙色小字，其余默认绿色。 */
  warn?: boolean;
}

/** 单张统计卡：标签 + 数值 + 同比小字。 */
export function StatCard({ label, value, note, warn = false }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value-row">
        <span className="stat-value">{formatNumber(value)}</span>
        <span className={warn ? 'stat-note is-warn' : 'stat-note'}>{note}</span>
      </div>
    </div>
  );
}
