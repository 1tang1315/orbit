/* 项目知识中枢 prototype — mock data + localStorage */

const KEY = "orbit_knowledge_prototype_v1";

const seed = () => ({
  projects: [
    {
      id: "orbit",
      name: "轨道 Orbit",
      desc: "个人 Life OS：今日待办与日计划，后续挂项目/学习卫星。",
      stack: ["Flutter", "Riverpod", "Drift"],
      lastScan: "今天 10:24",
      l1: { structure: 12, deps: 8, readme: true, commits: 156 },
      docs: [
        { id: "d1", title: "项目解析 · V1 边界为何收这么紧", type: "解析", status: "confirmed", updated: "昨天" },
        { id: "d2", title: "ADR-001：本地优先不上账号", type: "ADR", status: "confirmed", updated: "3 天前" },
        { id: "d3", title: "复盘：原型与设计文档对齐", type: "复盘", status: "draft", updated: "2 小时前" },
      ],
      commits: [
        { hash: "55ead81", msg: "Add V1 design docs, README, and interactive browser prototype", when: "2h ago" },
        { hash: "6b13a44", msg: "Initial commit", when: "6d ago" },
      ],
      tasks: [
        { id: "t1", title: "脚手架 Flutter 工程 com.orbit.life", status: "todo", pri: 2, tag: "工程" },
        { id: "t2", title: "实现今日列表 + 完成/改期", status: "doing", pri: 2, tag: "V1a" },
        { id: "t3", title: "确认数据模型导出字段", status: "review", pri: 1, tag: "数据" },
        { id: "t4", title: "锁死 V1 不做清单", status: "done", pri: 1, tag: "产品" },
      ],
      knowledge: ["k1", "k3"],
    },
    {
      id: "shop",
      name: "商城后台（协作）",
      desc: "与同事协作的订单与库存后台；主要沉淀支付回调与幂等经验。",
      stack: ["NestJS", "PostgreSQL", "Redis"],
      lastScan: "昨天 18:02",
      l1: { structure: 34, deps: 21, readme: true, commits: 412 },
      docs: [
        { id: "s1", title: "支付回调重复投递的三种坑", type: "踩坑", status: "confirmed", updated: "上周" },
        { id: "s2", title: "规格：退款状态机", type: "规格", status: "draft", updated: "今天" },
      ],
      commits: [
        { hash: "a1c9e02", msg: "fix: idempotency key on payment callback", when: "1d ago" },
        { hash: "bb31f77", msg: "feat: inventory hold on checkout", when: "3d ago" },
      ],
      tasks: [
        { id: "st1", title: "对齐退款状态机与前端", status: "doing", pri: 2, tag: "协作" },
        { id: "st2", title: "补回调幂等集成测试", status: "todo", pri: 2, tag: "质量" },
      ],
      knowledge: ["k2", "k3"],
    },
    {
      id: "landing",
      name: "个人主页",
      desc: "静态作品集；用于验证「扫描 → 生成架构摘要」链路。",
      stack: ["Astro", "Tailwind"],
      lastScan: "3 天前",
      l1: { structure: 6, deps: 4, readme: false, commits: 48 },
      docs: [],
      commits: [{ hash: "0e12aa1", msg: "chore: deploy workflow", when: "3d ago" }],
      tasks: [],
      knowledge: [],
    },
  ],
  l3: [
    { id: "k1", kind: "stack", title: "Flutter 本地优先套路", body: "Drift + 稳定 ID + 软删除；通知与小组件读同一库，避免双份真相。", from: "orbit" },
    { id: "k2", kind: "pitfall", title: "支付回调必须幂等", body: "以 event_id 做唯一键；业务处理与投递解耦，重放不产生重复履约。", from: "shop" },
    { id: "k3", kind: "pattern", title: "任务完成 → 复盘模板", body: "改动摘要 / 踩坑 / 下次注意 / 是否升 L3；固定四段，降低写作成本。", from: "orbit, shop" },
    { id: "k4", kind: "stack", title: "PostgreSQL 只做云端第二层", body: "手机/桌面离线仍以本地 SQLite 为准；同步用变更队列，不单点依赖 PG。", from: "orbit" },
  ],
  feed: [
    { id: "f1", kind: "commit", title: "orbit 推送 1 个提交", meta: "55ead81 · 设计文档与原型", time: "2 小时前", pid: "orbit" },
    { id: "f2", kind: "draft", title: "L2 草稿待确认", meta: "复盘：原型与设计文档对齐", time: "2 小时前", pid: "orbit" },
    { id: "f3", kind: "task", title: "商城后台任务进行中", meta: "对齐退款状态机与前端", time: "昨天", pid: "shop" },
    { id: "f4", kind: "scan", title: "个人主页完成扫描", meta: "L1：6 模块 · 4 依赖 · 无 README", time: "3 天前", pid: "landing" },
  ],
  pending: [
    {
      id: "p1",
      pid: "orbit",
      type: "复盘",
      title: "复盘：原型与设计文档对齐",
      body: "## 结论\n设计边界与 HTML 原型一致，V1 仍不做 AI/云同步。\n\n## 下次\n脚手架前再跑一遍成功标准。",
    },
    {
      id: "p2",
      pid: "shop",
      type: "规格",
      title: "规格：退款状态机",
      body: "## 状态\ncreated → requested → approved → settled | rejected\n\n## 开放问题\n超时自动 settle？",
    },
  ],
  boardPid: "orbit",
  l3Filter: "all",
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

let state = load();
let currentPid = "orbit";
let detailTab = "overview";
let pendingConfirmId = null;

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 1800);
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function project(id) {
  return state.projects.find((p) => p.id === id) || state.projects[0];
}

function openTaskCount(p) {
  return p.tasks.filter((t) => t.status !== "done").length;
}

function draftCount(p) {
  return (
    p.docs.filter((d) => d.status === "draft").length +
    state.pending.filter((x) => x.pid === p.id).length
  );
}

/* Navigation */
function showNav(name) {
  const map = {
    feed: "feed",
    projects: "projects",
    board: "board",
    knowledge: "knowledge",
    settings: "settings",
  };
  if (name === "detail") {
    $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === "detail"));
  } else {
    $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === map[name]));
  }
  $$(".side-item, .bnav").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === name || (name === "detail" && b.dataset.nav === "projects"));
  });
  const crumbs = {
    feed: "动态",
    projects: "项目",
    board: "看板",
    knowledge: "知识 L3",
    settings: "设置",
    detail: `项目 / ${project(currentPid).name}`,
  };
  $("#crumbs").textContent = crumbs[name] || "动态";
  renderAll();
}

