// ============================================================
// Orbit Hub MCP Server（Streamable HTTP 传输）。
//
// POST /api/mcp 接收 JSON-RPC 2.0（单条或 batch），返回 application/json
// ——MCP Streamable HTTP 规范允许的无状态形态（不开 SSE 流）。
// 工具定义与分发逻辑复用 mcp/core.mts，与 stdio 传输（mcp/server.mts）完全一致。
//
// 鉴权：在 .env.local 配置 MCP_TOKEN 后，请求必须带
// Authorization: Bearer <MCP_TOKEN>；未配置时不做鉴权（仅限本机使用）。
// 客户端配置见 mcp/README.md。
// ============================================================

import { dispatch, type JsonRpcRequest } from '@/mcp/core.mts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 统一包装 JSON-RPC 响应：result 或带 code 的 error。 */
async function handleOne(request: JsonRpcRequest): Promise<unknown | null> {
  // 通知（无 id）不回包。
  if (request.id === undefined || request.id === null) {
    await dispatch(request.method, request.params ?? {}).catch(() => undefined);
    return null;
  }
  try {
    const result = await dispatch(request.method, request.params ?? {});
    return { jsonrpc: '2.0', id: request.id, result };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { code?: number };
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: typeof err.code === 'number' ? err.code : -32603,
        message: err.message,
      },
    };
  }
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.MCP_TOKEN;
  if (token) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${token}`) {
      return Response.json(
        { error: 'unauthorized：请携带 Authorization: Bearer <MCP_TOKEN>' },
        { status: 401 },
      );
    }
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: '解析错误：请求体不是合法 JSON' } },
      { status: 400 },
    );
  }

  const requests = Array.isArray(body) ? body : [body];
  const responses = (await Promise.all(requests.map(handleOne))).filter(
    (item) => item !== null,
  );

  // batch 全是通知时按规范不返回 body。
  if (responses.length === 0) {
    return new Response(null, { status: 202 });
  }
  return Response.json(Array.isArray(body) ? responses : responses[0]);
}

/** Streamable HTTP 允许服务端不提供 SSE 通道，明确拒绝并告知原因。 */
export function GET(): Response {
  return Response.json(
    { error: '本端点为无状态 Streamable HTTP，仅支持 POST；请用 POST 发送 JSON-RPC 请求' },
    { status: 405 },
  );
}
