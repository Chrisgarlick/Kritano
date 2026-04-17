"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpHttpRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("./auth.js");
const audit_tools_js_1 = require("./tools/audit-tools.js");
const finding_tools_js_1 = require("./tools/finding-tools.js");
const site_tools_js_1 = require("./tools/site-tools.js");
const analytics_tools_js_1 = require("./tools/analytics-tools.js");
const compliance_tools_js_1 = require("./tools/compliance-tools.js");
const export_tools_js_1 = require("./tools/export-tools.js");
const gsc_tools_js_1 = require("./tools/gsc-tools.js");
// Active sessions: sessionId -> { transport, server }
const sessions = new Map();
// Clean up stale sessions after 30 minutes of inactivity
const SESSION_TTL_MS = 30 * 60 * 1000;
const sessionLastActive = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [id, lastActive] of sessionLastActive.entries()) {
        if (now - lastActive > SESSION_TTL_MS) {
            const session = sessions.get(id);
            if (session) {
                session.transport.close().catch(() => { });
            }
            sessions.delete(id);
            sessionLastActive.delete(id);
        }
    }
}, 60_000);
/**
 * Extract API key from Authorization header (Bearer token)
 */
function extractApiKey(req) {
    const auth = req.headers.authorization;
    if (!auth)
        return null;
    const [scheme, token] = auth.split(' ', 2);
    if (scheme?.toLowerCase() !== 'bearer' || !token)
        return null;
    return token;
}
exports.mcpHttpRouter = (0, express_1.Router)();
// Prevent search engines from indexing MCP responses
exports.mcpHttpRouter.use((_req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
});
// Handle POST /mcp (main MCP endpoint - initialize + messages)
exports.mcpHttpRouter.post('/', async (req, res) => {
    const apiKey = extractApiKey(req);
    if (!apiKey) {
        res.status(401).json({ error: 'Missing Authorization header. Use: Bearer <your-api-key>' });
        return;
    }
    // Check for existing session
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId && sessions.has(sessionId)) {
        // Existing session - forward the request
        const session = sessions.get(sessionId);
        sessionLastActive.set(sessionId, Date.now());
        await session.transport.handleRequest(req, res, req.body);
        return;
    }
    if (sessionId && !sessions.has(sessionId)) {
        // Invalid session ID
        res.status(404).json({ error: 'Session not found. Initialize a new session.' });
        return;
    }
    // New session - authenticate and create server
    try {
        const ctx = await (0, auth_js_1.authenticateMcp)(index_js_1.pool, apiKey);
        const server = new mcp_js_1.McpServer({
            name: 'kritano',
            version: '1.0.0',
        });
        (0, audit_tools_js_1.registerAuditTools)(server, index_js_1.pool, ctx);
        (0, finding_tools_js_1.registerFindingTools)(server, index_js_1.pool, ctx);
        (0, site_tools_js_1.registerSiteTools)(server, index_js_1.pool, ctx);
        (0, analytics_tools_js_1.registerAnalyticsTools)(server, index_js_1.pool, ctx);
        (0, compliance_tools_js_1.registerComplianceTools)(server, index_js_1.pool, ctx);
        (0, export_tools_js_1.registerExportTools)(server, index_js_1.pool, ctx);
        (0, gsc_tools_js_1.registerGscTools)(server, index_js_1.pool, ctx);
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: () => (0, crypto_1.randomUUID)(),
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
            sessions.set(newSessionId, { transport, server });
            sessionLastActive.set(newSessionId, Date.now());
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        res.status(401).json({ error: message });
    }
});
// Handle GET /mcp (SSE stream for server-initiated messages)
exports.mcpHttpRouter.get('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !sessions.has(sessionId)) {
        res.status(404).json({ error: 'Session not found. Initialize via POST first.' });
        return;
    }
    const session = sessions.get(sessionId);
    sessionLastActive.set(sessionId, Date.now());
    await session.transport.handleRequest(req, res);
});
// Handle DELETE /mcp (session termination)
exports.mcpHttpRouter.delete('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !sessions.has(sessionId)) {
        res.status(404).json({ error: 'Session not found.' });
        return;
    }
    const session = sessions.get(sessionId);
    await session.transport.close();
    sessions.delete(sessionId);
    sessionLastActive.delete(sessionId);
    res.status(200).json({ ok: true });
});
//# sourceMappingURL=http.js.map