// ============================================================
// Orbit Hub MCP 协议核心：工具定义与 JSON-RPC 分发。
// 与传输层无关，被两个入口共享：
//   - mcp/server.mts（stdio 传输，供本地 Agent 拉起）
//   - app/api/mcp/route.ts（Streamable HTTP 传输，走 Next.js 服务）
// 工具说明见 mcp/README.md。
// ============================================================

import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import {
  addAgentActivity,
  getBoardTasks,
  addAgentKnowledgeCard,
  addAgentKnowledgeDoc,
  createAgentTask,
  getKnowledgeCards,
  getKnowledgeDocs,
  getProject,
  getProjects,
  getRecentActivity,
  getTask,
  getWorkArtifacts,
  getWorkItem,
  getWorkItems,
  getWorkspaceStats,
  updateProjectGitData,
  updateTaskStatus,
  type ActivityKind,
  type BoardFilter,
  type TaskHandler,
  type TaskStatus,
} from '../lib/db.ts';

import { listGithubBranches, listGithubCommits } from '../lib/github-api.ts';

// region 工具定义

interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

const TASK_STATUSES: TaskStatus[] = ['planned', 'todo', 'doing', 'review', 'done'];
const ACTIVITY_KINDS: ActivityKind[] = ['commit', 'l1', 'l2', 'l3', 'retro', 'bug'];
const HANDLERS: TaskHandler[] = ['me', 'session', 'cron'];
const BOARD_FILTERS: BoardFilter[] = ['all', 'mine', 'session', 'cron'];

function str(args: Record<string, unknown>, key: string, required = true): string {
  const value = args[key];
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  if (!required) {
    return '';
  }
  throw new Error(`参数「${key}」必须是非空字符串`);
}