$$(".side-item, .bnav").forEach((btn) => {
  btn.addEventListener("click", () => showNav(btn.dataset.nav));
});

$("#btnBackProjects").addEventListener("click", () => showNav("projects"));

/* Feed */
function renderFeed() {
  $("#feedList").innerHTML = state.feed
    .map((f) => {
      const icon =
        f.kind === "commit" ? "C" : f.kind === "draft" ? "AI" : f.kind === "task" ? "T" : "S";
      const cls =
        f.kind === "commit" ? "commit" : f.kind === "draft" ? "draft" : f.kind === "task" ? "task" : "";
      return `
      <article class="feed-item" data-feed="${f.id}" data-pid="${esc(f.pid)}">
        <div class="feed-icon ${cls}">${icon}</div>
        <div>
          <p class="feed-title">${esc(f.title)}</p>
          <div class="feed-meta">${esc(f.meta)} · ${esc(project(f.pid).name)}</div>
        </div>
        <div class="feed-time">${esc(f.time)}</div>
      </article>`;
    })
    .join("");
}

$("#feedList").addEventListener("click", (e) => {
  const item = e.target.closest("[data-feed]");
  if (!item) return;
  const f = state.feed.find((x) => x.id === item.dataset.feed);
  currentPid = item.dataset.pid;
  const kind = f ? f.kind : "commit";
  detailTab =
    kind === "draft" ? "docs" : kind === "task" ? "tasks" : kind === "commit" ? "commits" : "overview";
  showNav("detail");
});

