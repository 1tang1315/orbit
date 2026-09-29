import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ============================================================
// 数据层：node:sqlite 连接单例、建表与查询。
// 所有 snake_case 列 → camelCase 字段的映射集中在此文件；
// 业务代码只拿 UI 模型，不接触原始行（开发规范 01 §1.5）。
// 项目数据一律来自 GitHub 导入与同步，不再装载示例 seed。
// ============================================================

// region UI 模型（跨业务域共享，放 lib 层）

export type ActivityKind = 'commit' | 'l1' | 'l2' | 'l3' | 'retro' | 'bug';
export type TaskStatus = 'planned' | 'todo' | 'doing' | 'review' | 'done';
export type TaskHandler = 'me' | 'session' | 'cron';
export type FlagTone = 'warn' | 'ok' | 'accent';
export type ArtifactTone = 'muted' | 'ok' | 'pending';
export type StageTone = 'done' | 'current' | 'pending';
export type ConfirmationState = 'pending' | 'accepted' | 'edited';

export interface ArchNode {
  name: string;
  sub: string;
}

export interface CommitItem {
  hash: string;
  message: string;
  /** 所属分支（seed 数据有值；GitHub commits API 不返回分支，同步数据为空）。 */
  branch?: string;
  at: string;
  /** 提交作者（GitHub 同步数据才有，seed 数据可为空）。 */
  author?: string;
  /** GitHub 提交详情页链接（同步数据才有）。 */
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  repo: string;
  color: string;
  stack: string[];
  arch: ArchNode[];
  commits: CommitItem[];
  commitCount: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  depsCount: number;
  branchCount: number;
  lastSyncedAt: string;
}

export interface Activity {
  id: string;
  projectId: string | null;
  kind: ActivityKind;
  title: string;
  meta: string;
  sourceLabel: string;
  occurredAt: string;
  href: string | null;
}

export interface TaskFlag {
  text: string;
  tone: FlagTone;
}

export interface ChecklistStep {
  title: string;
  state: 'done' | 'current' | 'todo';
  note: string;
}

export interface TimelineItem {
  label: string;
  time: string;
  tone: 'current' | 'plain';
}

export interface Task {
  id: string;
  seq: number;
  projectId: string;
  title: string;
  priority: number;
  source: 'manual' | 'ai' | 'issue';
  status: TaskStatus;
  issueNo: number | null;
  flags: TaskFlag[];
  sessionId: string | null;
  workItemId: string | null;
  handler: TaskHandler;
  meta: string;
  inReviewQueue: boolean;
  owned: boolean;
  checklist: ChecklistStep[] | null;
  timeline: TimelineItem[] | null;
  createdAt: string;
}

export interface StageMeta {
  no: number;
  title: string;
  note: string;
  tone: StageTone;
}

export interface WorkItem {
  id: string;
  seq: number;
  projectId: string;
  title: string;
  sourceType: '需求' | 'Bug';
  stage: number;
  issueNo: number | null;
  sessionNo: number | null;
  owner: string;
  createdAt: string;
  stages: StageMeta[];
}

export interface WorkArtifact {
  id: string;
  workItemId: string;
  stage: number;
  kind: string;
  title: string;
  meta: string;
  tagTone: ArtifactTone;
  highlight: boolean;
  showActions: boolean;
  confirmState: 'pending' | 'confirmed';
}

export interface KnowledgeDoc {
  id: string;
  projectId: string;
  kind: string;
  title: string;
  status: '已确认' | '草稿';
  meta: string;
  createdAt: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  summary: string;
  hitProjects: string[];
  originProject: string | null;
  kind: string;
  mastered: boolean;
  reviewState: 'pending' | 'mastered' | 'again';
  dueToday: boolean;
  sortOrder: number;
}

export interface SessionStep {
  title: string;
  time: string;
  state: 'done' | 'current';
}

export interface FileChange {
  path: string;
  diff: string;
  tone: 'add' | 'plain' | 'warn';
}

