# 轨道 Orbit

生活里工作、学习、待办等各条轨道，围绕同一中心运转。

**Orbit（轨道）** 不是「轨迹」——它强调多条线围绕同一中心运行。V1 先把「今日待办 + 日计划」这一条轨道转起来，后续再挂上项目、学习、工作与生活模块。

| 项 | 值 |
| --- | --- |
| 产品名 | 轨道 / Orbit |
| 包名 | `com.orbit.life` |
| 定位 | 个人 Life OS（先自用，打磨后再考虑对外） |
| V1 焦点 | 待办、日计划、本地通知、桌面小组件 |
| 当前阶段 | 脚手架已创建（等效 `flutter create`；依赖添加与首次运行在本机终端进行） |

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/PRODUCT.md](docs/PRODUCT.md) | 产品定位、V1 边界、里程碑与风险 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术选型、分层、平台约束、通知与小组件 |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | V1 数据模型与可同步设计约定 |
| [docs/AUTOMATION.md](docs/AUTOMATION.md) | 端协同与 AI 自动化蓝图（三端分工、收件箱异步流水线、MCP Server，V2） |
| [docs/DESIGN.md](docs/DESIGN.md) | 视觉稿索引（移动端 8 屏 + 知识中枢 Web 7 屏）与设计语言 |
| [docs/HUB_PLAN.md](docs/HUB_PLAN.md) | 知识中枢 Web App 实施计划（技术选型、数据模型、7 屏验收、分期） |

## 技术栈（V1）

- **客户端**：Flutter + Dart
- **状态**：Riverpod
- **路由**：go_router
- **本地库**：Drift（SQLite）
- **通知**：flutter_local_notifications + timezone
- **桌面小组件**：home_widget（Android 优先；iOS WidgetKit 需 macOS/CI）
- **后端**：无（local-first）

云同步、账号等不进 V1；数据层预留稳定 ID / 时间戳 / 软删除，便于以后接 PostgreSQL。

## V1 范围（摘要）

**做**：待办增删改与完成、日计划、截止与本地提醒、简单分类/标签、今日小组件、JSON 导出。

**不做**：账号与云同步、项目甘特、学习 SRS、薪资财务、情绪/运动/人际、AI、协作、Web/桌面端。

详见 [docs/PRODUCT.md](docs/PRODUCT.md)。

## 开发环境

本机为 Windows，Flutter SDK 示例路径：

```text
G:\app\Flutter\SDK\flutter_windows_3.38.1-stable\bin\flutter.bat
```

Android 可在本机完整开发调试。iOS 打包与 WidgetKit 需要 macOS 或 CI（如 Codemagic）。

脚手架已于 2026-09-28 创建（等效 `flutter create --org com.orbit --project-name orbit --platforms android,ios`，`namespace` / `applicationId` 均为 `com.orbit.life`），`dart pub get` 已完成解析。

依赖已安装（`flutter_riverpod` / `go_router` / `drift` / `drift_flutter` / `flutter_local_notifications` / `timezone` / `home_widget` / `path_provider` / `intl`），`android/app/build.gradle.kts` 已开启 core library desugaring（`flutter_local_notifications` 22.x 强制要求）。

下一步在本机终端执行（WorkBuddy 会话内无法派生子进程，flutter 命令需在终端运行）：

```powershell
flutter emulators --launch Medium_Phone   # 启动已有的 Android 36 模拟器
flutter analyze                            # 应为 No issues found
flutter run                                # 首次会下载 Gradle 8.14，耗时数分钟属正常
```

需要真机时，用 USB 打开「开发者选项 → USB 调试」后 `flutter devices` 确认。

> 依赖说明：`sqlite3_flutter_libs` 自 0.6.0 起为**空壳包**（官方描述 "Not used anymore"），
> `drift_flutter` 已传递依赖它用于阻挡旧构建脚本，因此**不要**把它加进直接依赖。

## 项目状态

- [x] 名称与产品边界确认
- [x] 技术栈与数据模型草稿
- [x] 视觉稿：移动端 8 屏 + 知识中枢 Web 7 屏（见 docs/DESIGN.md）
- [x] 端协同与 AI 自动化蓝图定稿（见 docs/AUTOMATION.md，V2 实现）
- [x] Flutter 工程脚手架
- [ ] 添加依赖（riverpod / go_router / drift / 通知 / 小组件）
- [ ] V1a：待办 + 日计划 + 本地通知
- [ ] V1b：桌面小组件与打磨