/* Projects */
function renderProjects() {
  $("#projectGrid").innerHTML = state.projects
    .map((p) => {
      const drafts = draftCount(p);
      return `
      <article class="p-card" data-open="${p.id}">
        <h3>${esc(p.name)}</h3>
        <p class="desc">${esc(p.desc)}</p>
        <div class="p-stats">
          <span class="chip">栈 ${p.stack.length}</span>
          <span class="chip accent">任务 ${openTaskCount(p)}</span>
          <span class="chip ${drafts ? "warn" : "ok"}">草稿 ${drafts}</span>
          <span class="chip">扫描 ${esc(p.lastScan)}</span>
        </div>
      </article>`;
    })
    .join("");
}

$("#projectGrid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-open]");
  if (!card) return;
  currentPid = card.dataset.open;
  detailTab = "overview";
  showNav("detail");
});

/* Detail */
$("#detailTabs").addEventListener("click", (e) => {
  const t = e.target.closest("[data-dtab]");
  if (!t) return;
  detailTab = t.dataset.dtab;
  $$("#detailTabs .tab").forEach((x) => x.classList.toggle("active", x === t));
  renderDetail();
});

function renderDetail() {
  const p = project(currentPid);
  $$("#detailTabs .tab").forEach((x) => x.classList.toggle("active", x.dataset.dtab === detailTab));
  $("#crumbs").textContent = `项目 / ${p.name}`;

  $("#detailHero").innerHTML = `
    <h2>${esc(p.name)}</h2>
    <p>${esc(p.desc)}</p>
    <div class="hero-meta">
      ${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}
      <span class="chip accent">L1 提交 ${p.l1.commits}</span>
      <span class="chip">上次扫描 ${esc(p.lastScan)}</span>
    </div>`;

  const body = $("#detailBody");
  if (detailTab === "overview") body.innerHTML = overviewHTML(p);
  else if (detailTab === "arch") body.innerHTML = archHTML(p);
  else if (detailTab === "docs") body.innerHTML = docsHTML(p);
  else if (detailTab === "commits") body.innerHTML = commitsHTML(p);
  else if (detailTab === "tasks") body.innerHTML = taskTabHTML(p);
  else if (detailTab === "know") body.innerHTML = knowHTML(p);
}

function overviewHTML(p) {
  const confirmed = p.docs.filter((d) => d.status === "confirmed").length;
  const drafts = draftCount(p);
  return `
  <div class="hint-bar">闭环：看板任务 → 写复盘 → 确认 L2 → 提炼 L3。各步均可点击右侧「今日闭环」或下方图层。</div>
  <div class="ov-grid">
    <div class="ov-card clickable" data-ovtab="arch"><div class="label">L1 结构模块</div><div class="value">${p.l1.structure}</div><div class="hint">自动生成 → 架构</div></div>
    <div class="ov-card clickable" data-ovtab="arch"><div class="label">依赖</div><div class="value">${p.l1.deps}</div><div class="hint">清单已解析 → 架构</div></div>
    <div class="ov-card clickable" data-ovtab="docs"><div class="label">已确认文档</div><div class="value">${confirmed}</div><div class="hint">L2 → 文档</div></div>
    <div class="ov-card clickable" data-ovtab="docs"><div class="label">待确认草稿</div><div class="value">${drafts}</div><div class="hint">需确认 → 文档</div></div>
  </div>
  <div class="layer-map">
    <h3>三层知识在本项目（点击切换 Tab）</h3>
    <div class="layer-row clickable" data-ovtab="commits">
      <span class="layer-tag l1">L1</span>
      <div class="layer-body">目录树 · 依赖 ${p.l1.deps} 项 · README ${p.l1.readme ? "有" : "无"} · 提交与架构 → 点击查看</div>
    </div>
    <div class="layer-row clickable" data-ovtab="docs">
      <span class="layer-tag l2">L2</span>
      <div class="layer-body">${p.docs.map((d) => esc(d.title) + (d.status === "draft" ? "（草稿）" : "")).join("；") || "暂无"} → 点击文档</div>
    </div>
    <div class="layer-row clickable" data-ovtab="know">
      <span class="layer-tag l3">L3</span>
      <div class="layer-body">${p.knowledge.map((id) => {
        const k = state.l3.find((x) => x.id === id);
        return k ? esc(k.title) : "";
      }).join("；") || "尚未提炼跨项目条目"} → 点击知识</div>
    </div>
    <div class="layer-row clickable" data-ovtab="tasks">
      <span class="layer-tag l1" style="background:#fff7ed;color:#d97706">任务</span>
      <div class="layer-body">${openTaskCount(p)} 项未完成 → 点击看板 / 写复盘</div>
    </div>
  </div>`;
}

