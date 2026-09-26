/* Orbit V1 prototype — matches index.html IDs; localStorage only */

const STORAGE_KEY = "orbit_v1_prototype_v1";

const CATS = [
  { id: "work", name: "工作", color: "#5b8cff" },
  { id: "study", name: "学习", color: "#3dd6c6" },
  { id: "life", name: "生活", color: "#ff00aa" },
];

const VIEW_TITLES = {
  today: "今天",
  plan: "计划",
  todos: "待办",
  settings: "设置",
};

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedState() {
  const t = todayISO();
  const now = () => new Date().toISOString();
  return {
    todos: [
      {
        id: uid(),
        title: "打开 Orbit，勾选第一条待办",
        notes: "验证「中心是今天」",
        status: "open",
        priority: 2,
        categoryId: "work",
        scheduledFor: t,
        remindAt: `${t}T09:00`,
        completedAt: null,
        sortOrder: 0,
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
        domain: "todo",
      },
      {
        id: uid(),
        title: "读 20 分钟专业书",
        notes: "",
        status: "open",
        priority: 1,
        categoryId: "study",
        scheduledFor: t,
        remindAt: null,
        completedAt: null,
        sortOrder: 1,
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
        domain: "todo",
      },
      {
        id: uid(),
        title: "下楼走 15 分钟",
        notes: "",
        status: "done",
        priority: 1,
        categoryId: "life",
        scheduledFor: t,
        remindAt: null,
        completedAt: now(),
        sortOrder: 2,
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
        domain: "todo",
      },
    ],
    planItems: [
      { id: uid(), title: "深度工作", start: "09:00", end: "11:00", day: t, done: false, domain: "plan", createdAt: now() },
      { id: uid(), title: "午休 / 散步", start: "13:00", end: "13:40", day: t, done: false, domain: "plan", createdAt: now() },
      { id: uid(), title: "复盘明日三件事", start: "21:30", end: "22:00", day: t, done: false, domain: "plan", createdAt: now() },
    ],
    planDay: t,
    filter: "all",
    notifyDemo: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const s = seedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 1800);
}

function formatDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  const isToday = iso === todayISO();
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}${isToday ? " · 今天" : ""}`;
}

function catById(id) {
  return CATS.find((c) => c.id === id) || CATS[0];
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function todosForDay(day) {
  return state.todos
    .filter((t) => !t.deletedAt && t.scheduledFor === day)
    .sort((a, b) =>
      a.status === b.status ? a.sortOrder - b.sortOrder : a.status === "done" ? 1 : -1
    );
}

function todoRow(t) {
  const cat = catById(t.categoryId);
  const pri = t.priority === 2 ? `<span class="tag pri-2">高</span>` : "";
  const remind = t.remindAt
    ? `<span class="tag remind">⏰ ${escapeHtml(t.remindAt.slice(11, 16))}</span>`
    : "";
  const dateTag =
    t.scheduledFor !== todayISO()
      ? `<span class="tag">${t.scheduledFor.slice(5).replace("-", "/")}</span>`
      : "";
  return `
  <li class="todo ${t.status === "done" ? "done" : ""}" data-id="${t.id}">
    <input type="checkbox" class="check" ${t.status === "done" ? "checked" : ""} data-check="${t.id}" aria-label="完成" />
    <div class="t-body">
      <div class="t-title">${escapeHtml(t.title)}</div>
      <div class="t-meta">
        <span class="tag cat-${cat.id}">${escapeHtml(cat.name)}</span>
        ${pri}${dateTag}${remind}
      </div>
    </div>
    <div class="t-actions">
      <button type="button" class="icon-btn" data-tomorrow="${t.id}" title="改期明天">→明</button>
      <button type="button" class="icon-btn danger" data-del="${t.id}" title="删除">✕</button>
    </div>
  </li>`;
}

function blockRow(b) {
  return `
  <div class="block ${b.done ? "done" : ""}" data-block="${b.id}">
    <span class="time">${escapeHtml(b.start)}</span>
    <span class="title">${escapeHtml(b.title)}${b.end ? " – " + escapeHtml(b.end) : ""}</span>
    <button type="button" class="icon-btn" data-block-toggle="${b.id}">${b.done ? "撤销" : "完成"}</button>
  </div>`;
}

function widgetItemsHTML() {
  const open = todosForDay(todayISO()).filter((x) => x.status === "open");
  const wlist = open.slice(0, 4);
  if (!wlist.length) {
    return `<li class="done"><span class="dot" style="background:#3dd68c"></span><span>今日已清空</span></li>`;
  }
  return wlist
    .map(
      (t) =>
        `<li data-toggle="${t.id}" title="点击完成"><span class="dot" style="background:${catById(t.categoryId).color}"></span><span>${escapeHtml(t.title)}</span></li>`
    )
    .join("");
}

function renderHeader() {
  const dateLine = $("#dateLine");
  if (dateLine) dateLine.textContent = formatDateLabel(todayISO());
  const viewTitle = $("#viewTitle");
  if (viewTitle && !showView._custom) {
    // keep last active view title
  }
}

function renderToday() {
  const t = todayISO();
  const list = todosForDay(t);
  const open = list.filter((x) => x.status === "open");
  const done = list.filter((x) => x.status === "done");
  const total = list.length || 1;
  const pct = Math.round((done.length / total) * 100);
  const hasAny = list.length > 0;

  const openCount = $("#openCount");
  if (openCount) openCount.textContent = String(hasAny ? open.length : 0);

  const heroSub = $("#heroSub");
  if (heroSub) {
    heroSub.textContent = hasAny
      ? open[0]
        ? `下一步：${open[0].title}`
        : "全部完成，轨道很稳。"
      : "添加一条待办，开始今天";
  }

  const C = 2 * Math.PI * 30; // r=30 → ≈188.5
  const fg = $("#ringFg");
  if (fg) {
    fg.style.strokeDasharray = String(C);
    fg.style.strokeDashoffset = String(C * (1 - (hasAny ? done.length / list.length : 0)));
  }
  const ringPct = $("#ringPct");
  if (ringPct) ringPct.textContent = `${hasAny ? pct : 0}%`;

  const todayChip = $("#todayChip");
  if (todayChip) todayChip.textContent = String(list.length);

  const ul = $("#todayTodos");
  if (ul) ul.innerHTML = list.map((x) => todoRow(x)).join("");
  const empty = $("#todayEmpty");
  if (empty) empty.hidden = hasAny;

  const blocks = state.planItems
    .filter((b) => b.day === t)
    .sort((a, b) => a.start.localeCompare(b.start));
  const mini = $("#todayPlan");
  if (mini) {
    if (blocks.length) {
      mini.innerHTML = blocks.map((b) => blockRow(b)).join("");
    } else {
      mini.innerHTML = `<div class="empty">用时间块粗排今天，不必精确到分钟。</div>`;
    }
  }

  const wul = $("#widgetList");
  if (wul) wul.innerHTML = widgetItemsHTML();

  const sideWidget = $("#sideWidget");
  if (sideWidget) {
    const openTitles = open.slice(0, 3).map((x) => `<li>• ${escapeHtml(x.title)}</li>`).join("");
    sideWidget.innerHTML = `<strong>今日未完成 ${open.length}</strong>${
      openTitles || "<li>已清空 · 轨道稳定</li>"
    }`;
  }
}

function renderPlan() {
  const day = state.planDay;
  const planDate = $("#planDate") || $("#plan-date");
  if (planDate) planDate.textContent = formatDateLabel(day);

  const blocks = state.planItems
    .filter((b) => b.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const planList = $("#planList");
  if (planList) planList.innerHTML = blocks.map((b) => blockRow(b)).join("");
  const planEmpty = $("#planEmpty");
  if (planEmpty) planEmpty.hidden = blocks.length > 0;

  const strip = $("#dayStrip");
  if (strip) {
    const days = [];
    const base = new Date(day + "T00:00:00");
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    strip.innerHTML = days
      .map((d) => {
        const iso = todayISO(d);
        const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
        const active = iso === state.planDay ? "active" : "";
        return `<button type="button" class="day-pill ${active}" data-day="${iso}"><span class="d-num">${d.getDate()}</span>${week}</button>`;
      })
      .join("");
  }

  // plan view also lists that day's todos under filter section if present
  const planTodos = $("#plan-todos");
  if (planTodos) {
    const list = todosForDay(day);
    planTodos.innerHTML = list.map((x) => todoRow(x)).join("");
    const pe = $("#plan-todos-empty");
    if (pe) pe.hidden = list.length > 0;
  }
}

function renderTodosView() {
  const f = state.filter;
  let list = state.todos.filter((t) => !t.deletedAt);
  if (f === "open") list = list.filter((t) => t.status === "open");
  else if (f === "done") list = list.filter((t) => t.status === "done");
  else if (["work", "study", "life"].includes(f)) list = list.filter((t) => t.categoryId === f);

  list = list.sort((a, b) => {
    if (a.scheduledFor !== b.scheduledFor) return a.scheduledFor.localeCompare(b.scheduledFor);
    return a.sortOrder - b.sortOrder;
  });

  const allList = $("#allTodos") || $("#all-list");
  if (allList) allList.innerHTML = list.map((x) => todoRow(x)).join("");
  const allEmpty = $("#allEmpty") || $("#all-empty");
  if (allEmpty) allEmpty.hidden = list.length > 0;

  $$("#filterRow .pill, #filters .chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.filter === f);
    c.classList.toggle("is-active", c.dataset.filter === f);
  });
}

function renderSettings() {
  const catGrid = $("#catGrid");
  if (catGrid) {
    catGrid.innerHTML = CATS.map((c) => {
      const n = state.todos.filter(
        (t) => !t.deletedAt && t.categoryId === c.id && t.status === "open"
      ).length;
      return `
      <div class="cat-card">
        <div class="left">
          <span class="swatch" style="background:${c.color}"></span>
          <strong>${escapeHtml(c.name)}</strong>
        </div>
        <span class="count">未完成 ${n}</span>
      </div>`;
    }).join("");
  }

  const catChips = $("#cat-chips");
  if (catChips) {
    catChips.innerHTML = CATS.map((c) => {
      const n = state.todos.filter(
        (t) => !t.deletedAt && t.categoryId === c.id && t.status === "open"
      ).length;
      return `<span class="chip is-active"><span class="swatch" style="background:${c.color}"></span>${escapeHtml(c.name)} · ${n}</span>`;
    }).join("");
  }

  const toggle = $("#toggle-notify");
  if (toggle) toggle.checked = !!state.notifyDemo;
}

function renderAll() {
  renderHeader();
  renderToday();
  renderPlan();
  renderTodosView();
  renderSettings();
}

function showView(name) {
  $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === name));
  $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
  $$(".tab").forEach((t) => {
    const on = t.dataset.tab === name || t.dataset.view === name;
    t.classList.toggle("active", on);
    t.classList.toggle("is-active", on);
  });
  const title = $("#viewTitle");
  if (title) title.textContent = VIEW_TITLES[name] || "今天";
}

function toggleTodo(id) {
  const t = state.todos.find((x) => x.id === id);
  if (!t) return;
  t.status = t.status === "done" ? "open" : "done";
  t.updatedAt = new Date().toISOString();
  t.completedAt = t.status === "done" ? new Date().toISOString() : null;
  if (state.notifyDemo && t.status === "done") toast("已完成（演示：将取消本地提醒）");
  save();
  renderAll();
}

function addBlock(title, start) {
  if (!title) {
    toast("先写标题");
    return;
  }
  state.planItems.push({
    id: uid(),
    title,
    start: start || "09:00",
    end: "",
    day: state.planDay,
    done: false,
    domain: "plan",
    createdAt: new Date().toISOString(),
  });
  save();
  renderAll();
  toast("时间块已添加");
}

function openSheet() {
  const sheet = $("#sheet");
  if (!sheet) return;
  const title = $("#inpTitle");
  if (title) title.value = "";
  const date = $("#inpDate");
  if (date) date.value = todayISO();
  const pri = $("#inpPri");
  if (pri) pri.value = "1";
  const cat = $("#inpCat");
  if (cat) cat.innerHTML = CATS.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  const remind = $("#inpRemind");
  if (remind) remind.value = "";
  sheet.hidden = false;
  if (title) title.focus();
}

function closeSheet() {
  const sheet = $("#sheet");
  if (sheet) sheet.hidden = true;
  const modal = $("#modal-todo");
  if (modal) modal.hidden = true;
}

function exportJSON() {
  const payload = {
    app: "orbit",
    schema_version: 1,
    exported_at: new Date().toISOString(),
    categories: CATS,
    todos: state.todos,
    plan_items: state.planItems,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orbit-export-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出 JSON");
}

/* Events */
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (tab && (tab.dataset.tab || tab.dataset.view)) {
    showView(tab.dataset.tab || tab.dataset.view);
    return;
  }

  const goto = e.target.closest("[data-goto]");
  if (goto) {
    showView(goto.dataset.goto);
    return;
  }

  if (e.target.matches("[data-check]")) {
    toggleTodo(e.target.dataset.check);
    return;
  }

  const w = e.target.closest("[data-toggle]");
  if (w) {
    toggleTodo(w.dataset.toggle);
    return;
  }

  const del = e.target.closest("[data-del]");
  if (del) {
    const t = state.todos.find((x) => x.id === del.dataset.del);
    if (t) {
      t.deletedAt = new Date().toISOString();
      save();
      renderAll();
      toast("已软删除");
    }
    return;
  }

  const tom = e.target.closest("[data-tomorrow]");
  if (tom) {
    const t = state.todos.find((x) => x.id === tom.dataset.tomorrow);
    if (t) {
      const d = new Date(t.scheduledFor + "T00:00:00");
      d.setDate(d.getDate() + 1);
      t.scheduledFor = todayISO(d);
      t.updatedAt = new Date().toISOString();
      save();
      renderAll();
      toast("已改期到明天");
    }
    return;
  }

  const bt = e.target.closest("[data-block-toggle]");
  if (bt) {
    const b = state.planItems.find((x) => x.id === bt.dataset.blockToggle);
    if (b) {
      b.done = !b.done;
      save();
      renderAll();
    }
    return;
  }

  const dayBtn = e.target.closest("[data-day]");
  if (dayBtn) {
    state.planDay = dayBtn.dataset.day;
    save();
    renderAll();
    return;
  }

  if (e.target.closest("[data-close]")) {
    closeSheet();
  }
});

$("#btnAdd")?.addEventListener("click", openSheet);
$("#btn-add")?.addEventListener("click", openSheet);

$("#btnSaveTodo")?.addEventListener("click", () => {
  const titleEl = $("#inpTitle") || $("#todo-title");
  const title = titleEl ? titleEl.value.trim() : "";
  if (!title) {
    toast("标题不能为空");
    return;
  }
  const date = ($("#inpDate") || $("#todo-date"))?.value || todayISO();
  const remind = ($("#inpRemind") || $("#todo-remind"))?.value || "";
  const cat = ($("#inpCat") || $("#todo-cat"))?.value || "work";
  const pri = Number(($("#inpPri") || $("#todo-pri"))?.value || 1);
  state.todos.push({
    id: uid(),
    title,
    notes: "",
    status: "open",
    priority: pri,
    categoryId: cat,
    scheduledFor: date,
    remindAt: remind ? `${date}T${remind}` : null,
    completedAt: null,
    sortOrder: state.todos.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    domain: "todo",
  });
  save();
  closeSheet();
  showView("today");
  renderAll();
  toast(remind ? "已保存 · 到点将本地提醒" : "已保存");
});

$("#todo-save")?.addEventListener("click", () => {
  $("#btnSaveTodo")?.click();
});

const filterRow = $("#filterRow") || $("#filters");
filterRow?.addEventListener("click", (e) => {
  const c = e.target.closest(".pill, .chip");
  if (!c || !c.dataset.filter) return;
  state.filter = c.dataset.filter;
  save();
  renderTodosView();
});

$("#btn-prev-day")?.addEventListener("click", () => {
  const d = new Date(state.planDay + "T00:00:00");
  d.setDate(d.getDate() - 1);
  state.planDay = todayISO(d);
  save();
  renderAll();
});
$("#btn-next-day")?.addEventListener("click", () => {
  const d = new Date(state.planDay + "T00:00:00");
  d.setDate(d.getDate() + 1);
  state.planDay = todayISO(d);
  save();
  renderAll();
});

function promptBlock() {
  const title = prompt("时间块标题", "深度工作");
  if (title) addBlock(title, "14:00");
}

$("#btnAddPlan")?.addEventListener("click", promptBlock);
$("#btn-add-block")?.addEventListener("click", promptBlock);
$("#btn-add-block2")?.addEventListener("click", () => {
  const title = $("#block-title");
  const start = $("#block-start");
  addBlock(title?.value.trim(), start?.value);
  if (title) title.value = "";
});

$("#btnExport")?.addEventListener("click", exportJSON);
$("#btnExport2")?.addEventListener("click", exportJSON);
$("#btn-export")?.addEventListener("click", exportJSON);
$("#btn-export2")?.addEventListener("click", exportJSON);

$("#btnReset")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = load();
  renderAll();
  toast("已重置演示数据");
});
$("#btn-reset")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = load();
  renderAll();
  toast("已重置演示数据");
});

$("#toggle-notify")?.addEventListener("change", (e) => {
  state.notifyDemo = e.target.checked;
  save();
  toast(state.notifyDemo ? "本地提醒演示已开" : "本地提醒演示已关");
});

// Esc closes sheet
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

/* Boot */
renderAll();
showView("today");
