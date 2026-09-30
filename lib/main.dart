import 'package:flutter/material.dart';
import 'data/db.dart';
import 'pages/calendar_page.dart';
import 'pages/clock_page.dart';
import 'pages/settings_page.dart';
import 'state/attendance_store.dart';
import 'theme.dart';

void main() {
  runApp(const OrbitApp());
}

class OrbitApp extends StatelessWidget {
  const OrbitApp({super.key, this.db});

  /// 可注入数据库；测试传内存库
  final AppDb? db;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Orbit · 工作板块',
      theme: buildTheme(),
      home: WorkModuleShell(db: db),
    );
  }
}

/// 底部导航：打卡 → 工作 → 设置
class WorkModuleShell extends StatefulWidget {
  const WorkModuleShell({super.key, this.db});

  final AppDb? db;

  @override
  State<WorkModuleShell> createState() => _WorkModuleShellState();
}

class _WorkModuleShellState extends State<WorkModuleShell> {
  AttendanceStore? _store;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    final db = widget.db;
    if (db != null) {
      _store = AttendanceStore(db);
    } else {
      AppDb.instance().then((d) => setState(() => _store = AttendanceStore(d)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = _store;
    if (store == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final pages = [
      ClockPage(store: store),
      CalendarPage(store: store),
      SettingsPage(store: store),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Orbit · 工作')),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.touch_app_outlined), selectedIcon: Icon(Icons.touch_app), label: '打卡'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: '工作'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: '设置'),
        ],
      ),
    );
  }
}
