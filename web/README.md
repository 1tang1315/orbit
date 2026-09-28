# Web 工作区

> 顶层 `web/` 只做容器与索引：**一个 Web 项目 = `web/<app-name>/` 一个自包含目录**（自己的 `package.json`、配置与工具链），项目之间不互相 import、不共享依赖。
> 公共约定（命名 / Import / 提交规范）见 [docs/开发规范](../docs/开发规范/README.md)；各项目的结构与里程碑见各自计划文档。

## 项目登记

| 目录 | 项目名 | 说明 | 状态 | 计划文档 |
| --- | --- | --- | --- | --- |
| `hub/` | 项目知识中枢 Hub | Next.js 全栈（App Router + Server Actions + `node:sqlite`），7 屏高保真示例数据 | 在建 | [docs/HUB_PLAN.md](../docs/HUB_PLAN.md) |

## 公共约定

- **独立工具链**：进入各项目目录操作（`cd web/hub && npm install && npm run dev`），仓库根的 Flutter 命令互不影响。
- **构建产物不入库**：`node_modules/`、`.next/`、`*.tsbuildinfo`、`next-env.d.ts`、`.data/` 已由根 `.gitignore` 统一覆盖（模式不带斜杠，通配任意深度）。
- **新增项目**：建 `web/<app-name>/` 平级目录，并在上表登记；不要把代码直接放进 `web/` 根。
- **跨项目复用**：本期不引 monorepo；确有共享代码需求时再把本文件所在目录升为 npm workspaces 根。

## 运行（以 hub 为例）

```powershell
cd web/hub
npm install        # 首次
npm run dev        # 开发服 :3000
npm run build      # 生产构建（含类型检查）
npm start          # 生产模式单端口
```
