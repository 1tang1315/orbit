#!/usr/bin/env node
// ============================================================
// Orbit Hub MCP Server（stdio 传输）。
//
// 让外部 Agent（ZCode / Claude / Cursor 等）通过 MCP 协议读取中枢
// 已接入的项目数据，并把「原 App 内置 AI 功能」的分析结论写回中枢。
// 工具定义与 JSON-RPC 分发在 ./core.mts（与 HTTP 传输共享）；
// 若中枢 Next.js 服务已在线，推荐用 HTTP 端点 /api/mcp（见 mcp/README.md）。
//
// 实现：手写 MCP stdio 传输（按行分隔的 JSON-RPC 2.0），零第三方依赖。
// ============================================================

import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { dispatch, type JsonRpcRequest } from './core.mts';

function main(): void {
  // lib/db.ts 以 process.cwd() 定位 .data/hub.sqlite：
  // 无论客户端用什么 cwd 拉起本服务，先切到 hub 根目录（本文件在 <hub>/mcp/ 下）。
  process.chdir(fileURLToPath(new URL('..', import.meta.url)));
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    let request: JsonRpcRequest;
    try {
      request = JSON.parse(trimmed) as JsonRpcRequest;
    } catch {
      return;
    }
    // 通知（无 id）不回包；请求按 JSON-RPC 2.0 返回 result 或 error。
    if (request.id === undefined || request.id === null) {
      return;
    }
    void dispatch(request.method, request.params ?? {}).then(
      (result) => {
        writeMessage({ jsonrpc: '2.0', id: request.id, result });
      },
      (error: NodeJS.ErrnoException & { code?: number }) => {
        writeMessage({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: typeof error.code === 'number' ? error.code : -32603,
            message: error.message,
          },
        });
      },
    );
  });
  rl.on('close', () => {
    process.exit(0);
  });
}

function writeMessage(message: unknown): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

main();