function archHTML() {
  return `
  <div class="arch" aria-label="架构示意">
    <svg viewBox="0 0 640 280" width="640" height="280" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="600" height="48" rx="10" fill="#eef1ff" stroke="#c7d7fe"/>
      <text x="320" y="49" text-anchor="middle" font-size="14" fill="#4f6cf7" font-family="system-ui">表现层 UI · 路由 / 断点</text>
      <line x1="320" y1="68" x2="320" y2="100" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>
      <rect x="20" y="104" width="280" height="48" rx="10" fill="#fff" stroke="#e6e8ee"/>
      <text x="160" y="133" text-anchor="middle" font-size="13" fill="#171a21" font-family="system-ui">应用层 · Controllers</text>
      <rect x="340" y="104" width="280" height="48" rx="10" fill="#fff" stroke="#e6e8ee"/>
      <text x="480" y="133" text-anchor="middle" font-size="13" fill="#171a21" font-family="system-ui">领域模型 · domain</text>
      <line x1="160" y1="152" x2="160" y2="184" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>
      <line x1="480" y1="152" x2="480" y2="184" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#a)"/>
      <rect x="20" y="188" width="280" height="48" rx="10" fill="#f8fafc" stroke="#e6e8ee"/>
      <text x="160" y="217" text-anchor="middle" font-size="13" fill="#5b6472" font-family="system-ui">Repositories</text>
      <rect x="340" y="188" width="280" height="48" rx="10" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="480" y="217" text-anchor="middle" font-size="13" fill="#0d9488" font-family="system-ui">本地存储 Drift / Vault</text>
      <defs>
        <marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
        </marker>
      </defs>
    </svg>
  </div>
  <p class="muted" style="margin-top:10px">L1 由扫描生成；正式版可替换为 mermaid 渲染或后端出图。</p>`;
}

