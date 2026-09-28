# 02 — Web 开发规范

> 技术栈：Next.js（App Router）+ TypeScript + Tailwind CSS + SCSS + `node:sqlite`。
> 通用约定（命名、Import、注释、Git）见 [01-通用规范](./01-通用规范.md)。

---

## 1. 分层与依赖方向

### 1.1 三层结构

```text
app/          路由层 —— 只做 layout / page 组装与数据获取，不写业务组件实现
<业务域>/      业务层 —— components/（界面）+ actions.ts（服务端逻辑），前后端不拆
shared/       公共层 —— db / seed / shell / ui
```

### 1.2 依赖方向（硬性）

```text
app/  ──▶  业务域  ──▶  shared/
```

| 规则 | 说明 |
|---|---|
| `shared/` 禁止 import 业务域 | 公共层不认识业务；确属某业务的东西放回该业务域 |
| 业务域之间禁止互相 import `components/` | 跨业务复用的组件**上提**到 `shared/ui/` |
| 业务域可以 import `shared/` 与其他业务域的 `actions.ts` | 只读查询可复用；写动作不跨域调用 |
| `actions.ts` 禁止 import 任何 React 组件 | 服务端逻辑保持纯 TS |

### 1.3 业务域标准结构

```text
tasks/                       # 业务域名 = 领域名（kebab-case）
  components/                # 该业务的 React 组件（PascalCase.tsx）
    TaskCard.tsx
    KanbanColumn.tsx
  actions.ts                 # 'use server'：该业务的读查询与写动作
  types.ts                   # 该业务的接口/类型（可选，可内联在 actions.ts）
  styles.scss                # 该业务专属的复杂样式（可选，优先用 Tailwind）
```

何时新建业务域：对应一屏或一组强关联的屏（参考 HUB_PLAN §6 映表）。拿不准时先放现有域，膨胀后再拆——拆分成本低于预设计。

---

## 2. 路由与页面（app/）

### 2.1 文件与 URL

- 路由文件使用框架保留名：`page.tsx`（页面）、`layout.tsx`（布局）、`route.ts`（API 端点）、`not-found.tsx`。
- URL 一律 **kebab-case**：`/work-items/[id]`、`/tech-stack`；与 HUB_PLAN §6 屏幕表一一对应，**不擅自增删路由**。
- 动态段用方括号：`projects/[id]/page.tsx` → `/projects/sk-mind`。

### 2.2 Server Component 优先

- `app/` 下所有组件**默认是服务端组件**，直接在组件体内调用业务域 `actions.ts` 取数。
- 只有需要客户端交互（hooks、事件、拖拽）的组件才加 `'use client'`，且**加在最叶子的组件**上——不要把整个页面标记为客户端组件。

```tsx
// ✅ page.tsx（服务端）取数，把数据下传给客户端叶子组件
import { getBoardTasks } from '@/tasks/actions';
import { KanbanBoard } from '@/tasks/components/KanbanBoard';

export default async function BoardPage() {
  const tasks = await getBoardTasks();
  return <KanbanBoard initialTasks={tasks} />;
}
```

### 2.3 页面骨架

- 全局壳（侧栏 + 顶栏）在 `app/layout.tsx` 组装自 `shared/shell/`，页面只写内容区。
- 页面级数据获取写在 `page.tsx` 顶部；超过一个查询时先在业务域 `actions.ts` 里组合，**不在 page 里拼 SQL 或散调 db**。

---

## 3. 数据访问与 Server Actions

### 3.1 触库入口唯一

- 所有 SQL 只出现在 `shared/db.ts` 与各业务域 `actions.ts`。
- React 组件内**禁止**直接 import `node:sqlite` 或写 SQL。
- 查询返回给 UI 的行必须经过 `shared/db.ts` 的映射：**snake_case 列 → camelCase 字段**（见 01 §1.5）。

### 3.2 读：普通异步函数

```typescript
// tasks/actions.ts — 读查询不需要 'use server'
export async function getBoardTasks(): Promise<Task[]> { ... }
```

