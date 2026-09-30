import 'dart:async';
import 'package:flutter/material.dart';
import '../models/attendance.dart';
import '../state/attendance_store.dart';
import '../theme.dart';
import '../utils/bj_time.dart';

/// Tab① 打卡页
class ClockPage extends StatefulWidget {
  final AttendanceStore store;
  const ClockPage({super.key, required this.store});

  @override
  State<ClockPage> createState() => _ClockPageState();
}

class _ClockPageState extends State<ClockPage> {
  late final Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = bjNow()); // 统一使用北京时间
      widget.store.refreshLocks();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final store = widget.store;
    final weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    final wd = weekdays[_now.weekday - 1];
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text(
                '今日 · ${_now.month}月${_now.day}日 $wd（${store.mode == PunchMode.pairPerSegment ? '每段一对' : '整日一对'}模式）',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
            child: Text(
                '工作日 · 段：${store.segments.map((s) => '${s.name} ${s.range}').join(' / ')}',
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ),
          _punchCircle(store),
          _todayCard(store),
          _monthCard(store),
        ],
      ),
    );
  }

  Widget _punchCircle(AttendanceStore store) {
    final next = store.nextItem;
    final bool locked;
    String main, sub;
    if (next == null) {
      locked = true;
      main = '今日已打完';
      sub = '';
    } else {
      locked = next.locked;
      main = '${next.kind.label}打卡';
      sub = locked ? '${next.ref.label} 后可打' : '';
    }
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primaryDeep, width: 2),
      ),
      child: Column(children: [
        Text('${_two(_now.hour)}:${_two(_now.minute)}:${_two(_now.second)}',
            style: const TextStyle(
                fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: 1)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: next == null || locked ? null : () => store.toggle(next, at: _now),
          child: Container(
            width: 110,
            height: 110,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: locked ? AppColors.offGray : AppColors.primary,
              border: Border.all(
                  color: locked ? Colors.grey : AppColors.primaryDeep, width: 2),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(main,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: locked ? Colors.grey : Colors.white)),
                if (sub.isNotEmpty)
                  Text(sub,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 10,
                          color: locked ? Colors.grey : Colors.white70)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
      ]),
    );
  }

  Widget _punchRow(AttendanceStore store, PunchItem item,
      {String? group, OvertimeSegment? ot}) {
    Color stColor;
    switch (item.status) {
      case PunchStatus.late:
        stColor = AppColors.legalRed;
      case PunchStatus.early:
        stColor = AppColors.adjustOrange;
      case PunchStatus.ok:
      case PunchStatus.makeup:
        stColor = const Color(0xFFDFE6DF);
      case PunchStatus.pending:
        stColor = AppColors.offGray;
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (group != null)
        Padding(
          padding: const EdgeInsets.only(top: 6, bottom: 2),
          child: Text(group,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey,
                  letterSpacing: .5)),
        ),
      InkWell(
        onTap: item.locked && !item.done
            ? null
            : () {
                if (ot != null) {
                  store.toggle(item, at: _now);
                } else {
                  store.toggle(item, at: _now);
                }
              },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 9),
          child: Row(children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                    color: item.locked && !item.done
                        ? Colors.grey
                        : AppColors.primaryDeep,
                    width: 2),
                color: item.done ? AppColors.primary : Colors.white,
              ),
              child: item.done
                  ? const Icon(Icons.check, size: 15, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 10),
            Text(item.kind.label,
                style: TextStyle(
                    fontSize: 13,
                    color: item.done ? Colors.grey : Colors.black87,
                    decoration: item.done ? TextDecoration.lineThrough : null)),
            const Spacer(),
            Text(item.recordLabel,
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                  color: stColor, borderRadius: BorderRadius.circular(4)),
              child: Text(item.statusLabel,
                  style: const TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ),
    ]);
  }

  Widget _todayCard(AttendanceStore store) {
    final List<Widget> rows;
    if (store.mode == PunchMode.pairPerSegment) {
      rows = [];
      for (var i = 0; i < store.segments.length; i++) {
        rows.add(_punchRow(store, store.pairItems[i * 2],
            group: '${store.segments[i].name} ${store.segments[i].range}'));
        rows.add(_punchRow(store, store.pairItems[i * 2 + 1]));
      }
    } else {
      rows = [
        _punchRow(store, store.onceItems[0]),
        _punchRow(store, store.onceItems[1]),
      ];
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(children: [
          Row(children: [
            const Text('今日记录',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const Spacer(),
            _modeChip(store),
          ]),
          const SizedBox(height: 4),
          ...rows,
          const SizedBox(height: 8),
          for (final ot in store.overtimes) _otEditor(store, ot),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.add, size: 18),
              label: const Text('临时加班段'),
              onPressed: store.addOvertime,
            ),
          ),
        ]),
      ),
    );
  }

  Widget _modeChip(AttendanceStore store) => ToggleButtons(
        isSelected: [
          store.mode == PunchMode.pairPerSegment,
          store.mode == PunchMode.oncePerDay
        ],
        onPressed: (i) => store.setMode(
            i == 0 ? PunchMode.pairPerSegment : PunchMode.oncePerDay),
        borderRadius: BorderRadius.circular(999),
        constraints: const BoxConstraints(minHeight: 28),
        textStyle: const TextStyle(fontSize: 11),
        children: const [
          Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('每段一对')),
          Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('整日一对')),
        ],
      );

  Widget _otEditor(AttendanceStore store, OvertimeSegment ot) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(ot.name,
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey)),
            const SizedBox(width: 8),
            Flexible(
              child: _timeField(
                ot.seg.start.label,
                (t) => store.updateOvertimeTime(ot, start: t),
              ),
            ),
            const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text('—', style: TextStyle(color: Colors.grey))),
            Flexible(
              child: _timeField(
                ot.seg.end.label,
                (t) => store.updateOvertimeTime(ot, end: t),
              ),
            ),
            const Spacer(),
            TextButton(
                onPressed: () => store.removeOvertime(ot),
                child: const Text('删除', style: TextStyle(fontSize: 12))),
          ]),
          _punchRow(store, ot.inItem),
          _punchRow(store, ot.outItem),
        ],
      );

  Widget _timeField(String initial, ValueChanged<SegTime> onPick) =>
      OutlinedButton(
        style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            minimumSize: const Size(0, 32),
            textStyle: const TextStyle(fontSize: 12)),
        onPressed: () async {
          final parts = initial.split(':');
          final picked = await showTimePicker(
            context: context,
            initialTime: TimeOfDay(
                hour: int.parse(parts[0]), minute: int.parse(parts[1])),
          );
          if (picked != null) onPick(SegTime(picked.hour, picked.minute));
        },
        child: Text(initial),
      );

  Widget _monthCard(AttendanceStore store) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            const Text('本月出勤',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const Spacer(),
            Text(
                '应勤 ${store.shouldDays} · 实勤 ${store.actualDays} · 迟到 ${store.lateCount} · 漏卡 ${store.missedCount}',
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ]),
        ),
      );
}
