import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { McpContext } from '../auth.js';
import { requireScope } from '../auth.js';
import { formatScore, formatScoresBlock, formatDate, formatStatus, formatNumber } from '../utils/formatting.js';
import type { AuditJob } from '../../types/audit.types.js';
import { RATE_LIMIT_TIERS } from '../../services/apiKey.service.js';

export function registerAuditTools(server: McpServer, pool: Pool, ctx: McpContext): void {

  // ── start_audit ──────────────────────────────────────────────
  server.tool(
    'start_audit',
    'Start a new website audit. This will create a real audit job that counts against your monthly quota. The audit runs asynchronously -- use get_audit to check progress.',
    {
      url: z.string().url().describe('The URL to audit (e.g. https://example.com)'),
      max_pages: z.number().int().min(1).max(1000).optional().describe('Maximum pages to crawl (default: 100)'),
      max_depth: z.number().int().min(1).max(10).optional().describe('Maximum crawl depth (default: 5)'),
      checks: z.array(z.enum(['seo', 'accessibility', 'security', 'performance', 'content', 'file-extraction']))
        .optional()
        .describe('Which checks to run (default: all standard checks)'),
      include_mobile: z.boolean().optional().describe('Include mobile audit pass (default: true)'),
    },
    async ({ url, max_pages, max_depth, checks, include_mobile }) => {
      try {
        requireScope(ctx, 'audits:write');

        // Validate URL
        let targetUrl: URL;
        try {
          targetUrl = new URL(url);
        } catch {
          return { content: [{ type: 'text', text: 'Invalid URL format. Please provide a full URL like https://example.com' }] };
        }

        const targetDomain = targetUrl.hostname.replace(/^www\./, '');

        // Check concurrent audit limit
        const activeAudits = await pool.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')`,
          [ctx.userId]
        );

        const activeCount = parseInt(activeAudits.rows[0].count, 10);
        if (activeCount >= ctx.rateLimits.concurrentAudits) {
          return {
            content: [{
              type: 'text',
              text: `Concurrent audit limit reached (${activeCount}/${ctx.rateLimits.concurrentAudits}). Wait for existing audits to complete, or upgrade your plan.`,
            }],
          };
        }

        const selectedChecks = checks || ['seo', 'accessibility', 'security', 'performance', 'content'];
        const mobile = include_mobile !== false;

        const result = await pool.query<AuditJob>(`
          INSERT INTO audit_jobs (
            user_id, target_url, target_domain,
            max_pages, max_depth, respect_robots_txt, include_subdomains,
            check_seo, check_accessibility, check_security, check_performance, check_content,
            check_file_extraction, include_mobile
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          ctx.userId,
          targetUrl.toString(),
          targetDomain,
          max_pages ?? 100,
          max_depth ?? 5,
          true,
          false,
          selectedChecks.includes('seo'),
          selectedChecks.includes('accessibility'),
          selectedChecks.includes('security'),
          selectedChecks.includes('performance'),
          selectedChecks.includes('content'),
          selectedChecks.includes('file-extraction'),
          mobile,
        ]);

        const audit = result.rows[0];

        return {
          content: [{
            type: 'text',
            text: [
              `Audit started successfully.`,
              ``,
              `ID: ${audit.id}`,
              `URL: ${audit.target_url}`,
              `Domain: ${audit.target_domain}`,
              `Status: ${formatStatus(audit.status)}`,
              `Max pages: ${audit.max_pages}`,
              `Max depth: ${audit.max_depth}`,
              `Checks: ${selectedChecks.join(', ')}`,
              `Mobile: ${mobile ? 'Yes' : 'No'}`,
              ``,
              `Use get_audit with ID "${audit.id}" to check progress.`,
            ].join('\n'),
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_audit ────────────────────────────────────────────────
  server.tool(
    'get_audit',
    'Get the status, scores, and summary for a specific audit by ID.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
    },
    async ({ audit_id }) => {
      try {
        requireScope(ctx, 'audits:read');

        const result = await pool.query<AuditJob>(
          `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found or not accessible with your API key.` }] };
        }

        const a = result.rows[0];

        // Get unique issue counts by severity
        const severityCounts = await pool.query<{ severity: string; count: string }>(
          `SELECT severity, COUNT(DISTINCT rule_id) as count FROM audit_findings WHERE audit_job_id = $1 GROUP BY severity ORDER BY
            CASE severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END`,
          [audit_id]
        );

        const sevMap: Record<string, number> = {};
        let uniqueTotal = 0;
        for (const row of severityCounts.rows) {
          sevMap[row.severity] = parseInt(row.count, 10);
          uniqueTotal += parseInt(row.count, 10);
        }

        const lines = [
          `Audit #${a.id.substring(0, 8)} -- ${a.target_url}`,
          `Status: ${formatStatus(a.status)}`,
          `Started: ${formatDate(a.started_at)} | Finished: ${formatDate(a.completed_at)}`,
          `Pages crawled: ${a.pages_crawled}/${a.max_pages}`,
        ];

        if (a.status === 'completed' || a.seo_score !== null) {
          lines.push('');
          lines.push('Scores:');
          lines.push(formatScoresBlock(a));
        }

        if (uniqueTotal > 0) {
          lines.push('');
          const parts = [];
          if (sevMap.critical) parts.push(`${sevMap.critical} critical`);
          if (sevMap.serious) parts.push(`${sevMap.serious} serious`);
          if (sevMap.moderate) parts.push(`${sevMap.moderate} moderate`);
          if (sevMap.minor) parts.push(`${sevMap.minor} minor`);
          if (sevMap.info) parts.push(`${sevMap.info} info`);
          lines.push(`Issues: ${uniqueTotal} unique (${parts.join(', ')})`);
        }

        if (a.status === 'failed' && a.error_message) {
          lines.push('');
          lines.push(`Error: ${a.error_message}`);
        }

        if (a.status === 'processing' || a.status === 'discovering') {
          lines.push('');
          lines.push(`Progress: ${a.pages_audited} pages audited`);
          if (a.current_url) {
            lines.push(`Currently processing: ${a.current_url}`);
          }
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── list_audits ──────────────────────────────────────────────
  server.tool(
    'list_audits',
    'List your recent audits with their status and scores. Supports filtering by status and domain.',
    {
      status: z.enum(['pending', 'discovering', 'ready', 'processing', 'completed', 'failed', 'cancelled']).optional().describe('Filter by audit status'),
      domain: z.string().optional().describe('Filter by target domain'),
      limit: z.number().int().min(1).max(50).optional().describe('Max results to return (default: 10)'),
    },
    async ({ status, domain, limit }) => {
      try {
        requireScope(ctx, 'audits:read');

        const limitNum = limit ?? 10;
        const params: any[] = [ctx.userId];
        let query = `
          SELECT id, target_url, target_domain, status,
                 pages_found, pages_crawled, pages_audited,
                 total_issues, critical_issues,
                 seo_score, accessibility_score, security_score, performance_score, content_score,
                 started_at, completed_at, created_at
          FROM audit_jobs
          WHERE user_id = $1
        `;

        if (status) {
          params.push(status);
          query += ` AND status = $${params.length}`;
        }
        if (domain) {
          params.push(domain);
          query += ` AND target_domain = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limitNum);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: 'No audits found matching your criteria.' }] };
        }

        // Get total count
        let countQuery = `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1`;
        const countParams: any[] = [ctx.userId];
        if (status) { countParams.push(status); countQuery += ` AND status = $${countParams.length}`; }
        if (domain) { countParams.push(domain); countQuery += ` AND target_domain = $${countParams.length}`; }
        const countResult = await pool.query<{ count: string }>(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count, 10);

        const lines = [`Audits (showing ${result.rows.length} of ${total})`, ''];

        for (const a of result.rows) {
          const scores = a.status === 'completed'
            ? `SEO: ${formatScore(a.seo_score)} | A11y: ${formatScore(a.accessibility_score)} | Sec: ${formatScore(a.security_score)} | Perf: ${formatScore(a.performance_score)}`
            : '';

          lines.push(`${a.id}  ${formatStatus(a.status).padEnd(14)}  ${a.target_domain}`);
          if (scores) lines.push(`         ${scores}`);
          if (a.status === 'completed') {
            lines.push(`         Issues: ${a.total_issues} total, ${a.critical_issues} critical | ${formatDate(a.completed_at)}`);
          } else {
            lines.push(`         Created: ${formatDate(a.created_at)}`);
          }
          lines.push('');
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_audit_progress ───────────────────────────────────────
  server.tool(
    'get_audit_progress',
    'Get real-time progress of a running audit -- pages discovered, crawled, audited, and current URL.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
    },
    async ({ audit_id }) => {
      try {
        requireScope(ctx, 'audits:read');

        const result = await pool.query(
          `SELECT status, pages_found, pages_crawled, pages_audited, current_url, max_pages,
                  total_issues, critical_issues, started_at
           FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
        }

        const a = result.rows[0];
        const elapsed = a.started_at ? Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000) : 0;

        const lines = [
          `Status: ${formatStatus(a.status)}`,
          `Pages: ${a.pages_found} found, ${a.pages_crawled} crawled, ${a.pages_audited} audited (max: ${a.max_pages})`,
          `Issues so far: ${a.total_issues} total, ${a.critical_issues} critical`,
          `Elapsed: ${elapsed}s`,
        ];

        if (a.current_url) {
          lines.push(`Currently: ${a.current_url}`);
        }

        if (a.status === 'completed' || a.status === 'failed' || a.status === 'cancelled') {
          lines.push(`\nThis audit has finished. Use get_audit for full results.`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── cancel_audit ─────────────────────────────────────────────
  server.tool(
    'cancel_audit',
    'Cancel a running or pending audit. Only audits in pending/discovering/ready/processing status can be cancelled.',
    {
      audit_id: z.string().uuid().describe('The audit job ID to cancel'),
    },
    async ({ audit_id }) => {
      try {
        requireScope(ctx, 'audits:write');

        const result = await pool.query(
          `UPDATE audit_jobs
           SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'discovering', 'ready', 'processing')
           RETURNING id, target_url, status`,
          [audit_id, ctx.userId]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found or cannot be cancelled (may already be completed/cancelled).` }] };
        }

        return { content: [{ type: 'text', text: `Audit for ${result.rows[0].target_url} has been cancelled.` }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── compare_audits ───────────────────────────────────────────
  server.tool(
    'compare_audits',
    'Compare two completed audits side-by-side -- shows score deltas, new issues, and fixed issues.',
    {
      audit_id_before: z.string().uuid().describe('The older audit ID (baseline)'),
      audit_id_after: z.string().uuid().describe('The newer audit ID (comparison)'),
    },
    async ({ audit_id_before, audit_id_after }) => {
      try {
        requireScope(ctx, 'audits:read');

        const result = await pool.query<AuditJob>(
          `SELECT * FROM audit_jobs WHERE id = ANY($1) AND user_id = $2`,
          [[audit_id_before, audit_id_after], ctx.userId]
        );

        if (result.rows.length < 2) {
          return { content: [{ type: 'text', text: 'One or both audits not found. Both must be accessible with your API key.' }] };
        }

        const before = result.rows.find(r => r.id === audit_id_before)!;
        const after = result.rows.find(r => r.id === audit_id_after)!;

        if (before.status !== 'completed' || after.status !== 'completed') {
          return { content: [{ type: 'text', text: 'Both audits must be completed to compare.' }] };
        }

        const delta = (a: number | null, b: number | null) => {
          if (a === null || b === null) return 'N/A';
          const diff = Math.round(b) - Math.round(a);
          return diff > 0 ? `+${diff}` : `${diff}`;
        };

        // Get unique rule counts for each audit
        const [beforeRules, afterRules] = await Promise.all([
          pool.query<{ rule_id: string; severity: string }>(
            `SELECT DISTINCT rule_id, severity FROM audit_findings WHERE audit_job_id = $1`,
            [audit_id_before]
          ),
          pool.query<{ rule_id: string; severity: string }>(
            `SELECT DISTINCT rule_id, severity FROM audit_findings WHERE audit_job_id = $1`,
            [audit_id_after]
          ),
        ]);

        const beforeRuleIds = new Set(beforeRules.rows.map(r => r.rule_id));
        const afterRuleIds = new Set(afterRules.rows.map(r => r.rule_id));

        const newIssues = afterRules.rows.filter(r => !beforeRuleIds.has(r.rule_id));
        const fixedIssues = beforeRules.rows.filter(r => !afterRuleIds.has(r.rule_id));

        const lines = [
          `Audit Comparison`,
          `Before: ${before.target_url} (${formatDate(before.completed_at)})`,
          `After:  ${after.target_url} (${formatDate(after.completed_at)})`,
          '',
          'Score Changes:',
          `  SEO:            ${formatScore(before.seo_score)} -> ${formatScore(after.seo_score)} (${delta(before.seo_score, after.seo_score)})`,
          `  Accessibility:  ${formatScore(before.accessibility_score)} -> ${formatScore(after.accessibility_score)} (${delta(before.accessibility_score, after.accessibility_score)})`,
          `  Security:       ${formatScore(before.security_score)} -> ${formatScore(after.security_score)} (${delta(before.security_score, after.security_score)})`,
          `  Performance:    ${formatScore(before.performance_score)} -> ${formatScore(after.performance_score)} (${delta(before.performance_score, after.performance_score)})`,
          `  Content:        ${formatScore(before.content_score)} -> ${formatScore(after.content_score)} (${delta(before.content_score, after.content_score)})`,
          '',
          `Pages: ${before.pages_crawled} -> ${after.pages_crawled}`,
          `Unique issues: ${beforeRuleIds.size} -> ${afterRuleIds.size}`,
        ];

        if (newIssues.length > 0) {
          lines.push('');
          lines.push(`New issues (${newIssues.length}):`);
          for (const issue of newIssues.slice(0, 10)) {
            lines.push(`  [${issue.severity.toUpperCase()}] ${issue.rule_id}`);
          }
          if (newIssues.length > 10) lines.push(`  ... and ${newIssues.length - 10} more`);
        }

        if (fixedIssues.length > 0) {
          lines.push('');
          lines.push(`Fixed issues (${fixedIssues.length}):`);
          for (const issue of fixedIssues.slice(0, 10)) {
            lines.push(`  [${issue.severity.toUpperCase()}] ${issue.rule_id}`);
          }
          if (fixedIssues.length > 10) lines.push(`  ... and ${fixedIssues.length - 10} more`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );
}