### 3.3 写：Server Actions

- 写动作文件顶部（或每个导出函数）标注 `'use server'`，函数名**动词开头**、语义明确。
- 每个写动作完成后按需 `revalidatePath`（看板 `/board`、详情 `/tasks/[id]` 等），保证刷新可见。
- 参数必须在服务端二次校验（状态值白名单、ID 存在性），**不信任客户端传值**。

```typescript
'use server';

import { revalidatePath } from 'next/cache';

/** 将任务移动到看板指定列（拖拽落库）。 */
export async function moveTaskStatus(taskId: string, status: TaskStatus) {
  assertTaskStatus(status);   // 白名单校验
  await db.updateTaskStatus(taskId, status);
  revalidatePath('/board');
}
```

- 本期写动作收敛为 HUB_PLAN §5 的 3 个；**新增写动作先更新计划文档再实现**。

### 3.4 Route Handlers（`app/api/`）

- 仅用于将来对外/自动化留口（`/api/sync`、`/api/generate`、`/api/health`）。
- 应用内部页面交互**一律走 Server Actions**，不新建内部 REST。

### 3.5 错误处理

- 数据库异常不静默吞掉：开发期让错误冒泡（Next 错误页），面向用户的位置捕获后给中文提示。
- 不做防御性 `try/catch` 包裹不可能失败的内部调用（见项目总原则：只在系统边界校验）。

---

## 4. TypeScript 规范

1. **禁止 `any`**；确实未知用 `unknown`，用前收窄。

   ```typescript
   // ❌ const data: any = await fetch...
   // ✅
   function parseRow(raw: unknown): Task { ... }
   ```

2. **对象结构优先 `interface`**；联合类型、映射类型、工具类型用 `type`。
3. **类型与业务同域**：任务类型放 `tasks/types.ts`（或 `actions.ts` 顶部），跨域共用的放 `shared/`；禁止建大一统的 `types/index.ts` 巨石文件。
4. 泛型命名：单泛型 `T`，多泛型有意义前缀 `TItem`、`TKey`。
5. 数据库行类型（snake_case 原始行）与 UI 模型（camelCase）**分开命名**：`TaskRow` vs `Task`；只在 `shared/db.ts` 发生转换。
6. 优先用 `as const` + 联合类型表达枚举状态，不引入枚举库。

   ```typescript
   export const KANBAN_COLUMNS = ['planned', 'todo', 'doing', 'review', 'done'] as const;
   export type TaskStatus = (typeof KANBAN_COLUMNS)[number];
   ```

---

## 5. React 组件规范

### 5.1 命名与文件

- 组件文件 **PascalCase.tsx**，与导出的组件同名：`TaskCard.tsx` 导出 `TaskCard`。
- 一个文件一个主组件；小组件可作同文件的局部函数组件，导出复用的单独拆文件。
- 组件目录入口**不用** `index.ts` 中转（业务域内路径已足够短）。

### 5.2 Props

- Props 一律显式 TypeScript 类型，导出 `TaskCardProps` 供复用方参考。

  ```typescript
  export interface TaskCardProps {
    task: Task;
    onOpen?: (id: string) => void;
  }

  export function TaskCard({ task, onOpen }: TaskCardProps) { ... }
  ```

- 可选参数给默认值时不写 `undefined` 样板：`compact = false`。

### 5.3 结构与拆分

- **组合优先**：复用布局用 `children`，不把差异全改成 prop 开关。
- 单组件超过约 150 行或承载两种以上职责时拆分。
- 客户端状态用 `useState` / `useTransition` 就够；本期**不引入**全局状态库（Redux/Zustand 等）——服务端数据以 `actions.ts` + `revalidate` 为准。

### 5.4 交互反馈

- 写动作进行中给 pending 反馈（`useTransition` 的 isPending / 禁用按钮），防重复提交。
- 破坏性操作（删除等，本期暂无）必须二次确认。

---

## 6. 样式规范（Tailwind + SCSS 二者结合）

### 6.1 两入口分工（硬性）

