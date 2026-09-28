/** 相对时间格式化：刚刚 / N 分钟前 / N 小时前 / 今天 HH:MM / 昨天 HH:MM / N 天前 / 日期。 */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const diffMs = Date.now() - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return '刚刚';
  }
  if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  }

  const date = new Date(then);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  if (then >= startOfToday) {
    if (diffMin < 360) {
      return `${Math.floor(diffMin / 60)} 小时前`;
    }
    return `今天 ${clock}`;
  }
  if (then >= startOfYesterday) {
    return `昨天 ${clock}`;
  }
  const diffDay = Math.floor((startOfToday - then) / 86_400_000);
  if (diffDay < 7) {
    return `${diffDay} 天前`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 千分位数字（如 1,284）。 */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/** 短日期：MM-DD。 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
