import 'package:flutter_test/flutter_test.dart';

import 'package:orbit/data/db.dart';
import 'package:orbit/main.dart';
import 'package:orbit/pages/calendar_page.dart';
import 'package:orbit/pages/clock_page.dart';
import 'package:orbit/pages/settings_page.dart';

void main() {
  testWidgets('打卡页默认展示，底部三 Tab 可切换', (WidgetTester tester) async {
    // 使用内存库，避免测试环境依赖文件系统
    final db = AppDb.open(':memory:');
    await tester.pumpWidget(OrbitApp(db: db));
    await tester.pumpAndSettle();

    // 默认进入打卡页
    expect(find.byType(ClockPage), findsOneWidget);

    // 切到工作页（假期日历）
    await tester.tap(find.text('工作'));
    await tester.pumpAndSettle();
    expect(find.byType(CalendarPage), findsOneWidget);

    // 切到设置页
    await tester.tap(find.text('设置'));
    await tester.pumpAndSettle();
    expect(find.byType(SettingsPage), findsOneWidget);
  });
}
