# 项目知识中枢 · Web App 实施计划

状态：待实施。范围决策已确认（2026-09-28）：

- **交付物**：Web 界面 + 内置示例数据（7 屏全可点可跳转；真实 GitHub/AI 数据链路不在本期）
- **技术路线**：本地全栈 Web（NestJS 后端 + SQLite 持久化 + React 前端）
- **代码落点**：本仓库子目录 `hub/`

视觉依据：[DESIGN.md](DESIGN.md) §3 屏幕清单 + `docs/项目知识中枢 · Web App.pdf`（7 屏蓝本，6 页 PDF；第 7 屏 Bug 修复快轨按 DESIGN.md 文字规格实现）。
产品语义依据：`docs/项目知识中枢WebApp规划.txt`（三层知识模型 L1/L2/L3）、[AUTOMATION.md](AUTOMATION.md)（端分工与流水线）。

---

## 1. 目标与非目标

**目标**：在 `hub/` 落地一个本地可跑的知识中枢 Web 应用，用一套高保真示例数据（sk-mind / mold / in-stock-agent 三项目）把 7 屏全部走通，验证信息架构与交互，为后续接真实数据（GitHub 接入、AI 生成 L2）留好 API 口。

**非目标（本期不做）**：

- 真实 GitHub 仓库扫描 / webhook / 定时重扫
- AI 起草 L2、报告生成等模型调用
- DSH（DeepSeek Harness）插件体系
- 账号、多用户、公网部署
- Orbit 移动端改动（移动端仍是 V1 待办主线，互不影响）

## 2. 技术方案

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 前端框架 | React 19 + TypeScript + Vite | 生态成熟、7 屏路由清晰；Vite 构建快 |
| 路由（前端） | react-router-dom | 与视觉稿页面层级一一对应 |
| 样式 | 原生 CSS + 设计令牌（CSS 变量） | Notion 风格需要精确控制；零额外构建依赖 |
| 后端 | **NestJS**（Controller / Service / Module） | 用户确认选型，借项目练手并为后续长成真项目做工程化储备；本期接口少，用薄 Controller + Service 直连数据库 |
| ORM | 不引入（TypeORM/Prisma 均不加） | Prisma 引擎、TypeORM 驱动都有原生依赖下载风险（本项目曾因下载原生库失败踩坑）；手写 SQL 足够 |
| 存储 | `node:sqlite`（Node 24 内置） | 本机 Node v24.19 已验证可用；零原生编译、零下载风险，由 NestJS 的 DatabaseService 注入使用 |
| 示例数据 | JSON seed → 启动时灌入 SQLite | 数据变更走 JSON，便于对照视觉稿逐屏校对 |

运行方式：

```powershell
cd hub
npm install
npm run dev         # concurrently 起 NestJS :3789 + Vite :5173（/api 已代理）
npm run build       # web 产物构建 + api 类型检查编译
npm start           # 生产模式：NestJS 单端口托管 web/dist 与 /api
```

## 3. 目录结构

```text
hub/
  package.json
  nest-cli.json
  tsconfig.json
  vite.config.ts           # root 指向 web/，/api 代理到 :3789
  api/                     # NestJS 应用
    src/
      main.ts              # 启动入口：listen :3789；生产模式托管 ../web/dist
      app.module.ts
      db/
        database.service.ts  # node:sqlite 连接、建表、seed 装载（Injectable）
        seed/
          projects.json
          activity.json
          tasks.json
          work_items.json
          knowledge.json
          sessions.json   # 会话执行轨迹（任务详情屏用）
      projects/            # Module + Controller + Service：项目、动态流
      tasks/               # 看板、任务详情、状态写入
      work-items/          # 工作项流水线（含 Bug 快轨）
      knowledge/           # L2 文档、L3 知识卡、复盘、复习
      health/              # 健康检查
  web/                     # Vite + React 前端
    index.html
    src/
      main.tsx
      router.tsx
      styles/
        tokens.css         # 设计令牌
        base.css
      layout/
        AppShell.tsx       # 左侧栏 + 顶栏 + 内容区
        Sidebar.tsx
        Topbar.tsx         # 搜索、同步状态
      pages/
        FeedPage.tsx        # 01 首页 · 动态流
        ProjectPage.tsx     # 02 项目详情
        BoardPage.tsx       # 03 任务看板
        ReviewPage.tsx      # 04 移动复习（桌面页内嵌手机框）
        PipelinePage.tsx    # 05 工作项流水线（07 Bug 快轨为同路由变体）
        TaskDetailPage.tsx  # 06 任务详情
        LibraryPage.tsx     # 知识库（简化列表，防侧栏死链）
        TechStackPage.tsx   # 技术栈知识（简化列表）
        RetroPage.tsx       # 复盘报告（简化列表）
      components/
        StatCard.tsx / ProjectCard.tsx / ActivityItem.tsx
        TaskCard.tsx / StageColumn.tsx / ConfirmCard.tsx
        KnowledgeTree.tsx / LBadge.tsx   # L1紫/L2橙/L3绿 层级徽标
```