| 入口 | 职责 | 禁止 |
|---|---|---|
| `app/tw.css` | 只放 Tailwind（`@import "tailwindcss"` 及主题扩展） | 不写业务选择器 |
| `app/globals.scss` | 设计令牌（变量/mixin）、基础样式、跨页组件样式 | 不用 Tailwind 指令；**不使用 `@apply`** |

业务内专属复杂样式放该业务域 `styles.scss`，由组件文件 import。

**选边原则**：布局、间距、排版、响应式等一次性组合 → Tailwind 原子类；状态（hover/active/激活态）、复用模式、设计令牌派生 → SCSS。同一个元素上不混两套写同一属性。

### 6.2 Tailwind 使用

- 类名写在 JSX 内，**每行一类**（超长时多行），不压缩成一行长串。
- 颜色、圆角等**必须引用设计令牌**（如 `bg-[var(--surface)]` 或主题扩展类），禁止散落裸色值 `bg-[#fff]`。
- 语义重复出现的类串（如卡片白底描边圆角）抽成共享类或 SCSS mixin，避免同一组合复制 20 处。

### 6.3 SCSS 规则

1. **每个属性独占一行**，禁止多属性挤一行。

   ```scss
   // ✅
   .task-card {
     display: flex;
     align-items: center;
     gap: 10px;
     padding: 12px 16px;
     border: 1px solid var(--border);
     border-radius: 14px;
     background-color: var(--surface);
   }

   // ❌
   .task-card { display: flex; gap: 10px; padding: 12px 16px; }
   ```

2. **属性书写顺序**：
   1. 定位：`position` / `top` / `right` / `bottom` / `left` / `z-index` / `display` / `flex*` / `grid*`
   2. 尺寸：`width` / `height` / `min-*` / `max-*`
   3. 盒模型：`margin` / `padding`
   4. 边框：`border` / `border-radius` / `box-shadow`
   5. 排版：`font-*` / `color` / `line-height` / `text-*`
   6. 背景：`background*`
   7. 其他：`cursor` / `opacity` / `transition` / `transform` / `overflow`

3. **嵌套不超过 3 层**；直接子元素用 `>`，状态修饰用 `&`（`&:hover`、`&.is-active`）。
4. **禁止**：`!important`、ID 选择器（`#x`）、裸色值（必须 `var(--…)` 或 SCSS 变量）。
5. 选择器块内**不写注释**（语义自明）；`tokens.scss` / `mixins.scss` 令牌文件允许注释。
6. 全局变量集中在 `app/globals.scss` 顶部（或 `shared/styles/`），值与 HUB_PLAN §4 设计令牌表一致——**改色只改令牌，不改调用处**。

### 6.4 设计令牌

- 令牌定义一次（CSS 变量 + SCSS 变量双轨），调用处只引用。
- 新增颜色/间距先问：是不是已有令牌的变体？避免令牌表膨胀。

---

## 7. 命名清单速查

| 类型 | 命名 | 示例 |
|---|---|---|
| 路由 URL | kebab-case | `/work-items/[id]` |
| 页面/布局/API 文件 | 保留名 | `page.tsx`、`layout.tsx`、`route.ts` |
| React 组件 | PascalCase.tsx | `ConfirmCard.tsx` |
| 业务域目录 | kebab-case | `work-items/` |
| Server Actions / 查询 | camelCase 动词 | `moveTaskStatus`、`getBoardTasks` |
| 类型/接口 | PascalCase | `TaskStatus`、`WorkArtifact` |
| 数据库列 / seed 字段 | snake_case | `last_synced_at` |
| TS 变量/函数 | camelCase | `taskList` |
| 常量 | UPPER_SNAKE_CASE | `KANBAN_COLUMNS` |
| SCSS 类 | kebab-case 语义 | `.task-card`、`.stage-column` |
| Tailwind 类 | 框架原生 | `flex items-center gap-2` |

---

> **下一步**：[03-Flutter开发规范](./03-Flutter规范.md) — Flutter / Dart 简要约定。
