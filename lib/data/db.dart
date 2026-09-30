import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart';

/// 本地持久化。约定：所有时间列一律存 UTC 毫秒时间戳（INTEGER），时区转换统一在读取层做北京时间。
class AppDb {
  AppDb._(this._db);

  final Database _db;
  static AppDb? _instance;

  /// 生产入口：文档目录下的 orbit_work.db
  static Future<AppDb> instance() async {
    if (_instance != null) return _instance!;
    final dir = await getApplicationDocumentsDirectory();
    _instance = AppDb.open(p.join(dir.path, 'orbit_work.db'));
    return _instance!;
  }

  /// 可注入路径；测试用 ':memory:'
  factory AppDb.open(String path) {
    final db = sqlite3.open(path);
    db.execute('PRAGMA foreign_keys = ON');
    db.execute('''
      CREATE TABLE IF NOT EXISTS punch_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_ts INTEGER NOT NULL,          -- 打卡时刻（UTC 毫秒时间戳）
        ref_ts INTEGER NOT NULL,             -- 判定参考时刻（UTC 毫秒时间戳）
        kind TEXT NOT NULL,                  -- in / out
        segment_name TEXT NOT NULL,          -- 段名，如 早班 / 加班1
        segment_start_ts INTEGER NOT NULL,   -- 段开始（UTC 毫秒）
        segment_end_ts INTEGER NOT NULL,     -- 段结束（UTC 毫秒）
        mode TEXT NOT NULL,                  -- pair / once
        status TEXT NOT NULL,                -- ok / late / early / makeup
        day_key INTEGER NOT NULL             -- 北京时间当天零点的时间戳
      )
    ''');
    db.execute('''
      CREATE TABLE IF NOT EXISTS day_marks (
        day_key INTEGER PRIMARY KEY,         -- 北京时间当天零点的时间戳
        mark TEXT NOT NULL,                  -- legal / adjust / custom / leave / off
        note TEXT
      )
    ''');
    db.execute('''
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');
    return AppDb._(db);
  }

  // ---- 打卡记录 ----
  void insertPunch({
    required int recordTs,
    required int refTs,
    required String kind,
    required String segmentName,
    required int segmentStartTs,
    required int segmentEndTs,
    required String mode,
    required String status,
    required int dayKey,
  }) {
    _db.execute(
      'INSERT INTO punch_records(record_ts, ref_ts, kind, segment_name, segment_start_ts, segment_end_ts, mode, status, day_key)'
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [recordTs, refTs, kind, segmentName, segmentStartTs, segmentEndTs, mode, status, dayKey],
    );
  }

  /// 删除某天某段某向的未完成/旧记录（用于取消打卡或加班段删除）
  void deletePunch({
    required int dayKey,
    required String segmentName,
    required String kind,
  }) {
    _db.execute(
      'DELETE FROM punch_records WHERE day_key = ? AND segment_name = ? AND kind = ?',
      [dayKey, segmentName, kind],
    );
  }

  List<Map<String, Object?>> punchesForDay(int dayKey) {
    final rows = _db.select(
      'SELECT * FROM punch_records WHERE day_key = ? ORDER BY record_ts',
      [dayKey],
    );
    return rows.map((r) => {
          'record_ts': r['record_ts'] as int,
          'ref_ts': r['ref_ts'] as int,
          'kind': r['kind'] as String,
          'segment_name': r['segment_name'] as String,
          'status': r['status'] as String,
        }).toList();
  }

  // ---- 日历标注 ----
  void upsertDayMark({required int dayKey, required String mark, String? note}) {
    _db.execute(
      'INSERT INTO day_marks(day_key, mark, note) VALUES (?, ?, ?)'
      ' ON CONFLICT(day_key) DO UPDATE SET mark = excluded.mark, note = excluded.note',
      [dayKey, mark, note],
    );
  }

  void deleteDayMark(int dayKey) {
    _db.execute('DELETE FROM day_marks WHERE day_key = ?', [dayKey]);
  }

  Map<int, (String, String?)> loadDayMarks() {
    final rows = _db.select('SELECT day_key, mark, note FROM day_marks');
    return {
      for (final r in rows) r['day_key'] as int: (r['mark'] as String, r['note'] as String?),
    };
  }

  // ---- 设置（KV） ----
  String? getSetting(String key) {
    final rows = _db.select('SELECT value FROM app_settings WHERE key = ?', [key]);
    return rows.isEmpty ? null : rows.first['value'] as String;
  }

  void setSetting(String key, String value) {
    _db.execute(
      'INSERT INTO app_settings(key, value) VALUES (?, ?)'
      ' ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }
}
