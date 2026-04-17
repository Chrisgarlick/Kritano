import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { McpContext } from '../auth.js';
import { requireScope } from '../auth.js';
import { formatScore, formatSeverity, formatDate, truncate } from '../utils/formatting.js';

export function registerExportTools(server: McpServer, pool: Pool, ctx: McpContext): void {

  // ── export_findings_csv ──────────────────────────────────────
  server.tool(
    'export_findings_csv',
    'Export all findings for an audit as CSV data. Returns the CSV content directly.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
      category: z.enum(['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data']).optional().describe('Filter by category'),
    },
    async ({ audit_id, category }) => {
      try {
        requireScope(ctx, 'exports:read');

        const auditCheck = await pool.query(
          `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );
        if (auditCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
        }

        const params: any[] = [audit_id];
        let query = `
          SELECT f.rule_id, f.rule_name, f.category, f.severity, f.message,
                 f.wcag_criteria, f.selector, f.device_type, p.url as page_url
          FROM audit_findings f
          LEFT JOIN audit_pages p ON f.audit_page_id = p.id
          WHERE f.audit_job_id = $1
        `;

        if (category) {
          params.push(category);
          query += ` AND f.category = $${params.length}`;
        }

        query += ` ORDER BY
          CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
          f.category, f.rule_name`;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: 'No findings to export.' }] };
        }

        // Build CSV
        const headers = ['Rule ID', 'Rule Name', 'Category', 'Severity', 'Message', 'WCAG Criteria', 'Selector', 'Device', 'Page URL'];
        const csvLines = [headers.join(',')];

        for (const f of result.rows) {
          const row = [
            f.rule_id,
            `"${(f.rule_name || '').replace(/"/g, '""')}"`,
            f.category,
            f.severity,
            `"${(f.message || '').replace(/"/g, '""')}"`,
            `"${(f.wcag_criteria || []).join('; ')}"`,
            `"${(f.selector || '').replace(/"/g, '""')}"`,
            f.device_type || 'desktop',
            f.page_url || '',
          ];
          csvLines.push(row.join(','));
        }

        return {
          content: [{
            type: 'text',
            text: `CSV export (${result.rows.length} findings):\n\n${csvLines.join('\n')}`,
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── export_findings_json ─────────────────────────────────────
  server.tool(
    'export_findings_json',
    'Export all findings for an audit as structured JSON data.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
      category: z.enum(['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data']).optional().describe('Filter by category'),
    },
    async ({ audit_id, category }) => {
      try {
        requireScope(ctx, 'exports:read');

        const auditCheck = await pool.query(
          `SELECT id, target_url, target_domain, seo_score, accessibility_score, security_score,
                  performance_score, content_score, completed_at
           FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );
        if (auditCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
        }

        const params: any[] = [audit_id];
        let query = `
          SELECT f.id, f.rule_id, f.rule_name, f.category, f.severity, f.message,
                 f.description, f.recommendation, f.wcag_criteria, f.selector,
                 f.snippet, f.help_url, f.device_type, p.url as page_url
          FROM audit_findings f
          LEFT JOIN audit_pages p ON f.audit_page_id = p.id
          WHERE f.audit_job_id = $1
        `;

        if (category) {
          params.push(category);
          query += ` AND f.category = $${params.length}`;
        }

        query += ` ORDER BY
          CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END`;

        const result = await pool.query(query, params);

        const audit = auditCheck.rows[0];
        const output = {
          audit: {
            id: audit.id,
            url: audit.target_url,
            domain: audit.target_domain,
            scores: {
              seo: audit.seo_score,
              accessibility: audit.accessibility_score,
              security: audit.security_score,
              performance: audit.performance_score,
              content: audit.content_score,
            },
            completedAt: audit.completed_at,
          },
          findings: result.rows.map(f => ({
            id: f.id,
            ruleId: f.rule_id,
            ruleName: f.rule_name,
            category: f.category,
            severity: f.severity,
            message: f.message,
            description: f.description,
            recommendation: f.recommendation,
            wcagCriteria: f.wcag_criteria,
            selector: f.selector,
            snippet: f.snippet,
            helpUrl: f.help_url,
            deviceType: f.device_type,
            pageUrl: f.page_url,
          })),
          total: result.rows.length,
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(output, null, 2),
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );
}
