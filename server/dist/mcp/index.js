"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = createMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("./auth.js");
const audit_tools_js_1 = require("./tools/audit-tools.js");
const finding_tools_js_1 = require("./tools/finding-tools.js");
const site_tools_js_1 = require("./tools/site-tools.js");
const analytics_tools_js_1 = require("./tools/analytics-tools.js");
const compliance_tools_js_1 = require("./tools/compliance-tools.js");
const export_tools_js_1 = require("./tools/export-tools.js");
const gsc_tools_js_1 = require("./tools/gsc-tools.js");
async function createMcpServer() {
    // Test database connection
    const connected = await (0, index_js_1.testConnection)();
    if (!connected) {
        throw new Error('Failed to connect to the database. Check DATABASE_URL.');
    }
    // Authenticate via API key
    const ctx = await (0, auth_js_1.authenticateMcp)(index_js_1.pool);
    // Create MCP server
    const server = new mcp_js_1.McpServer({
        name: 'kritano',
        version: '1.0.0',
    });
    // Register all tools
    (0, audit_tools_js_1.registerAuditTools)(server, index_js_1.pool, ctx);
    (0, finding_tools_js_1.registerFindingTools)(server, index_js_1.pool, ctx);
    (0, site_tools_js_1.registerSiteTools)(server, index_js_1.pool, ctx);
    (0, analytics_tools_js_1.registerAnalyticsTools)(server, index_js_1.pool, ctx);
    (0, compliance_tools_js_1.registerComplianceTools)(server, index_js_1.pool, ctx);
    (0, export_tools_js_1.registerExportTools)(server, index_js_1.pool, ctx);
    (0, gsc_tools_js_1.registerGscTools)(server, index_js_1.pool, ctx);
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await index_js_1.pool.end();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await index_js_1.pool.end();
        process.exit(0);
    });
    return server;
}
//# sourceMappingURL=index.js.map