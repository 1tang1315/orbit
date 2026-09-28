'use client';

import { useTransition } from 'react';

/**
 * 复习写动作签名。
 *
 * 动作本身（actions.ts 的 reviewCard）由服务端组件导入后经 props 下传：
 * actions.ts 内部 import 了 @/lib/db（→ node:sqlite），client 组件若直接
 * import 该模块，存在把 Node 内置模块打进浏览器包的风险（开发规范 02 §3.4
 * 「Server Action 经 props 下传」的用法）。
 */
export type ReviewHandler = (cardId: string, result: 'again' | 'mastered') => Promise<void>;

export interface ReviewActionsProps {
  /** 当前复习卡 id（跨边界只传可序列化数据）。 */
  cardId: string;
  /** Server Action 引用，由 ReviewStage（服务端）传入。 */
  onReview: ReviewHandler;
}

/**
 * 复习卡操作按钮（客户端叶子）：「再复习」「已掌握」。
 *
 * 调用传入的 Server Action 后由 revalidatePath('/review') 触发路由刷新，
 * 进度与队列立即更新；pending 期间禁用防重复提交。
 */
export function ReviewActions({ cardId, onReview }: ReviewActionsProps) {
  const [isPending, startTransition] = useTransition();

  const run = (result: 'again' | 'mastered'): void => {
    if (isPending) {
      return;
    }
    startTransition(() => {
      onReview(cardId, result).catch((error: unknown) => {
        // 服务端校验失败时给中文提示，不让失败静默（02 规范 §3.5）
        const message = error instanceof Error ? error.message : '复习失败，请稍后重试';
        window.alert(message);
      });
    });
  };

  return (
    <>
      <button type="button" className="btn" disabled={isPending} onClick={() => run('again')}>
        再复习
      </button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => run('mastered')}
      >
        已掌握
      </button>
    </>
  );
}