入库前补 `.gitignore`：`hub/node_modules/`、`hub/dist/`。

## 4. 设计令牌（源自 DESIGN.md §4）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#F7F6F3` | 页面底色（Notion 暖米） |
| `--surface` | `#FFFFFF` | 卡片 |
| `--ink` | `#37352F` | 正文 |
| `--muted` | `#9B988F` | 次级文字 |
| `--border` | `#E8E6DF` | 描边、分割线 |
| `--l1` | `#9B5DE5` | 项目事实层 / 主操作 / 激活态 |
| `--l2` | `#F26430` | 个人理解层 / 待确认状态 |
| `--l3` | `#0F9D58` | 跨项目技术知识 / 完成态 |
| `--bug` | 红系 | 来源标签：Bug 快轨（与状态色正交，见 DESIGN.md §5） |
| 圆角 | 卡片 14、控件 8 | |
| 字体 | `"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif` | 本机系统栈回退，不下载字体 |

布局基准（按 PDF 蓝本）：左侧栏固定 ≈ 280px（工作区分组 + 项目分组 + 底部连接状态卡）；顶栏高 ≈ 64px（搜索框左、同步胶囊 + 通知 + 头像右）；内容区自适应，卡片栅格 4 列（统计）/ 2 列（项目卡）/ 主次分栏（动态流 2/3 + 右侧待复盘 & L3 卡）。

## 5. 数据模型（seed → SQLite）

全部单机示例数据，字段为服务 7 屏展示与最小写交互而设：

| 表 | 服务屏幕 | 关键字段 |
| --- | --- | --- |
| `projects` | 01/02 | id, name, repo, color, stack[], commit_count, l1/l2/l3_count, last_synced_at |
| `activity` | 01 | id, project_id, kind(commit/l1/l2/l3/retro), title, meta, source_label, occurred_at |
| `tasks` | 01/03/06 | id, project_id, title, priority(P0–P3), source(manual/ai/issue), status(planned/todo/doing/review/done), issue_no, flags[](如「已落库 L2」「待你过目」), session_id |
| `work_items` | 05/07 | id, project_id, title, source_type(需求/Bug), stage(1–4), issue_no, session_id, created_at |
| `work_artifacts` | 05/07 | id, work_item_id, stage(1–4), kind(需求说明/规格/方案/复盘草稿/L2/L3/验证结果), title, body, confirm_state(pending/confirmed), is_draft |
| `knowledge_docs` | 01/02 | L2：id, project_id, kind(项目解析/踩坑/ADR/复盘), title, status(草稿/已确认), meta |
| `knowledge_cards` | 01/04 | L3：id, title, summary, hit_projects[], origin_project, mastered, review_state |
| `sessions` | 06 | id, status, queue, elapsed_min, steps[](标题+时间+状态), changes[](文件+增删) |
| `confirmations` | 06 | 人机交接卡：id, ref(task/work_item), question, ai_suggestion, state(pending/accepted/edited) |

**写接口（最小集）**：`PATCH /api/tasks/:id/status`（看板拖拽）、`POST /api/confirmations/:id/accept`（人机交接确认）、`POST /api/knowledge_cards/:id/review`（复习卡 再复习/已掌握）。其余屏只读。

## 6. 屏幕清单与验收要点

