import 'package:flutter/material.dart';
import '../models/attendance.dart';
import '../state/attendance_store.dart';

/// Tab③ 设置页
class SettingsPage extends StatelessWidget {
  final AttendanceStore store;
  const SettingsPage({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('设置',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          ),
          _card('打卡模式', [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final m in PunchMode.values)
                  ChoiceChip(
                    label: Text(m.label, style: const TextStyle(fontSize: 11)),
                    selected: store.mode == m,
                    onSelected: (_) => store.setMode(m),
                  ),
              ],
            ),
          ]),
          _card('默认上下班时段', [
            for (final seg in store.segments)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(children: [
                  Text('${seg.name}  ${seg.start.label} — ${seg.end.label}',
                      style: const TextStyle(fontSize: 13)),
                  const Spacer(),
                  TextButton(
                      onPressed: () => _editSegment(context, seg),
                      child: const Text('改', style: TextStyle(fontSize: 12))),
                ]),
              ),
            Align(
              alignment: Alignment.centerLeft,
              child: ActionChip(
                  label: const Text('＋ 加段', style: TextStyle(fontSize: 12)),
                  onPressed: () {}),
            ),
          ]),
          _card('打卡提醒', [
            _switchRow('启用提醒', store.remindEnabled,
                (v) => store.update(() => store.remindEnabled = v)),
            _stepperRow('提前提醒（分钟）', store.remindAheadMinutes,
                (v) => store.update(() => store.remindAheadMinutes = v)),
            _switchRow('到点提醒', store.onTimeRemind,
                (v) => store.update(() => store.onTimeRemind = v)),
            _switchRow('未打完兜底提醒（如 20:00）', store.fallbackRemind,
                (v) => store.update(() => store.fallbackRemind = v)),
          ]),
          _card('', [
            _stepperRow('迟到判定宽限（分钟）', store.graceMinutes,
                (v) => store.update(() => store.graceMinutes = v)),
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: const Text('法定假日数据', style: TextStyle(fontSize: 14)),
              trailing: Text('${store.holidayDataYear} · 已更新 ›',
                  style: const TextStyle(fontSize: 13, color: Colors.grey)),
              onTap: () {},
            ),
          ]),
        ],
      ),
    );
  }

  Future<void> _editSegment(BuildContext context, WorkSegment seg) async {
    final store = this.store;
    final newStart = await showTimePicker(
        context: context,
        initialTime: TimeOfDay(hour: seg.start.hour, minute: seg.start.minute));
    if (newStart == null || !context.mounted) return;
    final newEnd = await showTimePicker(
        context: context, initialTime: TimeOfDay(hour: seg.end.hour, minute: seg.end.minute));
    if (newEnd == null) return;
    final idx = store.segments.indexOf(seg);
    store.update(() {
      store.segments[idx] = WorkSegment(
          seg.name,
          SegTime(newStart.hour, newStart.minute),
          SegTime(newEnd.hour, newEnd.minute));
    });
  }

  Widget _card(String title, List<Widget> children) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (title.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(title,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700)),
              ),
            ...children,
          ]),
        ),
      );

  Widget _switchRow(String label, bool value, ValueChanged<bool> onChanged) =>
      Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 14))),
        Switch(value: value, onChanged: onChanged, activeThumbColor: const Color(0xFF7C4DFF)),
      ]);

  Widget _stepperRow(String label, int value, ValueChanged<int> onChanged) =>
      Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 14))),
        IconButton(
            onPressed: () => onChanged(value - 1), icon: const Icon(Icons.remove)),
        Text('$value', style: const TextStyle(fontWeight: FontWeight.w700)),
        IconButton(
            onPressed: () => onChanged(value + 1), icon: const Icon(Icons.add)),
      ]);
}
