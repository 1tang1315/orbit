// 考勤领域模型

/// 上下班时段
class WorkSegment {
  final String name;
  final SegTime start;
  final SegTime end;

  const WorkSegment(this.name, this.start, this.end);

  String get range =>
      '${start.label}–${end.label}';

  WorkSegment copyWith({String? name, SegTime? start, SegTime? end}) =>
      WorkSegment(name ?? this.name, start ?? this.start, end ?? this.end);
}

class SegTime {
  int hour;
  int minute;
  SegTime(this.hour, this.minute);

  factory SegTime.parse(String s) {
    final p = s.split(':');
    return SegTime(int.parse(p[0]), int.parse(p[1]));
  }

  String get label =>
      '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';

  int get minutes => hour * 60 + minute;
}

/// 打卡条目状态
enum PunchStatus { pending, ok, late, early, makeup }

/// 待办式打卡条目
class PunchItem {
  final PunchKind kind;
  SegTime ref; // 判定参考时间
  PunchStatus status;
  int? recordMinutes; // 实际打卡时刻（分钟）
  bool locked; // 下班卡未到点锁定

  PunchItem({
    required this.kind,
    required this.ref,
    this.status = PunchStatus.pending,
    this.recordMinutes,
    this.locked = false,
  });

  bool get done =>
      status == PunchStatus.ok ||
      status == PunchStatus.late ||
      status == PunchStatus.early ||
      status == PunchStatus.makeup;

  String get recordLabel {
    if (!done) return locked ? '未到点' : '—';
    final h = (recordMinutes! ~/ 60).toString().padLeft(2, '0');
    final m = (recordMinutes! % 60).toString().padLeft(2, '0');
    return '$h:$m';
  }

  String get statusLabel {
    switch (status) {
      case PunchStatus.pending:
        return locked ? '待打 ${ref.label}' : '待打';
      case PunchStatus.ok:
        return '正常';
      case PunchStatus.late:
        return '迟到';
      case PunchStatus.early:
        return '早退';
      case PunchStatus.makeup:
        return '补记';
    }
  }
}

enum PunchKind { clockIn, clockOut }

extension PunchKindX on PunchKind {
  String get label => this == PunchKind.clockIn ? '上班' : '下班';
}

/// 临时加班段（仅当天）
class OvertimeSegment {
  String name;
  WorkSegment seg;
  final PunchItem inItem;
  final PunchItem outItem;
  bool removed = false;

  OvertimeSegment(this.name, this.seg)
      : inItem = PunchItem(kind: PunchKind.clockIn, ref: seg.start),
        outItem = PunchItem(
            kind: PunchKind.clockOut, ref: seg.end, locked: true);

  void syncRef() {
    inItem.ref = seg.start;
    outItem.ref = seg.end;
  }
}

/// 日期标记类型
enum DayMark { legal, adjust, custom, leave, off, none }

extension DayMarkX on DayMark {
  String get label {
    switch (this) {
      case DayMark.legal:
        return '法定假日';
      case DayMark.adjust:
        return '调休上班';
      case DayMark.custom:
        return '自定义假';
      case DayMark.leave:
        return '请假';
      case DayMark.off:
        return '周末休';
      case DayMark.none:
        return '工作日';
    }
  }
}

/// 月历某一天
class CalDay {
  final int year;
  final int month;
  final int day;
  DayMark mark;
  String? note; // 角标文字，如“国庆”“年假”“班”

  CalDay(this.year, this.month, this.day, this.mark, [this.note]);
}

enum RestRule { single, double_, alternate }

extension RestRuleX on RestRule {
  String get label {
    switch (this) {
      case RestRule.single:
        return '单休（周日休）';
      case RestRule.double_:
        return '双休';
      case RestRule.alternate:
        return '大小周';
    }
  }
}

enum PunchMode { pairPerSegment, oncePerDay }

extension PunchModeX on PunchMode {
  String get label {
    switch (this) {
      case PunchMode.pairPerSegment:
        return '每段一对（各段打上下班）';
      case PunchMode.oncePerDay:
        return '整日一对（只打上班+下班）';
    }
  }
}