function docsHTML(p) {
  if (!p.docs.length) return `<div class="empty">还没有 L2 文档。点右上角「+ 知识草稿」。</div>`;
  return `<div class="doc-list">${p.docs
    .map((d) => {
      const badge =
        d.status === "confirmed"
          ? `<span class="chip ok">已确认 L2</span>`
          : `<span class="chip warn">草稿</span>`;
      return `
      <div class="doc-item">
        <div>
          <h4>${esc(d.title)}</h4>
          <div class="meta">${esc(d.type)} · 更新 ${esc(d.updated)}</div>
        </div>
        <div class="doc-actions">
          ${badge}
          ${
            d.status === "draft"
              ? `<button type="button" class="mini" data-doc-confirm="${d.id}">确认</button>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("")}</div>`;
}

$("#detailBody").addEventListener("click", (e) => {
  const ov = e.target.closest("[data-ovtab]");
  if (ov) {
    detailTab = ov.dataset.ovtab;
    renderDetail();
    return;
  }
  const btn = e.target.closest("[data-doc-confirm]");
  if (btn) {
    const p = project(currentPid);
    const doc = p.docs.find((d) => d.id === btn.dataset.docConfirm);
    if (doc) {
      doc.status = "confirmed";
      doc.updated = "刚刚";
      save();
      renderAll();
      toast("已确认 → L2");
    }
  }
});

function commitsHTML(p) {
  return `<div class="commit-list">${p.commits
    .map(
      (c) => `
    <div class="commit-row">
      <span class="hash">${esc(c.hash)}</span>
      <span>${esc(c.msg)}</span>
      <span class="when">${esc(c.when)}</span>
    </div>`
    )
    .join("")}</div>
    <p class="muted" style="margin-top:10px">L1 事实层 · 来自 Git 源适配器（演示）</p>`;
}

function taskTabHTML(p) {
  return boardHTML(p);
}

function knowHTML(p) {
  const items = p.knowledge
    .map((id) => state.l3.find((k) => k.id === id))
    .filter(Boolean);
  if (!items.length) return `<div class="empty">本项目尚未贡献 L3 知识卡。</div>`;
  return `<div class="k-card-grid">${items
    .map(
      (k) => `
    <div class="k-card">
      <span class="k-type">${esc(k.kind)}</span>
      <h3>${esc(k.title)}</h3>
      <p>${esc(k.body)}</p>
      <div class="src">来源：${esc(k.from)}</div>
    </div>`
    )
    .join("")}</div>`;
}

/* Board */
const COLS = [
  { id: "todo", label: "待办" },
  { id: "doing", label: "进行中" },
  { id: "review", label: "待确认" },
  { id: "done", label: "完成" },
];

function boardHTML(p) {
  return `<div class="board" data-board="${p.id}">${COLS.map((col) => {
    const tasks = p.tasks.filter((t) => t.status === col.id);
    return `
    <div class="col" data-col="${col.id}">
      <div class="col-head">${col.label}<span class="col-count">${tasks.length}</span></div>
      ${tasks
        .map(
          (t) => `
        <div class="task-card" data-task="${t.id}">
          <h4>${esc(t.title)}</h4>
          <div class="task-meta">
            <span class="chip">${esc(t.tag)}</span>
            <span class="chip ${t.pri === 2 ? "warn" : ""}">${t.pri === 2 ? "高" : "中"}</span>
          </div>
          <div class="task-actions">
            ${col.id !== "todo" ? `<button type="button" class="mini" data-move="back" data-tid="${t.id}">←</button>` : ""}
            ${col.id !== "done" ? `<button type="button" class="mini" data-move="fwd" data-tid="${t.id}">→</button>` : ""}
            ${col.id === "done" ? `<button type="button" class="mini" data-retro="${t.id}">写复盘</button>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </div>`;
  }).join("")}</div>`;
}

function bindBoard(root) {
  root.addEventListener("click", (e) => {
    const move = e.target.closest("[data-move]");
    const retro = e.target.closest("[data-retro]");
    const pid = root.dataset.board || state.boardPid;
    const p = project(pid);

    if (move) {
      const t = p.tasks.find((x) => x.id === move.dataset.tid);
      if (!t) return;
      const order = COLS.map((c) => c.id);
      const i = order.indexOf(t.status);
      const next = move.dataset.move === "fwd" ? order[Math.min(i + 1, 3)] : order[Math.max(i - 1, 0)];
      t.status = next;
      save();
      renderAll();
      toast(next === "done" ? "完成 → 可写复盘" : `已移到 ${COLS.find((c) => c.id === next).label}`);
      return;
    }
    if (retro) {
      const t = p.tasks.find((x) => x.id === retro.dataset.retro);
      openDraftSheet(p.id, "复盘", t ? `复盘：${t.title}` : "");
    }
  });
}

function renderBoard() {
  $("#boardProjectChips").innerHTML = state.projects
    .map(
      (p) =>
        `<button type="button" class="pill ${p.id === state.boardPid ? "active" : ""}" data-bp="${p.id}">${esc(p.name)}</button>`
    )
    .join("");
  const p = project(state.boardPid);
  $("#boardColumns").innerHTML = boardHTML(p);
  bindBoard($("#boardColumns"));
}

$("#boardProjectChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-bp]");
  if (!b) return;
  state.boardPid = b.dataset.bp;
  save();
  renderBoard();
});

/* Detail tasks tab also needs board bindings — rebind on each render */
const detailObserver = new MutationObserver(() => {
  const board = $("#detailBody .board");
  if (board && !board.dataset.bound) {
    board.dataset.bound = "1";
    bindBoard($("#detailBody"));
  }
});
detailObserver.observe($("#detailBody"), { childList: true });

/* L3 */
function renderL3() {
  const f = state.l3Filter;
  const items = state.l3.filter((k) => f === "all" || k.kind === f);
  $("#l3Grid").innerHTML = items
    .map(
      (k) => `
    <div class="k-card clickable" data-kopen="${esc(k.from.split(",")[0].trim())}" title="打开来源项目">
      <span class="k-type">${esc(k.kind)}</span>
      <h3>${esc(k.title)}</h3>
      <p>${esc(k.body)}</p>
      <div class="src">来源项目：${esc(k.from)} → 点击打开</div>
    </div>`
    )
    .join("");
  $$("#l3Filters .pill").forEach((p) => p.classList.toggle("active", p.dataset.l3 === f));
}

$("#l3Grid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-kopen]");
  if (!card) return;
  const pid = card.dataset.kopen;
  if (!state.projects.some((p) => p.id === pid)) return;
  currentPid = pid;
  detailTab = "know";
  showNav("detail");
});