export interface Session {
  id: string;
  no: number;
  taskId: string | null;
  status: string;
  queue: string;
  elapsedMin: number;
  steps: SessionStep[];
  changes: FileChange[];
}

export interface Confirmation {
  id: string;
  refType: 'task' | 'work_item';
  refId: string;
  question: string;
  body: string;
  state: ConfirmationState;
}

export interface WorkspaceStats {
  projectCount: number;
  l2Total: number;
  l3Total: number;
  reviewPending: number;
}

// endregion

// region 连接与建表

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'hub.sqlite');

interface DbHolder {
  __hubDb?: DatabaseSync;
}

const holder = globalThis as typeof globalThis & DbHolder;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  color TEXT NOT NULL,
  stack TEXT NOT NULL,
  arch TEXT NOT NULL,
  commits TEXT NOT NULL,
  commit_count INTEGER NOT NULL DEFAULT 0,
  l1_count INTEGER NOT NULL DEFAULT 0,
  l2_count INTEGER NOT NULL DEFAULT 0,
  l3_count INTEGER NOT NULL DEFAULT 0,
  deps_count INTEGER NOT NULL DEFAULT 0,
  branch_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  href TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  seq INTEGER NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'todo',
  issue_no INTEGER,
  flags TEXT NOT NULL DEFAULT '[]',
  session_id TEXT,
  work_item_id TEXT,
  handler TEXT NOT NULL DEFAULT 'me',
  meta TEXT NOT NULL DEFAULT '',
  in_review_queue INTEGER NOT NULL DEFAULT 0,
  owned INTEGER NOT NULL DEFAULT 0,
  checklist TEXT,
  timeline TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  seq INTEGER NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1,
  issue_no INTEGER,
  session_no INTEGER,
  owner TEXT NOT NULL DEFAULT '你',
  created_at TEXT NOT NULL,
  stages TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS work_artifacts (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL,
  stage INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  tag_tone TEXT NOT NULL DEFAULT 'muted',
  highlight INTEGER NOT NULL DEFAULT 0,
  show_actions INTEGER NOT NULL DEFAULT 0,
  confirm_state TEXT NOT NULL DEFAULT 'confirmed'
);

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '已确认',
  meta TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  hit_projects TEXT NOT NULL DEFAULT '[]',
  origin_project TEXT,
  kind TEXT NOT NULL DEFAULT '技术栈知识',
  mastered INTEGER NOT NULL DEFAULT 0,
  review_state TEXT NOT NULL DEFAULT 'pending',
  due_today INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  no INTEGER NOT NULL,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT '执行中',
  queue TEXT NOT NULL DEFAULT '',
  elapsed_min INTEGER NOT NULL DEFAULT 0,
  steps TEXT NOT NULL DEFAULT '[]',
  changes TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS confirmations (
  id TEXT PRIMARY KEY,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  question TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_activity_time ON activity (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status, in_review_queue);
CREATE INDEX IF NOT EXISTS idx_artifacts_item ON work_artifacts (work_item_id, stage, sort_order);
CREATE INDEX IF NOT EXISTS idx_docs_project ON knowledge_docs (project_id, kind);
CREATE INDEX IF NOT EXISTS idx_cards_due ON knowledge_cards (due_today, sort_order);
`;

function getDb(): DatabaseSync {
  if (holder.__hubDb) {
    return holder.__hubDb;
  }
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  holder.__hubDb = db;
  return db;
}

// endregion

// region 行映射（snake_case → camelCase）

interface Row {
  [column: string]: unknown;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value === '') {
    return fallback;
  }
  return JSON.parse(value) as T;
}

function toProject(row: Row): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    repo: String(row.repo),
    color: String(row.color),
    stack: parseJson<string[]>(row.stack, []),
    arch: parseJson<ArchNode[]>(row.arch, []),
    commits: parseJson<CommitItem[]>(row.commits, []),
    commitCount: Number(row.commit_count),
    l1Count: Number(row.l1_count),
    l2Count: Number(row.l2_count),
    l3Count: Number(row.l3_count),
    depsCount: Number(row.deps_count),
    branchCount: Number(row.branch_count),
    lastSyncedAt: String(row.last_synced_at),
  };
}

function toActivity(row: Row): Activity {
  return {
    id: String(row.id),
    projectId: row.project_id === null ? null : String(row.project_id),
    kind: row.kind as ActivityKind,
    title: String(row.title),
    meta: String(row.meta),
    sourceLabel: String(row.source_label),
    occurredAt: String(row.occurred_at),
    href: row.href === null ? null : String(row.href),
  };
}

function toTask(row: Row): Task {
  return {
    id: String(row.id),
    seq: Number(row.seq),
    projectId: String(row.project_id),
    title: String(row.title),
    priority: Number(row.priority),
    source: row.source as Task['source'],
    status: row.status as TaskStatus,
    issueNo: row.issue_no === null ? null : Number(row.issue_no),
    flags: parseJson<TaskFlag[]>(row.flags, []),
    sessionId: row.session_id === null ? null : String(row.session_id),
    workItemId: row.work_item_id === null ? null : String(row.work_item_id),
    handler: row.handler as TaskHandler,
    meta: String(row.meta),
    inReviewQueue: Number(row.in_review_queue) === 1,
    owned: Number(row.owned) === 1,
    checklist: row.checklist === null ? null : parseJson<ChecklistStep[] | null>(row.checklist, null),
    timeline: row.timeline === null ? null : parseJson<TimelineItem[] | null>(row.timeline, null),
    createdAt: String(row.created_at),
  };
}

function toWorkItem(row: Row): WorkItem {
  return {
    id: String(row.id),
    seq: Number(row.seq),
    projectId: String(row.project_id),
    title: String(row.title),
    sourceType: row.source_type as WorkItem['sourceType'],
    stage: Number(row.stage),
    issueNo: row.issue_no === null ? null : Number(row.issue_no),
    sessionNo: row.session_no === null ? null : Number(row.session_no),
    owner: String(row.owner),
    createdAt: String(row.created_at),
    stages: parseJson<StageMeta[]>(row.stages, []),
  };
}

function toArtifact(row: Row): WorkArtifact {
  return {
    id: String(row.id),
    workItemId: String(row.work_item_id),
    stage: Number(row.stage),
    kind: String(row.kind),
    title: String(row.title),
    meta: String(row.meta),
    tagTone: row.tag_tone as ArtifactTone,
    highlight: Number(row.highlight) === 1,
    showActions: Number(row.show_actions) === 1,
    confirmState: row.confirm_state as WorkArtifact['confirmState'],
  };
}

function toDoc(row: Row): KnowledgeDoc {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    kind: String(row.kind),
    title: String(row.title),
    status: row.status as KnowledgeDoc['status'],
    meta: String(row.meta),
    createdAt: String(row.created_at),
  };
}

function toCard(row: Row): KnowledgeCard {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    hitProjects: parseJson<string[]>(row.hit_projects, []),
    originProject: row.origin_project === null ? null : String(row.origin_project),
    kind: String(row.kind),
    mastered: Number(row.mastered) === 1,
    reviewState: row.review_state as KnowledgeCard['reviewState'],
    dueToday: Number(row.due_today) === 1,
    sortOrder: Number(row.sort_order),
  };
}

function toSession(row: Row): Session {
  return {
    id: String(row.id),
    no: Number(row.no),
    taskId: row.task_id === null ? null : String(row.task_id),
    status: String(row.status),
    queue: String(row.queue),
    elapsedMin: Number(row.elapsed_min),
    steps: parseJson<SessionStep[]>(row.steps, []),
    changes: parseJson<FileChange[]>(row.changes, []),
  };
}

function toConfirmation(row: Row): Confirmation {
  return {
    id: String(row.id),
    refType: row.ref_type as Confirmation['refType'],
    refId: String(row.ref_id),
    question: String(row.question),
    body: String(row.body),
    state: row.state as ConfirmationState,
  };
}

// endregion

// region 查询

/** 全部接入项目，按最近同步倒序。 */
export function getProjects(): Project[] {
  const rows = getDb().prepare('SELECT * FROM projects ORDER BY last_synced_at DESC').all() as Row[];
  return rows.map(toProject);
}

export function getProject(id: string): Project | null {
  const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined;
  return row ? toProject(row) : null;
}

/** 已接入项目的 GitHub 仓库全名集合（owner/repo），用于仓库列表标记「已导入」。 */
export function getProjectRepos(): string[] {
  const rows = getDb().prepare('SELECT repo FROM projects').all() as { repo: string }[];
  return rows.map((row) => row.repo);
}

/** 工作区四张统计卡：接入项目 / L2 / L3 / 待复盘。 */
export function getWorkspaceStats(): WorkspaceStats {
  const db = getDb();
  const projects = (db.prepare('SELECT COUNT(*) AS n FROM projects').get() as { n: number }).n;
  const l2 = (db.prepare('SELECT COUNT(*) AS n FROM knowledge_docs').get() as { n: number }).n;
  const l3 = (db.prepare('SELECT COUNT(*) AS n FROM knowledge_cards').get() as { n: number }).n;
  const review = (db.prepare(
    "SELECT COUNT(*) AS n FROM tasks WHERE status = 'review' AND in_review_queue = 1",
  ).get() as { n: number }).n;
  return { projectCount: projects, l2Total: l2, l3Total: l3, reviewPending: review };
}

export function getRecentActivity(limit: number): Activity[] {
  const rows = getDb()
    .prepare('SELECT * FROM activity ORDER BY occurred_at DESC LIMIT ?')
    .all(limit) as Row[];
  return rows.map(toActivity);
}

export type BoardFilter = 'all' | 'mine' | 'session' | 'cron';

/** 看板任务；filter 对应顶部筛选 Tab。 */
export function getBoardTasks(filter: BoardFilter = 'all'): Task[] {
  const db = getDb();
  let sql = 'SELECT * FROM tasks WHERE 1 = 1';
  if (filter === 'mine') {
    sql += ' AND owned = 1';
  } else if (filter === 'session') {
    sql += " AND handler = 'session'";
  } else if (filter === 'cron') {
    sql += " AND handler = 'cron'";
  }
  sql += ' ORDER BY seq ASC';
  const rows = db.prepare(sql).all() as Row[];
  return rows.map(toTask);
}

/** 待复盘任务队列（首页右栏）。 */
export function getReviewQueueTasks(): Task[] {
  const rows = getDb()
    .prepare("SELECT * FROM tasks WHERE in_review_queue = 1 ORDER BY priority ASC, seq ASC")
    .all() as Row[];
  return rows.map(toTask);
}

export function getTask(id: string): Task | null {
  const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Row | undefined;
  return row ? toTask(row) : null;
}

export function getWorkItem(id: string): WorkItem | null {
  const row = getDb().prepare('SELECT * FROM work_items WHERE id = ?').get(id) as Row | undefined;
  return row ? toWorkItem(row) : null;
}

export function getWorkItems(): WorkItem[] {
  const rows = getDb().prepare('SELECT * FROM work_items ORDER BY seq DESC').all() as Row[];
  return rows.map(toWorkItem);
}

export function getWorkArtifacts(workItemId: string): WorkArtifact[] {
  const rows = getDb()
    .prepare('SELECT * FROM work_artifacts WHERE work_item_id = ? ORDER BY stage ASC, sort_order ASC')
    .all(workItemId) as Row[];
  return rows.map(toArtifact);
}

export interface DocQuery {
  projectId?: string;
  kind?: string;
}

export function getKnowledgeDocs(query: DocQuery = {}): KnowledgeDoc[] {
  const db = getDb();
  let sql = 'SELECT * FROM knowledge_docs WHERE 1 = 1';
  const params: string[] = [];
  if (query.projectId) {
    sql += ' AND project_id = ?';
    params.push(query.projectId);
  }
  if (query.kind) {
    sql += ' AND kind = ?';
    params.push(query.kind);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params) as Row[];
  return rows.map(toDoc);
}

export interface CardQuery {
  dueToday?: boolean;
  hitProject?: string;
}

export function getKnowledgeCards(query: CardQuery = {}): KnowledgeCard[] {
  const db = getDb();
  let sql = 'SELECT * FROM knowledge_cards WHERE 1 = 1';
  const params: string[] = [];
  if (query.dueToday !== undefined) {
    sql += ' AND due_today = ?';
    params.push(query.dueToday ? '1' : '0');
  }
  sql += ' ORDER BY sort_order ASC';
  const rows = db.prepare(sql).all(...params) as Row[];
  const cards = rows.map(toCard);
  return query.hitProject
    ? cards.filter((card) => card.hitProjects.includes(query.hitProject as string))
    : cards;
}

export function getSessionByTask(taskId: string): Session | null {
  const row = getDb()
    .prepare('SELECT * FROM sessions WHERE task_id = ? ORDER BY no DESC LIMIT 1')
    .get(taskId) as Row | undefined;
  return row ? toSession(row) : null;
}

/** 执行中的会话数（看板副标题）。 */
export function getRunningSessionCount(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM sessions WHERE status = '执行中'")
    .get() as { n: number };
  return row.n;
}

export function getConfirmation(refType: 'task' | 'work_item', refId: string): Confirmation | null {
  const row = getDb()
    .prepare('SELECT * FROM confirmations WHERE ref_type = ? AND ref_id = ?')
    .get(refType, refId) as Row | undefined;
  return row ? toConfirmation(row) : null;
}

/** 最近一次同步时间（顶栏同步胶囊）。 */
export function getLatestSyncAt(): string {
  const row = getDb()
    .prepare('SELECT last_synced_at FROM projects ORDER BY last_synced_at DESC LIMIT 1')
    .get() as { last_synced_at: string } | undefined;
  return row?.last_synced_at ?? new Date().toISOString();
}

// endregion

// region 写操作（Server Actions 的落库入口）

/** 从 GitHub 导入项目所需的最低字段；其余列落默认值，等后续同步补齐。 */
export interface GithubProjectDraft {
  name: string;
  repo: string;
  color: string;
  stack: string[];
}

/**
 * 按 GitHub 仓库全名导入一个项目：id 取「owner-repo」slug，仓库唯一。
 *
 * 已存在同 repo 的项目时不动任何数据，返回 'exists' 由调用方提示；
 * commits / arch / 各计数先置空，待真实仓库扫描（/api/sync）回填。
 */
export function createGithubProject(draft: GithubProjectDraft): 'created' | 'exists' {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM projects WHERE repo = ?').get(draft.repo) as
    | { id: string }
    | undefined;
  if (existing) {
    return 'exists';
  }
  const id = draft.repo.toLowerCase().replace('/', '-');
  db.prepare(
    `INSERT INTO projects (
      id, name, repo, color, stack, arch, commits,
      commit_count, l1_count, l2_count, l3_count, deps_count, branch_count, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, '[]', '[]', 0, 0, 0, 0, 0, 0, ?)`,
  ).run(
    id,
    draft.name,
    draft.repo,
    draft.color,
    JSON.stringify(draft.stack),
    new Date().toISOString(),
  );
  return 'created';
}

/**
 * 用 GitHub 同步到的真实提交与分支数据回填一个项目。
 *
 * commit_count 记录的是已拉取的提交条数（与 commits 列一致），
 * 分支数量来自 branches API；last_synced_at 刷新为当前时间。
 */
export function updateProjectGitData(
  id: string,
  data: { commits: CommitItem[]; branchCount: number },
): void {
  getDb()
    .prepare(
      `UPDATE projects SET
        commits = ?, commit_count = ?, branch_count = ?, last_synced_at = ?
      WHERE id = ?`,
    )
    .run(
      JSON.stringify(data.commits),
      data.commits.length,
      data.branchCount,
      new Date().toISOString(),
      id,
    );
}

/**
 * 将任务移动到看板指定列（拖拽落库）。
 *
 * 除更新 status 外同步刷新 updated_at；参数已在调用方做白名单校验。
 */
export function updateTaskStatus(id: string, status: TaskStatus): void {
  getDb()
    .prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), id);
}

/** 更新人机交接确认卡状态。 */
export function setConfirmationState(id: string, state: ConfirmationState): void {
  getDb().prepare('UPDATE confirmations SET state = ? WHERE id = ?').run(state, id);
}

/**
 * 复习一张 L3 知识卡。
 *
 * result='mastered' 标记已掌握；'again' 保留待复习并挪到队列末尾，
 * 使「再复习」后切到下一张。
 */
export function reviewKnowledgeCard(id: string, result: 'again' | 'mastered'): void {
  const db = getDb();
  if (result === 'mastered') {
    db.prepare(
      "UPDATE knowledge_cards SET mastered = 1, review_state = 'mastered' WHERE id = ?",
    ).run(id);
    return;
  }
  const row = db.prepare('SELECT MAX(sort_order) AS m FROM knowledge_cards WHERE due_today = 1').get() as {
    m: number | null;
  };
  db.prepare(
    "UPDATE knowledge_cards SET review_state = 'again', mastered = 0, sort_order = ? WHERE id = ?",
  ).run((row.m ?? 0) + 1, id);
}

/**
 * 推进任务的处理阶段 checklist：当前阶段标记为已完成，
 * 下一个未开始阶段转为进行中（HUB_PLAN §6 屏 06「采纳默认建议 → checklist 随之推进」）。
 *
 * 无 checklist、没有进行中阶段或已全部推进时不做任何改动。
 */
export function advanceTaskChecklist(id: string): void {
  const db = getDb();
  const row = db.prepare('SELECT checklist FROM tasks WHERE id = ?').get(id) as
    | { checklist: string | null }
    | undefined;
  if (!row || row.checklist === null) {
    return;
  }
  const steps = parseJson<ChecklistStep[]>(row.checklist, []);
  const currentIndex = steps.findIndex((step) => step.state === 'current');
  if (currentIndex < 0) {
    return;
  }
  steps[currentIndex] = { ...steps[currentIndex], state: 'done', note: '已按建议执行' };
  const nextIndex = steps.findIndex((step) => step.state === 'todo');
  if (nextIndex >= 0) {
    steps[nextIndex] = { ...steps[nextIndex], state: 'current', note: '进行中' };
  }
  db.prepare('UPDATE tasks SET checklist = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(steps), new Date().toISOString(), id);
}

// endregion

// region 写操作（MCP 服务的外部 Agent 回写入口）

/**
 * 外部 Agent（MCP）创建任务：source 固定为 'ai'，项目必须已存在。
 *
 * handler 缺省 'me'（交给人确认），'cron'/'session' 表示排期给自动执行；
 * checklist 只收 title/note，state 由中枢统一从 'todo' 起步。
 */
export interface AgentTaskDraft {
  projectId: string;
  title: string;
  priority?: number;
  handler?: TaskHandler;
  meta?: string;
  checklist?: { title: string; note?: string }[];
}

export function createAgentTask(draft: AgentTaskDraft): Task {
  const db = getDb();
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(draft.projectId) as
    | { id: string }
    | undefined;
  if (!project) {
    throw new Error(`项目「${draft.projectId}」不存在，无法创建任务`);
  }
  const seqRow = db.prepare('SELECT MAX(seq) AS m FROM tasks').get() as { m: number | null };
  const seq = (seqRow.m ?? 0) + 1;
  const id = `task-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const checklist: ChecklistStep[] | null = draft.checklist?.length
    ? draft.checklist.map((step, index) => ({
        title: step.title,
        state: index === 0 ? 'current' : 'todo',
        note: step.note ?? '',
      }))
    : null;
  db.prepare(
    `INSERT INTO tasks (
      id, seq, project_id, title, priority, source, status, issue_no, flags,
      session_id, work_item_id, handler, meta, in_review_queue, owned,
      checklist, timeline, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'ai', 'todo', NULL, ?, NULL, NULL, ?, ?, 0, 0, ?, NULL, ?, ?)`,
  ).run(
    id,
    seq,
    draft.projectId,
    draft.title,
    Math.max(1, Math.min(3, draft.priority ?? 1)),
    JSON.stringify([{ text: 'AI 生成', tone: 'accent' }]),
    draft.handler ?? 'me',
    draft.meta ?? '',
    checklist === null ? null : JSON.stringify(checklist),
    now,
    now,
  );
  return getTask(id) as Task;
}