| 屏 | 路由 | 核心区块 | 关键交互 | 验收 |
| --- | --- | --- | --- | --- |
| 01 首页·动态流 | `/` | 4 统计卡（接入项目/L2/L3/待复盘）→ 2 项目卡 → 最近动态（左 2/3）+ 待复盘任务 & L3 技术知识卡（右 1/3） | 「去任务看板」「查看全部」跳转；「接入仓库」「生成周报」按钮占位提示 | 与 PDF 第 1 页逐块对照 |
| 02 项目详情 | `/projects/:id` | 面包屑 + 标题行（重新扫描/生成文档）+ 6 Tab（概览/架构图/文档/提交历史/技术栈知识/复盘）→ 知识树（L1/L2/L3 三段）+ 架构图卡（L1 全自动）+ 最近文档（含橙色「AI 起草·待你确认」态）+ 最近提交 | Tab 切换；知识树条目跳文档列表；架构图用静态 SVG 数据流（MES API → Ingestion → raw.mes_* → RQ Worker） | 与 PDF 第 2 页对照；3 项目均可进 |
| 03 任务看板 | `/board` | 顶行（筛选 Tab：全部/我的/交给会话执行/定时任务）+ 5 列（待规划/待办/进行中/待复盘/已完成）+ 紫色主按钮「新建任务」 | 列间拖拽改状态（写 API，刷新保持）；卡片点进 06 | 与 PDF 第 3 页对照；拖拽后刷新状态不丢 |
| 04 移动复习 | `/review` | 桌面页内嵌 390 宽手机框：复习卡（L3 徽标、3/12 进度、再复习/已掌握）+ 项目更新 + 今日复习进度条 + 本周沉淀 + 底部 5 Tab（动态/项目/复习/通知/我的，仅样式） | 「再复习/已掌握」切下一张并写 API；连续天数徽标 | 与 PDF 第 4 页对照 |
| 05 工作项流水线 | `/work-items/:id` | 顶部 4 阶段进度条（01 需求与目标 → 02 设计规格 → 03 执行方案 → 04 完成与沉淀）+ 4 列产物卡（标签 + 标题 + meta）+ 每列底部「新增产物」占位 | 卡片状态态（已确认/待过目橙框）；「沉淀到知识库」按钮占位 | 与 PDF 第 5 页对照 |
| 06 任务详情 | `/tasks/:id` | 左：处理阶段 checklist（5 步 3/5 已推进）+ 会话执行卡（进度条 + 步骤日志 + 暂存区文件列表）+ 人机交接橙框卡（采纳默认建议/我要改一下）；右栏：任务属性/来源与关联/时间线/接下来会发生什么/完成后自动产出 | 「采纳默认建议」→ 确认卡转已确认（写 API）；checklist 随之推进 | 与 PDF 第 6 页对照 |
| 07 Bug 修复快轨 | `/work-items/:id`（`source_type=Bug`） | 同 05 布局，规格列灰化不可编辑；「复现记录即验收」「收口需人工确认」语义标签 | 待人工确认按钮占位 | 按 DESIGN.md §3-07 文字规格 |

侧栏「知识库 / 技术栈知识 / 复盘报告」各给一个简化列表页（读 `knowledge_docs` / `knowledge_cards` / 复盘类 L2），保证零死链；不计入 7 屏验收。

## 7. 分期执行

| 里程碑 | 内容 | 完成标准 |
| --- | --- | --- |
| **M1 骨架** | `hub/` 初始化（NestJS api/ + Vite React web/ 双包结构）、`.gitignore` 补 node_modules/dist、设计令牌、AppShell（侧栏+顶栏+路由占位）、DatabaseService 建表 + seed 装载、健康检查 API | `npm run dev` 双端起得来，空页面带完整侧栏壳 |
| **M2 展示双屏** | 屏 01 动态流、屏 02 项目详情（含 3 项目数据、架构图 SVG、知识树） | 两屏与 PDF 1/2 页对照通过 |
| **M3 任务双屏** | 屏 03 看板（含拖拽写 API）、屏 06 任务详情（含人机交接确认写 API） | 拖拽/确认后刷新状态保持 |
| **M4 流水线** | 屏 05 工作项流水线 + 屏 07 Bug 快轨变体 | 需求/Bug 两工作项分别走通 |
| **M5 复习与补齐** | 屏 04 移动复习（复习写 API）+ 知识库/技术栈/复盘 3 个简化列表页 | 侧栏零死链；复习进度可累计 |
| **M6 收口** | 全屏对照 PDF 终检、`npm run build` + `npm start` 生产模式验证、`flutter analyze` 确认未受影响、README 增补 hub 运行说明 | 7 屏验收表全过 |

依赖关系：M1 → M2/M3 可并行 → M4（依赖 M3 的任务态）→ M5 → M6。

## 8. 验证方式

1. **逐屏对照**：把 `项目知识中枢 · Web App.pdf` 渲染为图片，与浏览器截图并排比对（区块结构、层级色、状态语义）。
2. **写路径**：看板拖拽 → 刷新页面状态保留；采纳确认 → 橙框卡转已确认；复习卡计数递增。
3. **构建**：`npm run build` 零 TS 错误；`npm start` 单端口可访问。
4. **不伤主线**：`flutter analyze` 仍为 No issues found（hub/ 不在 Flutter 分析范围）。
5. **数据语义抽查**：L1 紫 / L2 橙 / L3 绿三色与「来源标签（紫=需求/红=Bug）」「状态色（橙=待确认/绿=完成）」两套语言不混用（DESIGN.md §5）。

## 9. 后续留口（本期不做，但结构上不堵死）

- API 形状对齐 AUTOMATION.md 三期：`/api/sync`（GitHub 拉取）、`/api/generate`（AI 起草 L2）预留路由占位即可。
- seed JSON 的字段与将来真实采集字段同名（如 `repo`、`last_synced_at`、`issue_no`），降低迁移成本。
- DSH 插件路线（规划.txt 路线 C）不阻塞：本应用作为「独立 Web 主体」，将来通过 API/文件与 DSH 互通。
