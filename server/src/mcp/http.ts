import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { pool } from '../db/index.js';
import { authenticateMcp, type McpContext } from './auth.js';
import { registerAuditTools } from './tools/audit-tools.js';
import { registerFindingTools } from './tools/finding-tools.js';
import { registerSiteTools } from './tools/site-tools.js';
import { registerAnalyticsTools } from './tools/analytics-tools.js';
import { registerComplianceTools } from './tools/compliance-tools.js';
import { registerExportTools } from './tools/export-tools.js';
import { registerGscTools } from './tools/gsc-tools.js';

interface Session {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  resolveCtx: (ctx: McpContext) => void;
  authenticated: boolean;
}

// Active sessions: sessionId -> session
const sessions = new Map<string, Session>();

// Clean up stale sessions after 30 minutes of inactivity
const SESSION_TTL_MS = 30 * 60 * 1000;
const sessionLastActive = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [id, lastActive] of sessionLastActive.entries()) {
    if (now - lastActive > SESSION_TTL_MS) {
      const session = sessions.get(id);
      if (session) {
        session.transport.close().catch(() => {});
      }
      sessions.delete(id);
      sessionLastActive.delete(id);
    }
  }
}, 60_000);

/**
 * Extract API key from Authorization header (Bearer token)
 */
function extractApiKey(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [scheme, token] = auth.split(' ', 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Create a deferred McpContext proxy.
 * Tools receive this as a normal McpContext, but property access throws
 * until resolve() is called with a real authenticated context.
 * This allows the MCP initialize handshake to complete without auth,
 * deferring authentication to the first tool call.
 */
function createDeferredContext(): { proxy: McpContext; resolve: (ctx: McpContext) => void } {
  let real: McpContext | null = null;
  const proxy = new Proxy({} as McpContext, {
    get(_target, prop: string) {
      if (!real) {
        throw new Error(
          'Authentication required. Provide an Authorization header with your API key: Bearer <your-api-key>'
        );
      }
      return (real as unknown as Record<string, unknown>)[prop];
    },
  });
  return { proxy, resolve: (ctx: McpContext) => { real = ctx; } };
}

export const mcpHttpRouter = Router();

// Prevent search engines from indexing MCP responses
mcpHttpRouter.use((_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// Handle POST /mcp (main MCP endpoint - initialize + messages)
mcpHttpRouter.post('/', async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    // Existing session - lazily authenticate if Bearer token present
    const session = sessions.get(sessionId)!;
    sessionLastActive.set(sessionId, Date.now());

    if (!session.authenticated && apiKey) {
      try {
        const ctx = await authenticateMcp(pool, apiKey);
        session.resolveCtx(ctx);
        session.authenticated = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        res.status(401).json({ error: message });
        return;
      }
    }

    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  if (sessionId && !sessions.has(sessionId)) {
    // Invalid session ID
    res.status(404).json({ error: 'Session not found. Initialize a new session.' });
    return;
  }

  // New session - auth is deferred; initialize handshake does not require a key
  try {
    const { proxy: ctx, resolve: resolveCtx } = createDeferredContext();
    let authenticated = false;

    // If API key provided on init, authenticate immediately
    if (apiKey) {
      const realCtx = await authenticateMcp(pool, apiKey);
      resolveCtx(realCtx);
      authenticated = true;
    }

    const server = new McpServer({
      name: 'kritano',
      version: '1.0.0',
    });

    registerAuditTools(server, pool, ctx);
    registerFindingTools(server, pool, ctx);
    registerSiteTools(server, pool, ctx);
    registerAnalyticsTools(server, pool, ctx);
    registerComplianceTools(server, pool, ctx);
    registerExportTools(server, pool, ctx);
    registerGscTools(server, pool, ctx);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Clean up on close
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        sessions.delete(sid);
        sessionLastActive.delete(sid);
      }
    };

    await server.connect(transport);

    // Store session after connect (sessionId is set during handleRequest for init)
    // We need to handle the request first, then store
    await transport.handleRequest(req, res, req.body);

    // Now the session ID is set
    const newSessionId = transport.sessionId;
    if (newSessionId) {
      sessions.set(newSessionId, { transport, server, resolveCtx, authenticated });
      sessionLastActive.set(newSessionId, Date.now());
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

// Handle GET /mcp (SSE stream for server-initiated messages)
mcpHttpRouter.get('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(404).json({ error: 'Session not found. Initialize via POST first.' });
    return;
  }

  const session = sessions.get(sessionId)!;
  sessionLastActive.set(sessionId, Date.now());
  await session.transport.handleRequest(req, res);
});

// Handle DELETE /mcp (session termination)
mcpHttpRouter.delete('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }

  const session = sessions.get(sessionId)!;
  await session.transport.close();
  sessions.delete(sessionId);
  sessionLastActive.delete(sessionId);
  res.status(200).json({ ok: true });
});

// ── SSE Transport (legacy, used by clients that don't support Streamable HTTP) ──

// SSE sessions: sessionId -> transport
const sseSessions = new Map<string, SSEServerTransport>();

// GET /mcp/sse — establish SSE stream (client connects here first)
mcpHttpRouter.get('/sse', async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    res.status(401).json({ error: 'Missing Authorization header. Use: Bearer <your-api-key>' });
    return;
  }

  try {
    const ctx = await authenticateMcp(pool, apiKey);

    const server = new McpServer({
      name: 'kritano',
      version: '1.0.0',
    });

    registerAuditTools(server, pool, ctx);
    registerFindingTools(server, pool, ctx);
    registerSiteTools(server, pool, ctx);
    registerAnalyticsTools(server, pool, ctx);
    registerComplianceTools(server, pool, ctx);
    registerExportTools(server, pool, ctx);
    registerGscTools(server, pool, ctx);

    // The message endpoint path is relative to the SSE endpoint
    const transport = new SSEServerTransport('/mcp/sse/message', res);

    transport.onclose = () => {
      sseSessions.delete(transport.sessionId);
    };

    sseSessions.set(transport.sessionId, transport);

    await server.connect(transport);
    // start() begins streaming SSE events; the response stays open
    await transport.start();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    if (!res.headersSent) {
      res.status(401).json({ error: message });
    }
  }
});

// POST /mcp/sse/message — client sends JSON-RPC messages here
mcpHttpRouter.post('/sse/message', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;

  if (!sessionId || !sseSessions.has(sessionId)) {
    res.status(404).json({ error: 'SSE session not found. Connect via GET /mcp/sse first.' });
    return;
  }

  const transport = sseSessions.get(sessionId)!;
  await transport.handlePostMessage(req, res, req.body);
});