/** 记录一条动态流（外部 Agent 的分析结论 / 复盘 / 归类建议）。 */
export function addAgentActivity(input: {
  projectId: string | null;
  kind: ActivityKind;
  title: string;
  meta?: string;
  sourceLabel?: string;
  href?: string | null;
}): Activity {
  const db = getDb();
  const id = `act-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO activity (id, project_id, kind, title, meta, source_label, occurred_at, href)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.projectId,
    input.kind,
    input.title,
    input.meta ?? '',
    input.sourceLabel || 'AI 分析',
    new Date().toISOString(),
    input.href ?? null,
  );
  const row = db.prepare('SELECT * FROM activity WHERE id = ?').get(id) as Row;
  return toActivity(row);
}

/** 落一篇 L2 知识文档（外部 Agent 整理的项目知识，默认草稿待确认）。 */
export function addAgentKnowledgeDoc(input: {
  projectId: string;
  kind: string;
  title: string;
  meta: string;
}): KnowledgeDoc {
  const db = getDb();
  if (!db.prepare('SELECT id FROM projects WHERE id = ?').get(input.projectId)) {
    throw new Error(`项目「${input.projectId}」不存在，无法沉淀知识`);
  }
  const id = `doc-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO knowledge_docs (id, project_id, kind, title, status, meta, created_at)
     VALUES (?, ?, ?, ?, '草稿', ?, ?)`,
  ).run(id, input.projectId, input.kind, input.title, input.meta, new Date().toISOString());
  const row = db.prepare('SELECT * FROM knowledge_docs WHERE id = ?').get(id) as Row;
  return toDoc(row);
}

/** 落一张 L3 知识卡，默认进入今日复习队列（外部 Agent 提炼的跨项目知识）。 */
export function addAgentKnowledgeCard(input: {
  title: string;
  summary: string;
  hitProjects: string[];
  kind?: string;
  originProject?: string | null;
}): KnowledgeCard {
  const db = getDb();
  const id = `card-${randomUUID().slice(0, 8)}`;
  const seqRow = db.prepare('SELECT MAX(sort_order) AS m FROM knowledge_cards').get() as {
    m: number | null;
  };
  db.prepare(
    `INSERT INTO knowledge_cards (
      id, title, summary, hit_projects, origin_project, kind,
      mastered, review_state, due_today, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', 1, ?)`,
  ).run(
    id,
    input.title,
    input.summary,
    JSON.stringify(input.hitProjects),
    input.originProject ?? null,
    input.kind ?? '技术栈知识',
    (seqRow.m ?? 0) + 1,
  );
  const row = db.prepare('SELECT * FROM knowledge_cards WHERE id = ?').get(id) as Row;
  return toCard(row);
}

// endregion
