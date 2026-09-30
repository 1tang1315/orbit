import 'package:flutter/foundation.dart';
import '../data/db.dart';
import '../models/attendance.dart';
import '../utils/bj_time.dart';

/// 全局考勤状态。
/// 时间约定：判定/展示用北京时间（bjNow）；持久化一律为 UTC 毫秒时间戳。
class AttendanceStore extends ChangeNotifier {
  AttendanceStore(this._db) {
    _init();
  }

  final AppDb _db;

  // ---- 打卡 ----
  PunchMode mode = PunchMode.pairPerSegment;
  final List<WorkSegment> segments = [
    WorkSegment('早班', SegTime.parse('08:00'), SegTime.parse('12:00')),
    WorkSegment('午班', SegTime.parse('13:00'), SegTime.parse('17:30')),
  ];
  final List<OvertimeSegment> overtimes = [];
  final List<PunchItem> pairItems = [];
  final List<PunchItem> onceItems = [];

  void _init() {
    final presetIn = PunchItem(
        kind: PunchKind.clockIn,
        ref: segments[0].start,
        status: PunchStatus.ok,
        recordMinutes: 7 * 60 + 56);
    pairItems.addAll([
      presetIn,
      PunchItem(kind: PunchKind.clockOut, ref: segments[0].end, locked: true),
      PunchItem(kind: PunchKind.clockIn, ref: segments[1].start),
      PunchItem(kind: PunchKind.clockOut, ref: segments[1].end, locked: true),
    ]);
    onceItems.addAll([
      PunchItem(
          kind: PunchKind.clockIn,
          ref: segments[0].start,
          status: PunchStatus.ok,
          recordMinutes: 7 * 60 + 56),
      PunchItem(kind: PunchKind.clockOut, ref: segments[1].end, locked: true),
    ]);
    _loadFromDb();
    refreshLocks();
  }

  Future<void> _loadFromDb() async {
    // 打卡模式等设置
    final savedMode = _db.getSetting('punch_mode');
    if (savedMode == 'once') mode = PunchMode.oncePerDay;
    remindEnabled = _db.getSetting('remind_enabled') != '0';
    remindAheadMinutes = int.tryParse(_db.getSetting('remind_ahead') ?? '') ?? 5;
    onTimeRemind = _db.getSetting('on_time_remind') != '0';
    fallbackRemind = _db.getSetting('fallback_remind') == '1';
    graceMinutes = int.tryParse(_db.getSetting('grace') ?? '') ?? 5;

    final rule = _db.getSetting('rest_rule');
    if (rule == 'double') restRule = RestRule.double_;
    if (rule == 'alternate') restRule = RestRule.alternate;

    // 日历标注（时间戳 → 北京时间当天）
    for (final e in _db.loadDayMarks().entries) {
      final bj = bjFromMillis(e.key);
      overrides['${bj.year}-${bj.month}-${bj.day}'] =
          CalDay(bj.year, bj.month, bj.day, _markByName(e.value.$1), e.value.$2);
    }
    notifyListeners();
  }

  DayMark _markByName(String name) => DayMark.values
      .firstWhere((m) => m.name == name, orElse: () => DayMark.custom);

  List<PunchItem> get items =>
      mode == PunchMode.pairPerSegment ? pairItems : onceItems;

  /// 圆钮指向的第一个未完成项
  PunchItem? get nextItem {
    for (final it in items) {
      if (!it.done) return it;
    }
    for (final ot in overtimes) {
      for (final it in [ot.inItem, ot.outItem]) {
        if (!it.done) return it;
      }
    }
    return null;
  }

  void refreshLocks() {
    final nowMin = bjNow().hour * 60 + bjNow().minute;
    for (final it in [
      ...items,
      for (final o in overtimes) ...[o.inItem, o.outItem]
    ]) {
      if (it.done) continue;
      it.locked = it.kind == PunchKind.clockOut && nowMin < it.ref.minutes;
    }
  }

  String _segmentNameOf(PunchItem item) {
    for (var i = 0; i < segments.length; i++) {
      if (mode == PunchMode.pairPerSegment && identical(item, pairItems[i * 2])) {
        return segments[i].name;
      }
      if (mode == PunchMode.pairPerSegment && identical(item, pairItems[i * 2 + 1])) {
        return segments[i].name;
      }
      if (mode == PunchMode.oncePerDay) return '整日';
    }
    for (final ot in overtimes) {
      if (identical(item, ot.inItem) || identical(item, ot.outItem)) {
        return ot.name;
      }
    }
    return '整日';
  }

  /// 打卡/取消打卡（点圆钮或点待办条目），打卡时刻与判定均用北京时间，落库存时间戳
  void toggle(PunchItem item, {DateTime? at}) {
    final now = at ?? bjNow();
    final nowMin = now.hour * 60 + now.minute;
    refreshLocks();
    final dayKey = bjDayKey(now);
    final segName = _segmentNameOf(item);

    if (!item.done) {
      item.recordMinutes = nowMin;
      PunchStatus status;
      if (item.kind == PunchKind.clockIn) {
        status = nowMin > item.ref.minutes ? PunchStatus.late : PunchStatus.ok;
      } else {
        status = nowMin >= item.ref.minutes ? PunchStatus.ok : PunchStatus.early;
      }
      item.status = status;
      _db.insertPunch(
        recordTs: toMillisUtc(now),
        refTs: _refTs(now, item.ref),
        kind: item.kind.name,
        segmentName: segName,
        segmentStartTs: _refTs(now, item.ref),
        segmentEndTs: _refTs(now, item.ref),
        mode: mode.name,
        status: status.name,
        dayKey: dayKey,
      );
    } else {
      // 补记：事后直接勾选无审批；再点一次取消（同步删库）
      if (item.status == PunchStatus.ok ||
          item.status == PunchStatus.late ||
          item.status == PunchStatus.early) {
        item.status = PunchStatus.makeup;
      } else {
        item.status = PunchStatus.pending;
        item.recordMinutes = null;
        if (item.kind == PunchKind.clockOut) item.locked = true;
        _db.deletePunch(dayKey: dayKey, segmentName: segName, kind: item.kind.name);
      }
    }
    notifyListeners();
  }

