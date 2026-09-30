/// 北京时间（UTC+8）工具。
/// 约定：所有持久化时间均为 UTC 毫秒时间戳；展示与判定统一转回北京时间。
library;

const Duration _bjOffset = Duration(hours: 8);

/// 当前北京时间（挂墙钟，仅用于展示与判定，勿直接入库）
DateTime bjNow() => DateTime.now().toUtc().add(_bjOffset);

/// 时间戳 → 北京时间
DateTime bjFromMillis(int millisUtc) =>
    DateTime.fromMillisecondsSinceEpoch(millisUtc, isUtc: true).add(_bjOffset);

/// 北京时间 → UTC 毫秒时间戳
int toMillisUtc(DateTime bj) => bj
    .subtract(_bjOffset)
    .toUtc()
    .millisecondsSinceEpoch;

/// 北京时间当天零点的时间戳（用于"天"粒度的键，如日历标注、按天查询）
int bjDayKey(DateTime bj) {
  final d = DateTime(bj.year, bj.month, bj.day);
  return toMillisUtc(d);
}

String pad2(int n) => n.toString().padLeft(2, '0');