$("#l3Filters").addEventListener("click", (e) => {
  const p = e.target.closest("[data-l3]");
  if (!p) return;
  state.l3Filter = p.dataset.l3;
  save();
  renderL3();
});

/* Pending drafts context */
function renderPending() {
  const root = $("#pendingDrafts");
  if (!state.pending.length) {
    root.innerHTML = `<p class="muted">没有待确认草稿。</p>`;
    return;
  }
  root.innerHTML = state.pending
    .map(
      (d) => `
    <div class="draft-item">
      <h4>${esc(d.title)}</h4>
      <p>${esc(project(d.pid).name)} · ${esc(d.type)}</p>
      <div class="d-actions">
        <button type="button" class="mini" data-pview="${d.id}">查看</button>
        <button type="button" class="mini" data-pok="${d.id}">确认 L2</button>
      </div>
    </div>`
    )
    .join("");
}

$("#pendingDrafts").addEventListener("click", (e) => {
  const ok = e.target.closest("[data-pok]");
  const view = e.target.closest("[data-pview]");
  if (view) {
    const d = state.pending.find((x) => x.id === view.dataset.pview);
    if (!d) return;
    currentPid = d.pid;
    detailTab = "docs";
    showNav("detail");
    return;
  }
  if (ok) {
    const d = state.pending.find((x) => x.id === ok.dataset.pok);
    if (!d) return;
    pendingConfirmId = d.id;
    $("#confirmSummary").textContent = `${d.title} → 写入 ${project(d.pid).name} 的 L2`;
    $("#confirmSheet").hidden = false;
  }
});

$("#btnConfirmDoc").addEventListener("click", () => {
  const d = state.pending.find((x) => x.id === pendingConfirmId);
  if (!d) return;
  const p = project(d.pid);
  p.docs.unshift({
    id: "d" + Math.random().toString(36).slice(2, 8),
    title: d.title,
    type: d.type,
    status: "confirmed",
    updated: "刚刚",
  });
  state.pending = state.pending.filter((x) => x.id !== d.id);
  state.feed.unshift({
    id: "f" + Date.now(),
    kind: "draft",
    title: "L2 文档已确认",
    meta: d.title,
    time: "刚刚",
    pid: d.pid,
  });
  save();
  $("#confirmSheet").hidden = true;
  currentPid = d.pid;
  detailTab = "docs";
  showNav("detail");
  toast("已写入 L2 → 项目文档");
});