  /// 参考时刻（北京时间 当天 ref 时分）→ UTC 毫秒时间戳
  int _refTs(DateTime bj, SegTime ref) =>
      toMillisUtc(DateTime(bj.year, bj.month, bj.day, ref.hour, ref.minute));

  void setMode(PunchMode m) {
    mode = m;
    _db.setSetting('punch_mode', m == PunchMode.oncePerDay ? 'once' : 'pair');
    refreshLocks();
    notifyListeners();
  }

  void addOvertime() {
    final n = overtimes.length + 1;
    overtimes.add(OvertimeSegment(
        '加班段 $n（仅今天）',
        WorkSegment('加班$n', SegTime.parse('18:00'), SegTime.parse('21:00'))));
    refreshLocks();
    notifyListeners();
  }

  void removeOvertime(OvertimeSegment ot) {
    overtimes.remove(ot);
    _db.deletePunch(
        dayKey: bjDayKey(bjNow()), segmentName: ot.name, kind: 'in');
    _db.deletePunch(
        dayKey: bjDayKey(bjNow()), segmentName: ot.name, kind: 'out');
    refreshLocks();
    notifyListeners();
  }

  void updateOvertimeTime(OvertimeSegment ot,
      {SegTime? start, SegTime? end}) {
    ot.seg = ot.seg.copyWith(start: start, end: end);
    ot.syncRef();
    refreshLocks();
    notifyListeners();
  }

  // ---- 出勤统计（模拟） ----
  final int shouldDays = 21;
  final int actualDays = 18;
  final int lateCount = 1;
  final int missedCount = 0;

  // ---- 日历 ----
  RestRule restRule = RestRule.single;
  final Map<String, CalDay> overrides = {}; // 用户手动标注

  static const legal2026 = {
    '2026-10-1': '国庆',
    '2026-10-2': '国庆',
    '2026-10-3': '国庆',
    '2026-10-4': '中秋',
    '2026-10-5': '国庆',
    '2026-10-6': '国庆',
    '2026-10-7': '国庆',
    '2026-10-8': '国庆',
  };
  static const adjust2026 = {'2026-9-26': '班', '2026-10-10': '班'};
  static const customSeed = {'2026-9-30': '年假'};

  /// 标记优先级：用户覆盖 > 法定假日/调休 > 星期规则
  CalDay dayFor(int year, int month, int day) {
    final key = '$year-$month-$day';
    final ov = overrides[key];
    if (ov != null) return ov;
    if (customSeed[key] != null) {
      return CalDay(year, month, day, DayMark.custom, customSeed[key]);
    }
    if (legal2026[key] != null) {
      return CalDay(year, month, day, DayMark.legal, legal2026[key]);
    }
    if (adjust2026[key] != null) {
      return CalDay(year, month, day, DayMark.adjust, '班');
    }
    final wd = DateTime(year, month, day).weekday;
    final isOff = restRule == RestRule.double_
        ? (wd == 6 || wd == 7)
        : restRule == RestRule.single
            ? wd == 7
            : _alternateOff(year, month, day, wd);
    return CalDay(year, month, day, isOff ? DayMark.off : DayMark.none,
        isOff ? '休' : null);
  }

  bool _alternateOff(int y, int m, int d, int wd) {
    if (wd != 6 && wd != 7) return false;
    final week = DateTime(y, m, d).difference(DateTime(2026, 1, 5)).inDays ~/ 7;
    return wd == 7 || week.isEven;
  }

  void markDay(int y, int m, int d, DayMark mark) {
    final note = _markLabel(mark);
    overrides['$y-$m-$d'] = CalDay(y, m, d, mark, note);
    _db.upsertDayMark(
        dayKey: toMillisUtc(DateTime(y, m, d)), mark: mark.name, note: note);
    notifyListeners();
  }

  void clearDay(int y, int m, int d) {
    overrides.remove('$y-$m-$d');
    _db.deleteDayMark(toMillisUtc(DateTime(y, m, d)));
    notifyListeners();
  }

  String? _markLabel(DayMark m) {
    switch (m) {
      case DayMark.custom:
        return '假';
      case DayMark.leave:
        return '请假';
      case DayMark.off:
        return '休';
      case DayMark.adjust:
        return '班';
      default:
        return null;
    }
  }

  void setRestRule(RestRule r) {
    restRule = r;
    _db.setSetting('rest_rule', switch (r) {
      RestRule.single => 'single',
      RestRule.double_ => 'double',
      RestRule.alternate => 'alternate',
    });
    notifyListeners();
  }

  // ---- 设置 ----
  bool remindEnabled = true;
  int remindAheadMinutes = 5;
  bool onTimeRemind = true;
  bool fallbackRemind = false;
  int graceMinutes = 5;
  int holidayDataYear = 2026;

  void update(void Function() fn) {
    fn();
    _db.setSetting('remind_enabled', remindEnabled ? '1' : '0');
    _db.setSetting('remind_ahead', '$remindAheadMinutes');
    _db.setSetting('on_time_remind', onTimeRemind ? '1' : '0');
    _db.setSetting('fallback_remind', fallbackRemind ? '1' : '0');
    _db.setSetting('grace', '$graceMinutes');
    notifyListeners();
  }
}
