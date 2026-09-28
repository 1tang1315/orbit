# 03 — Flutter 开发规范

> 技术栈：Flutter + Riverpod + go_router + Drift（SQLite）。
> 通用约定（命名、Import、注释、Git、时间与 ID）见 [01-通用规范](./01-通用规范.md)。Web 侧见 [02-Web开发规范](./02-Web开发规范.md)。

---

## 1. 目录结构

按 `docs/ARCHITECTURE.md` §4 的分层落地，功能内聚、不按页面平铺：

```text
lib/
  main.dart                 # 入口：初始化（时区、通知、DB）后 runApp
  app.dart                  # MaterialApp.router + 主题 + ProviderScope
  core/                     # 主题、常量、时间工具、结果类型
  database/                 # Drift 表、连接、迁移
  features/
    todo/                   # 按功能域分包
      data/                 # Repository 实现、Drift DAO
      domain/               # 实体、仓储接口
      application/          # Controller / Provider（Riverpod）
      presentation/         # 页面与组件
    plan/
    notification/
    widget/
    export/
  shared/                   # 通用组件
test/                       # 与 lib/ 结构对称
```

- 新功能先归入现有 `features/<域>`；新域的创建与迁移同步更新 `ARCHITECTURE.md` §4。

## 2. 分层纪律（硬性）

| 规则 | 说明 |
|---|---|
| UI 不直接写 SQL | 页面/组件只依赖 Controller 与 Repository |
| Controller 不 import Drift | 依赖仓储接口（domain 层），便于测试替换 |
| 通知/小组件与 App 同库 | 同一份 SQLite，不建第二份真相 |
| 领域模型与 Drift 表分离 | 实体不 `extends Table`，映射在 data 层完成 |

## 3. 命名与风格

- 文件名 **snake_case**（`todo_controller.dart`）；类 PascalCase；方法/变量 camelCase；常量可能被外部使用的用 `lowerCamelCase`（Dart 惯例 `maxRetryCount`），与 Web 的 `UPPER_SNAKE_CASE` 不强行统一——**各端守各端生态惯例**。
- Lint 以仓库 `analysis_options.yaml`（`flutter_lints`）为准；**提交前必须 `flutter analyze` 零 issue**。
- `const` 能加则加；widget 构造器一律 `const` 可用时提供 `const` 构造。
- 私有成员前缀 `_`；对外 API 明确 `public`，不为测试暴露本可不暴露的成员。

## 4. 状态管理（Riverpod）

- Provider 命名：`<域><职责>Provider`（`todoListProvider`、`todayPlanProvider`）。
- 异步数据用 `AsyncValue`，UI 统一处理 loading / error / data 三态，不手写三层布尔标记。
- 副作用（通知调度、写库）放 Controller/Provider，不进 widget 构建方法。

## 5. 数据层（Drift）

- 表结构变更走 Drift 迁移（`MigrationStrategy`），**不删库重来**；schema 与 `docs/DATA_MODEL.md` 保持同步，改表先改文档。
- 查询带索引字段（`scheduled_for`、`remind_at`、`day`）走既定索引，见 DATA_MODEL 各表说明。
- 时间入库 UTC ISO-8601；展示层转本地（见 01 §6）。

## 6. 注释与文档

- 中文注释，解释"为什么"（见 01 §4）。
- 公共 Controller 方法与 Repository 接口必须有 doc 注释。
- 设计决策写进 `docs/`（ARCHITECTURE / HUB_PLAN），不堆在代码注释里。

## 7. 测试

- Repository / Controller 可测部分配单元测试，放 `test/` 对称路径。
- 纯函数（日期工具、通知 ID 生成、排序）优先覆盖。
- 提交前：`flutter analyze` + `flutter test` 通过（Web 改动可跳过测试但 analyze 照跑）。

## 8. 与 Web 的共享约定

- **Git 提交格式**（01 §5）与**中文文案**（01 §7）全仓一致。
- 软删除、稳定 ID、UTC 时间约定与 Web 数据模型同源（DATA_MODEL.md 是唯一权威）。
- 不确定的结构性变更（新表、新模块、跨端同步字段）先改计划文档再动代码。