function optStr(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function optNumber(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optBool(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  return typeof value === 'boolean' ? value : undefined;
}

function oneOf<T extends string>(args: Record<string, unknown>, key: string, allowed: T[]): T | undefined {
  const value = optStr(args, key) as T | undefined;
  if (value !== undefined && !allowed.includes(value)) {
    throw new Error(`参数「${key}」必须是 ${allowed.join(' / ')} 之一`);
  }
  return value;
}

const TOOLS: ToolSpec[] = [
  {
    name: 'list_projects',
    description: '列出中枢已接入的全部项目（名称、仓库、技术栈、提交/分支/知识计数）。分析前先调它拿 project_id。',
    inputSchema: { type: 'object', properties: {} },
    handler: () => getProjects(),
  },
  {
    name: 'get_project',
    description: '读取单个项目详情，含最近提交历史（hash/信息/作者/时间/链接）与架构节点。',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: { project_id: { type: 'string', description: '项目 ID（list_projects 返回）' } },
    },
    handler: (args) => {
      const project = getProject(str(args, 'project_id'));
      if (!project) {
        throw new Error(`项目「${str(args, 'project_id')}」不存在`);
      }
      return project;
    },
  },
  {
    name: 'list_activity',
    description: '按时间倒序读取动态流（提交 / L1~L3 知识 / 复盘 / Bug），limit 默认 50。',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: '最多返回条数，默认 50' } },
    },
    handler: (args) => getRecentActivity(optNumber(args, 'limit') ?? 50),
  },
  {
    name: 'list_tasks',
    description: '读取看板任务；filter 可选 all（默认）/ mine（我负责）/ session（MCP 执行）/ cron（定时执行）。',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: BOARD_FILTERS, description: '看板筛选，默认 all' },
      },
    },
    handler: (args) => {
      const filter = oneOf(args, 'filter', BOARD_FILTERS) ?? 'all';
      return getBoardTasks(filter);
    },
  },
  {
    name: 'get_task',
    description: '读取单个任务详情（优先级、来源、flags、checklist、timeline）。',
    inputSchema: {
      type: 'object',
      required: ['task_id'],
      properties: { task_id: { type: 'string', description: '任务 ID' } },
    },
    handler: (args) => {
      const task = getTask(str(args, 'task_id'));
      if (!task) {
        throw new Error(`任务「${str(args, 'task_id')}」不存在`);
      }
      return task;
    },
  },
  {
    name: 'get_workspace_stats',
    description: '工作区统计：接入项目数、L2/L3 知识总数、待复盘任务数。',
    inputSchema: { type: 'object', properties: {} },
    handler: () => getWorkspaceStats(),
  },
  {
    name: 'list_knowledge_docs',
    description: '读取 L2 知识文档，可按 project_id / kind 过滤。',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: '按项目过滤' },
        kind: { type: 'string', description: '按知识类型过滤' },
      },
    },
    handler: (args) => getKnowledgeDocs({
      projectId: optStr(args, 'project_id'),
      kind: optStr(args, 'kind'),
    }),
  },
  {
    name: 'list_knowledge_cards',
    description: '读取 L3 知识卡，可只看 due_today 或按命中项目过滤。',
    inputSchema: {
      type: 'object',
      properties: {
        due_today: { type: 'boolean', description: '只看今日待复习' },
        hit_project: { type: 'string', description: '按命中项目过滤' },
      },
    },
    handler: (args) => getKnowledgeCards({
      dueToday: optBool(args, 'due_today'),
      hitProject: optStr(args, 'hit_project'),
    }),
  },
  {
    name: 'list_work_items',
    description: '读取工作项流水线（需求 / Bug 及其阶段）。',
    inputSchema: { type: 'object', properties: {} },
    handler: () => getWorkItems(),
  },
  {
    name: 'get_work_item',
    description: '读取单个工作项及其全部产物（artifacts：文档 / 方案 / 确认卡）。',
    inputSchema: {
      type: 'object',
      required: ['work_item_id'],
      properties: { work_item_id: { type: 'string', description: '工作项 ID' } },
    },
    handler: (args) => {
      const workItemId = str(args, 'work_item_id');
      const item = getWorkItem(workItemId);
      if (!item) {
        throw new Error(`工作项「${workItemId}」不存在`);
      }
      return { ...item, artifacts: getWorkArtifacts(workItemId) };
    },
  },
  {
    name: 'sync_project',
    description: '从 GitHub 同步一个项目的最新提交历史与分支到中枢（分析前建议先同步拿最新数据）。',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: { project_id: { type: 'string', description: '项目 ID' } },
    },
    handler: async (args) => {
      const projectId = str(args, 'project_id');
      const project = getProject(projectId);
      if (!project) {
        throw new Error(`项目「${projectId}」不存在`);
      }
      const [commits, branches] = await Promise.all([
        listGithubCommits(project.repo),
        listGithubBranches(project.repo),
      ]);
      updateProjectGitData(projectId, {
        commits: commits.map((commit) => ({
          hash: commit.hash,
          message: commit.message,
          branch: '',
          at: commit.at,
          author: commit.author,
          url: commit.url,
        })),
        branchCount: branches.length,
      });
      return { synced: true, project: project.name, commitCount: commits.length, branchCount: branches.length };
    },
  },
  {
    name: 'create_task',
    description:
      '把你的分析结论落成一条 AI 任务（source=ai），出现在中枢看板。可选给 checklist 拆步骤，第一步自动进入进行中。',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'title'],
      properties: {
        project_id: { type: 'string', description: '所属项目 ID' },
        title: { type: 'string', description: '任务标题（建议带明确动作，如「拆分 db.ts 查询层」）' },
        priority: { type: 'number', enum: [1, 2, 3], description: '优先级 1 高 / 2 中 / 3 低，默认 1' },
        handler: { type: 'string', enum: HANDLERS, description: '处理人：me 人 / session MCP 执行 / cron 定时，默认 me' },
        meta: { type: 'string', description: '一句话说明（AI 的分析依据）' },
        checklist: {
          type: 'array',
          description: '可选，执行步骤列表',
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              title: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
    handler: (args) => {
      const checklist = Array.isArray(args.checklist)
        ? (args.checklist as Record<string, unknown>[]).map((step) => ({
            title: String(step.title ?? ''),
            note: typeof step.note === 'string' ? step.note : '',
          })).filter((step) => step.title !== '')
        : undefined;
      return createAgentTask({
        projectId: str(args, 'project_id'),
        title: str(args, 'title'),
        priority: optNumber(args, 'priority'),
        handler: oneOf(args, 'handler', HANDLERS),
        meta: optStr(args, 'meta'),
        checklist: checklist?.length ? checklist : undefined,
      });
    },
  },
  {
    name: 'update_task_status',
    description: '更新任务状态：planned / todo / doing / review / done。',
    inputSchema: {
      type: 'object',
      required: ['task_id', 'status'],
      properties: {
        task_id: { type: 'string', description: '任务 ID' },
        status: { type: 'string', enum: TASK_STATUSES, description: '目标状态' },
      },
    },
    handler: (args) => {
      const status = oneOf(args, 'status', TASK_STATUSES);
      if (!status) {
        throw new Error('参数「status」必须是非空字符串');
      }
      const taskId = str(args, 'task_id');
      if (!getTask(taskId)) {
        throw new Error(`任务「${taskId}」不存在`);
      }
      updateTaskStatus(taskId, status);
      return { updated: true };
    },
  },
  {
    name: 'add_activity',
    description:
      '往动态流写一条记录，用于归档你的分析结论：retro 复盘 / bug 缺陷发现 / l1~l3 知识整理。limit 常配合 list_activity 查重。',
    inputSchema: {
      type: 'object',
      required: ['kind', 'title'],
      properties: {
        project_id: { type: 'string', description: '可选，关联项目 ID；不传为全局动态' },
        kind: { type: 'string', enum: ACTIVITY_KINDS, description: '动态类型' },
        title: { type: 'string', description: '一句话结论' },
        meta: { type: 'string', description: '补充说明' },
        source_label: { type: 'string', description: '来源标签，默认「AI 分析」' },
        href: { type: 'string', description: '可选跳转链接' },
      },
    },
    handler: (args) => {
      const kind = oneOf(args, 'kind', ACTIVITY_KINDS);
      if (!kind) {
        throw new Error('参数「kind」必须是非空字符串');
      }
      return addAgentActivity({
        projectId: optStr(args, 'project_id') ?? null,
        kind,
        title: str(args, 'title'),
        meta: optStr(args, 'meta') ?? '',
        sourceLabel: optStr(args, 'source_label') ?? 'AI 分析',
        href: optStr(args, 'href') ?? null,
      });
    },
  },
  {
    name: 'save_knowledge_doc',
    description: '把整理出的项目知识沉淀为 L2 知识文档（默认草稿，等人在中枢确认）。',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'kind', 'title', 'meta'],
      properties: {
        project_id: { type: 'string', description: '所属项目 ID' },
        kind: { type: 'string', description: '知识类型（如 架构决策 / 技术栈知识 / 复盘摘要）' },
        title: { type: 'string', description: '知识标题' },
        meta: { type: 'string', description: '知识正文摘要' },
      },
    },
    handler: (args) => addAgentKnowledgeDoc({
      projectId: str(args, 'project_id'),
      kind: str(args, 'kind'),
      title: str(args, 'title'),
      meta: str(args, 'meta'),
    }),
  },
  {
    name: 'save_knowledge_card',
    description: '把跨项目可复用的知识提炼为 L3 复习卡，自动进入今日复习队列。',
    inputSchema: {
      type: 'object',
      required: ['title', 'summary', 'hit_projects'],
      properties: {
        title: { type: 'string', description: '知识点标题' },
        summary: { type: 'string', description: '知识点正文' },
        hit_projects: { type: 'array', items: { type: 'string' }, description: '命中的项目 ID 列表' },
        kind: { type: 'string', description: '知识类型，默认「技术栈知识」' },
        origin_project: { type: 'string', description: '可选，最初产出的项目 ID' },
      },
    },
    handler: (args) => {
      const hitProjects = Array.isArray(args.hit_projects)
        ? (args.hit_projects as unknown[]).map(String)
        : [];
      return addAgentKnowledgeCard({
        title: str(args, 'title'),
        summary: str(args, 'summary'),
        hitProjects,
        kind: optStr(args, 'kind'),
        originProject: optStr(args, 'origin_project') ?? null,
      });
    },
  },
];

// endregion

// region JSON-RPC 分发（传输无关）

export const SERVER_INFO = { name: 'orbit-hub', version: '0.1.0' };
export const PROTOCOL_VERSION = '2025-06-18';

export interface JsonRpcRequest {
  jsonrpc: string;
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

function toolDefinitions() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

/** 分发一条 JSON-RPC 方法；抛出的错误由传输层包装成 error 响应。 */
export async function dispatch(method: string, params: Record<string, unknown>): Promise<unknown> {
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: toolDefinitions() };
    case 'tools/call': {
      const name = typeof params.name === 'string' ? params.name : '';
      const tool = TOOLS.find((item) => item.name === name);
      if (!tool) {
        throw new Error(`未知工具「${name}」`);
      }
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      try {
        const data = await tool.handler(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: false,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: message }], isError: true };
      }
    }
    default:
      throw Object.assign(new Error(`方法不存在：${method}`), { code: -32601 });
  }
}

// endregion
