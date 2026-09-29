# Orbit Hub MCP Server

把中枢已接入的项目数据通过 [MCP](https://modelcontextprotocol.io)（Model Context Protocol）暴露给外部 Agent（ZCode / Claude Desktop / Cursor 等），让「原来 App 内置的 AI 功能」——任务建议、知识整理（L2/L3）、复盘归档——全部由外部 Agent 完成并写回中枢。

提供两种传输，工具完全一致（定义共享在 `mcp/core.mts`）：

| 传输 | 端点/入口 | 适用 |
| --- | --- | --- |
| **Streamable HTTP（推荐）** | `http://localhost:3000/api/mcp` | 中枢 dev 服务在线时；配置就是一个 URL，没有进程拉起问题，同一服务多客户端共享 |
| stdio | `mcp/start.cmd`（本地进程） | 服务未启动、或 Agent 需要独立进程时 |

## HTTP（推荐）

中枢的 Next.js 服务本身就是常驻进程，MCP 端点直接挂在它上面：

```bash
cd web/hub && npm run dev    # 已在跑则无需动，路由会热加载
```

### 接入配置

ZCode / Claude Code（项目级 `.mcp.json`）：

```json
{
  "mcpServers": {
    "orbit-hub": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

Claude Desktop / Cursor 用对应的 HTTP/MCP URL 配置填同一个地址即可。若在 `.env.local` 配了 `MCP_TOKEN`，请求需带头 `Authorization: Bearer <MCP_TOKEN>`（客户端的 headers 配置里加）。

### 注意

- 端点是无状态 Streamable HTTP（POST JSON-RPC → JSON 响应），不开 SSE 通道；`GET` 返回 405 是预期行为。
- 不想暴露给局域网/外网时不要配端口转发；配了 `MCP_TOKEN` 后才能安全地开放。

## stdio（备选）

```bash
cd web/hub
npm run mcp        # 等价于 node mcp/server.mts（零第三方依赖）
```

要求 Node ≥ 23.6（原生 TypeScript 类型剥离）。服务与 Next.js 应用共享 `web/hub/.data/hub.sqlite`；服务启动时会自动切换到 hub 根目录，客户端不配 cwd 也能找到数据库。

Windows 上不少 MCP 客户端直接 `spawn node` 会报 `spawn node ENOENT`（客户端进程拿不到 node 的 PATH，或不含 .exe 后缀解析失败）。**统一走 `mcp/start.cmd` 启动器**：它内部会 `cd` 到 hub 根目录并调用 node，任何客户端都能可靠拉起。

ZCode / Claude Code（项目级 `.mcp.json`，在仓库根目录）：

```json
{
  "mcpServers": {
    "orbit-hub": {
      "command": "cmd",
      "args": ["/c", "G:\\workspace\\my-project\\flutter\\orbit\\web\\hub\\mcp\\start.cmd"]
    }
  }
}
```

备选：直接用 node 绝对路径（用 `where node` 查安装位置）：

```json
{
  "mcpServers": {
    "orbit-hub": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["G:\\workspace\\my-project\\flutter\\orbit\\web\\hub\\mcp\\server.mts"]
    }
  }
}
```

## 共用说明

`sync_project` 工具需要 GitHub 凭证：在 `web/hub/.env.local` 配置 `GITHUB_TOKEN`（HTTP 与 stdio 共用）。

## 工具清单

### 读（Agent 分析的数据源）

| 工具 | 说明 |
| --- | --- |
| `list_projects` | 已接入项目列表（拿 `project_id`） |
| `get_project` | 项目详情，含提交历史、架构节点 |
| `list_activity` | 动态流（提交 / L1~L3 / 复盘 / Bug） |
| `list_tasks` / `get_task` | 看板任务，支持 mine / session / cron 筛选 |
| `get_workspace_stats` | 项目数、L2/L3 数、待复盘数 |
| `list_knowledge_docs` / `list_knowledge_cards` | L2 知识文档、L3 复习卡 |
| `list_work_items` / `get_work_item` | 工作项流水线及其产物 |
| `sync_project` | 从 GitHub 同步最新提交与分支到中枢 |

### 写（Agent 分析结论的回写，对应原 App 内置 AI 功能）

| 工具 | 对应原功能 | 落点 |
| --- | --- | --- |
| `create_task` | AI 任务建议 | 看板任务（`source=ai`，带「AI 生成」标签，可选 checklist） |
| `update_task_status` | 任务流转 | 看板列移动 |
| `add_activity` | 复盘 / Bug 归档 | 动态流（retro / bug / l1~l3） |
| `save_knowledge_doc` | L2 知识整理 | 知识文档（草稿，等人在中枢确认） |
| `save_knowledge_card` | L3 知识提炼 | 复习卡（自动进今日复习队列） |

## 典型用法

让外部 Agent「分析某个项目的近期开发情况并给出建议」：

1. `list_projects` → 拿 `project_id`
2. `sync_project` → 拉最新提交（需 GITHUB_TOKEN）
3. `get_project` → 读提交历史
4. `add_activity`（retro）→ 写复盘结论
5. `create_task` → 把改进建议落成看板任务
6. `save_knowledge_card` → 把可复用经验提炼成 L3 复习卡
