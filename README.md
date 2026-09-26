# 轨道 Orbit

生活里工作、学习、待办等各条轨道，围绕同一中心运转。

**Orbit（轨道）** 不是「轨迹」——它强调多条线围绕同一中心运行。V1 先把「今日待办 + 日计划」这一条轨道转起来，后续再挂上项目、学习、工作与生活模块。

| 项 | 值 |
| --- | --- |
| 产品名 | 轨道 / Orbit |
| 包名 | `com.orbit.life` |
| 定位 | 个人 Life OS（先自用，打磨后再考虑对外） |
| V1 焦点 | 待办、日计划、本地通知、桌面小组件 |
| 当前阶段 | 设计文档（尚未脚手架 Flutter 工程） |

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/PRODUCT.md](docs/PRODUCT.md) | 产品定位、V1 边界、里程碑与风险 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术选型、分层、平台约束、通知与小组件 |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | V1 数据模型与可同步设计约定 |

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

脚手架与代码在设计评审通过后创建；工程将落在本目录，组织域 `com.orbit`，应用 ID `com.orbit.life`。

## 项目状态

- [x] 名称与产品边界确认
- [x] 技术栈与数据模型草稿
- [ ] Flutter 工程脚手架
- [ ] V1a：待办 + 日计划 + 本地通知
- [ ] V1b：桌面小组件与打磨
