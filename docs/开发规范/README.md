# 轨道 Orbit 开发规范

> 适用项目：轨道 Orbit（Flutter 移动端 + 知识中枢 Web 全栈应用）同仓双工具链
> 版本：v0.1
> 日期：2026-09-28
> 参考：mold 项目《开发规范》v0.2（结构与条款借鉴，按本项目技术栈适配）

---

## 规范索引

| 序号 | 文档 | 内容 | 适用范围 |
|---|---|---|---|
| 01 | [通用规范](./01-通用规范.md) | 命名、仓库目录、Import 顺序、注释、Git 提交、数据字段约定 | 全仓（Web + Flutter） |
| 02 | [Web 开发规范](./02-Web开发规范.md) | Next.js 全栈：路由、Server Actions、TypeScript、React、Tailwind + SCSS、数据访问 | `web/hub/` |
| 03 | [Flutter 开发规范](./03-Flutter规范.md) | Dart / Riverpod / Drift 约定与分层 | `lib/`、`test/` |

---

## 技术栈速览

| 端 | 技术 | 说明 |
|---|---|---|
| 知识中枢 Web（`web/hub/`） | Next.js（App Router）+ TypeScript | 全栈一统：服务端组件读、Server Actions 写 |
| Web 样式 | Tailwind CSS + SCSS | 原子类与组件样式两入口分工，见 02 §5 |
| Web 存储 | `node:sqlite`（Node 内置） | 无 ORM；seed JSON 启动灌库 |
| 移动端（Flutter） | Flutter + Riverpod + go_router + Drift | V1 主线：今日待办与日计划 |

---

## 执行原则

1. **默认遵循**：新增代码必须遵循本规范，Code Review（或自查）对照检查。
2. **存量优先**：修改已有文件时，若原文件存在不同的局部约定，优先保持文件内风格一致，并在变更摘要中说明。
3. **中文沟通**：团队内沟通、文档、PR 描述、代码注释统一使用中文。
4. **中文 UI**：界面文案默认使用中文，除非明确要求其他语言。
5. **计划先行**：结构性变更（目录、选型、数据模型）先更新 `docs/HUB_PLAN.md` 等计划文档，再动代码。

---

## 文件目录约定

| 目录 | 用途 |
|---|---|
| `web/` | Web 工作区：容器 + 索引（`web/README.md`），一个 Web 项目一个子目录（结构见 HUB_PLAN §3） |
| `web/hub/` | 知识中枢 Next.js 全栈应用（自包含：package.json、配置、源码） |
| `web/hub/app/` | 路由层（薄：只放官方约定文件 layout / page / loading / not-found / error / route） |
| `web/hub/features/<业务域>/` | 业务域（workspace、projects、tasks、work-items、knowledge）：components + actions |
| `web/hub/components/` | 跨业务通用 UI：`shell/`（应用外壳）、`ui/`（小组件与令牌出口） |
| `web/hub/lib/` | 跨业务基础设施：db、seed |
| `lib/`、`test/` | Flutter 源码与测试 |
| `docs/` | 项目文档（方案、计划、视觉稿索引、开发规范） |
| `docs/开发规范/` | 本规范 |
