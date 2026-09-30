import 'package:flutter/material.dart';
import '../models/attendance.dart';
import '../state/attendance_store.dart';
import '../theme.dart';

/// Tab② 工作页（假期日历）
class CalendarPage extends StatefulWidget {
  final AttendanceStore store;
  const CalendarPage({super.key, required this.store});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _month = DateTime(2026, 9);
  int? _selectedDay;

  Color _markColor(DayMark m) {
    switch (m) {
      case DayMark.legal:
        return AppColors.legalRed;
      case DayMark.adjust:
        return AppColors.adjustOrange;
      case DayMark.custom:
        return AppColors.customBlue;
      case DayMark.leave:
        return AppColors.leavePurple;
      case DayMark.off:
        return AppColors.offGray;
      case DayMark.none:
        return Colors.white;
    }
  }

  void _shiftMonth(int n) {
    setState(() {
      _month = DateTime(_month.year, _month.month + n);
      _selectedDay = null;
    });
  }

  Future<void> _openSheet(DateTime day) async {
    final store = widget.store;
    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => AnimatedBuilder(
        animation: store,
        builder: (ctx, _) {
          final info = store.dayFor(day.year, day.month, day.day);
          final weekdays = ['一', '二', '三', '四', '五', '六', '日'];
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment:
                CrossAxisAlignment.start, children: [
              Center(
                  child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 12),
              Text('${day.month}月${day.day}日 · 周${weekdays[day.weekday - 1]}',
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700)),
              Text('当前状态：${info.mark.label}',
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _sheetChip('标为自定义假', DayMark.custom, day),
                  _sheetChip('标为请假', DayMark.leave, day),
                  _sheetChip('标为休息', DayMark.off, day),
                  _sheetChip('标为上班', DayMark.adjust, day),
                  ActionChip(
                      label: const Text('恢复默认',
                          style: TextStyle(fontSize: 11, color: Colors.grey)),
                      onPressed: () {
                        store.clearDay(day.year, day.month, day.day);
                        setState(() => _selectedDay = day.day);
                        Navigator.pop(ctx);
                      }),
                ],
              ),
              const SizedBox(height: 12),
              const Text('当日上下班时段',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              for (final seg in store.segments)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(children: [
                    Text('${seg.start.label} — ${seg.end.label}',
                        style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 8),
                    const Chip(label: Text('改', style: TextStyle(fontSize: 11))),
                  ]),
                ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                    onPressed: () => Navigator.pop(ctx), child: const Text('保存')),
              ),
            ]),
          );
        },
      ),
    );
  }

  Widget _sheetChip(String label, DayMark mark, DateTime day) {
    final store = widget.store;
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      onPressed: () {
        store.markDay(day.year, day.month, day.day, mark);
        setState(() => _selectedDay = day.day);
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = widget.store;
    final now = DateTime.now();
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              Text('${_month.year}年${_month.month}月',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w800)),
              const Spacer(),
              IconButton(
                  onPressed: () => _shiftMonth(-1),
                  icon: const Icon(Icons.chevron_left)),
              IconButton(
                  onPressed: () => _shiftMonth(1),
                  icon: const Icon(Icons.chevron_right)),
            ]),
          ),
          _calendarGrid(store, now),
          _legend(),
          _quickSettings(store),
          _nextHolidayCard(),
        ],
      ),
    );
  }

  Widget _calendarGrid(AttendanceStore store, DateTime now) {
    final dows = ['一', '二', '三', '四', '五', '六', '日'];
    final firstWeekday = DateTime(_month.year, _month.month, 1).weekday;
    final daysInMonth =
        DateTime(_month.year, _month.month + 1, 0).day;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(children: [
        Row(
          children: [
            for (final d in dows)
              Expanded(
                  child: Center(
                      child: Text('周$d',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.grey)))),
          ],
        ),
        ...List.generate(((firstWeekday - 1 + daysInMonth) / 7).ceil(), (row) {
          return Row(children: [
            for (var col = 0; col < 7; col++)
              Expanded(child: _dayCell(store, now, row * 7 + col - (firstWeekday - 1))),
          ]);
        }),
      ]),
    );
  }

  Widget _dayCell(AttendanceStore store, DateTime now, int dayNum) {
    if (dayNum < 1 || dayNum > DateTime(_month.year, _month.month + 1, 0).day) {
      return const AspectRatio(aspectRatio: 1 / 1.05, child: SizedBox());
    }
    final info = store.dayFor(_month.year, _month.month, dayNum);
    final isToday = now.year == _month.year &&
        now.month == _month.month &&
        now.day == dayNum;
    final isSelected = _selectedDay == dayNum;
    return AspectRatio(
      aspectRatio: 1 / 1.05,
      child: Padding(
        padding: const EdgeInsets.all(2),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            setState(() => _selectedDay = dayNum);
            _openSheet(DateTime(_month.year, _month.month, dayNum));
          },
          child: Container(
            decoration: BoxDecoration(
              color: _markColor(info.mark),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected
                    ? AppColors.primaryDeep
                    : isToday
                        ? Colors.grey
                        : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('$dayNum',
                    style: TextStyle(
                        fontSize: 13,
                        color: info.mark == DayMark.off
                            ? Colors.grey
                            : Colors.black87)),
                if (info.note != null)
                  Text(info.note!,
                      style: TextStyle(
                          fontSize: 8,
                          color: info.mark == DayMark.off
                              ? Colors.grey
                              : Colors.black54)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _legend() => Padding(
        padding: const EdgeInsets.fromLTRB(18, 6, 18, 0),
        child: Wrap(
          spacing: 10,
          runSpacing: 4,
          children: [
            for (final e in {
              '法定假日': AppColors.legalRed,
              '调休上班': AppColors.adjustOrange,
              '自定义假': AppColors.customBlue,
              '请假': AppColors.leavePurple,
              '周末休': AppColors.offGray,
            }.entries)
              Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                        color: e.value,
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: Colors.grey.shade300))),
                const SizedBox(width: 3),
                Text(e.key,
                    style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ]),
          ],
        ),
      );

  Widget _quickSettings(AttendanceStore store) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('快捷设置',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final r in RestRule.values)
                  ChoiceChip(
                    label: Text(r.label, style: const TextStyle(fontSize: 11)),
                    selected: store.restRule == r,
                    onSelected: (_) => store.setRestRule(r),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            const Text('※ 切换后从今天起生效，已手动标注的日期保留覆盖',
                style: TextStyle(fontSize: 11, color: Colors.grey)),
          ]),
        ),
      );

  Widget _nextHolidayCard() => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('下次假日：国庆节',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700)),
                    SizedBox(height: 2),
                    Text('10月1日 — 10月8日 · 还剩 2 天',
                        style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ]),
            ),
          ]),
        ),
      );
}
