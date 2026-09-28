'use client';

import { useTransition } from 'react';

export interface AcceptButtonProps {
  confirmationId: string;
  taskId: string;
  /**
   * Server Action `acceptConfirmation` 的引用：由服务端 ConfirmCard import 后经 props 下传
   * （客户端组件不得直接 import actions.ts，避免把 node:sqlite 打进浏览器包）。
   */
  onAccept: (confirmationId: string, taskId: string) => Promise<void>;
}

/**
 * 「采纳默认建议」主按钮：调传入的 Server Action `acceptConfirmation`，
 * useTransition 的 isPending 提供防重复提交与「采纳中…」反馈。
 */
export function AcceptButton({ confirmationId, taskId, onAccept }: AcceptButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await onAccept(confirmationId, taskId);
      } catch (error: unknown) {
        window.alert(
          error instanceof Error ? error.message : '采纳失败，请稍后再试',
        );
      }
    });
  }

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? '采纳中…' : '采纳默认建议'}
    </button>
  );
}
