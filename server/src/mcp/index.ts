import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { pool, testConnection } from '../db/index.js';
import { authenticateMcp } from './auth.js';
import { registerAuditTools } from './tools/audit-tools.js';
import { registerFindingTools } from './tools/finding-tools.js';
import { registerSiteTools } from './tools/site-tools.js';
import { registerAnalyticsTools } from './tools/analytics-tools.js';
import { registerComplianceTools } from './tools/compliance-tools.js';
import { registerExportTools } from './tools/export-tools.js';
import { registerGscTools } from './tools/gsc-tools.js';

export async function createMcpServer(): Promise<McpServer> {
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Failed to connect to the database. Check DATABASE_URL.');
  }

  // Authenticate via API key
  const ctx = await authenticateMcp(pool);

  // Create MCP server
  const server = new McpServer({
    name: 'kritano',
    version: '1.0.0',
  });

  // Register all tools
  registerAuditTools(server, pool, ctx);
  registerFindingTools(server, pool, ctx);
  registerSiteTools(server, pool, ctx);
  registerAnalyticsTools(server, pool, ctx);
  registerComplianceTools(server, pool, ctx);
  registerExportTools(server, pool, ctx);
  registerGscTools(server, pool, ctx);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
  });

  return server;
}