/* Flywheel shortcuts in context rail */
$$(".fly-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    const fly = btn.dataset.fly;
    if (fly === "board") {
      showNav("board");
    } else if (fly === "docs") {
      const first = state.pending[0];
      if (first) {
        currentPid = first.pid;
        detailTab = "docs";
        showNav("detail");
      } else {
        showNav("projects");
        toast("没有待确认草稿，先去项目里新建");
      }
    } else if (fly === "l3") {
      showNav("knowledge");
    } else if (fly === "retro") {
      const p = project(state.boardPid || currentPid);
      const done = p.tasks.find((t) => t.status === "done");
      openDraftSheet(p.id, "复盘", done ? `复盘：${done.title}` : "复盘：");
      if (!done) toast("先在看板把任务推到完成，再回来写复盘");
    }
  });
});

/* Draft sheet */
function openDraftSheet(pid, type, title) {
  $("#draftProject").innerHTML = state.projects
    .map((p) => `<option value="${p.id}" ${p.id === pid ? "selected" : ""}>${esc(p.name)}</option>`)
    .join("");
  $("#draftType").value = type || "解析";
  $("#draftTitle").value = title || "";
  $("#draftBody").value = "";
  $("#draftSheet").hidden = false;
}

$("#btnNewDoc").addEventListener("click", () => openDraftSheet(currentPid, "解析", ""));
$("#btnAiDraft").addEventListener("click", () => {
  const type = $("#draftType").value;
  const title = $("#draftTitle").value || `${type}：${project($("#draftProject").value).name}`;
  $("#draftTitle").value = title;
  $("#draftBody").value = [
    "## 背景",
    "（AI 起草占位：正式版调用模型，基于 L1 扫描结果生成）",
    "",
    "## 要点",
    "- …",
    "",
    "## 风险 / 待确认",
    "- …",
  ].join("\n");
  toast("已生成草稿结构（演示）");
});

$("#btnSaveDraft").addEventListener("click", () => {
  const title = $("#draftTitle").value.trim();
  if (!title) {
    toast("先填标题");
    return;
  }
  const pid = $("#draftProject").value;
  const type = $("#draftType").value;
  const body = $("#draftBody").value;
  const p = project(pid);
  p.docs.unshift({
    id: "d" + Math.random().toString(36).slice(2, 8),
    title,
    type,
    status: "draft",
    updated: "刚刚",
  });
  state.pending.unshift({
    id: "p" + Math.random().toString(36).slice(2, 8),
    pid,
    type,
    title,
    body,
  });
  state.feed.unshift({
    id: "f" + Date.now(),
    kind: "draft",
    title: "新 L2 草稿待确认",
    meta: title,
    time: "刚刚",
    pid,
  });
  save();
  $("#draftSheet").hidden = true;
  renderAll();
  toast("草稿已保存，待你确认");
});

/* Close sheets */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) {
    $("#draftSheet").hidden = true;
    $("#confirmSheet").hidden = true;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("#draftSheet").hidden = true;
    $("#confirmSheet").hidden = true;
  }
});

/* Sync mock */
$("#btnSync").addEventListener("click", () => {
  const p = project(currentPid);
  p.lastScan = "刚刚";
  p.l1.commits += 1;
  state.feed.unshift({
    id: "f" + Date.now(),
    kind: "scan",
    title: `${p.name} 完成扫描`,
    meta: `L1：${p.l1.structure} 模块 · ${p.l1.deps} 依赖`,
    time: "刚刚",
    pid: p.id,
  });
  save();
  renderAll();
  toast("已模拟扫描（无真实 clone）");
});

/* Export / reset */
function exportK() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "knowledge-export.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("已导出");
}
$("#btnExportK").addEventListener("click", exportK);
$("#btnResetK").addEventListener("click", () => {
  localStorage.removeItem(KEY);
  state = load();
  renderAll();
  toast("已重置");
});

/* Render all */
function renderAll() {
  renderFeed();
  renderProjects();
  renderDetail();
  renderBoard();
  renderL3();
  renderPending();
}

renderAll();
showNav("feed");
