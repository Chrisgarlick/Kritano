import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { McpContext } from '../auth.js';
import { requireScope } from '../auth.js';
import { formatScore, formatDate, formatSeverity } from '../utils/formatting.js';

export function registerAnalyticsTools(server: McpServer, pool: Pool, ctx: McpContext): void {

  // ── get_score_trends ─────────────────────────────────────────
  server.tool(
    'get_score_trends',
    'Get score trends over time for a site. Shows how SEO, accessibility, security, performance, and content scores have changed.',
    {
      site_id: z.string().uuid().describe('The site ID'),
      period: z.enum(['7d', '30d', '90d', '180d', '365d']).optional().describe('Time period (default: 30d)'),
    },
    async ({ site_id, period }) => {
      try {
        requireScope(ctx, 'audits:read');

        const siteCheck = await pool.query(
          `SELECT id, domain FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
          [site_id, ctx.userId]
        );
        if (siteCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
        }

        const days = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365 }[period || '30d'];

        const result = await pool.query(
          `SELECT seo_score, accessibility_score, security_score, performance_score, content_score,
                  total_issues, completed_at
           FROM audit_jobs
           WHERE site_id = $1 AND status = 'completed' AND completed_at > NOW() - $2::interval
           ORDER BY completed_at ASC`,
          [site_id, `${days} days`]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `No completed audits in the last ${days} days for ${siteCheck.rows[0].domain}.` }] };
        }

        const first = result.rows[0];
        const last = result.rows[result.rows.length - 1];

        const delta = (a: number | null, b: number | null) => {
          if (a === null || b === null) return 'N/A';
          const d = Math.round(b) - Math.round(a);
          return d > 0 ? `+${d}` : `${d}`;
        };

        const lines = [
          `Score Trends for ${siteCheck.rows[0].domain} (last ${days} days)`,
          `${result.rows.length} audits in this period`,
          '',
          `                 First       Latest      Change`,
          `  SEO:           ${formatScore(first.seo_score).padEnd(12)}${formatScore(last.seo_score).padEnd(12)}${delta(first.seo_score, last.seo_score)}`,
          `  Accessibility: ${formatScore(first.accessibility_score).padEnd(12)}${formatScore(last.accessibility_score).padEnd(12)}${delta(first.accessibility_score, last.accessibility_score)}`,
          `  Security:      ${formatScore(first.security_score).padEnd(12)}${formatScore(last.security_score).padEnd(12)}${delta(first.security_score, last.security_score)}`,
          `  Performance:   ${formatScore(first.performance_score).padEnd(12)}${formatScore(last.performance_score).padEnd(12)}${delta(first.performance_score, last.performance_score)}`,
          `  Content:       ${formatScore(first.content_score).padEnd(12)}${formatScore(last.content_score).padEnd(12)}${delta(first.content_score, last.content_score)}`,
          '',
          `  Issues:        ${first.total_issues}${' '.repeat(12 - String(first.total_issues).length)}${last.total_issues}${' '.repeat(12 - String(last.total_issues).length)}${delta(first.total_issues, last.total_issues)}`,
        ];

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_top_issues ───────────────────────────────────────────
  server.tool(
    'get_top_issues',
    'Get the most common recurring issues across all completed audits for a site. Useful for identifying persistent problems.',
    {
      site_id: z.string().uuid().describe('The site ID'),
      limit: z.number().int().min(1).max(30).optional().describe('Max results (default: 10)'),
    },
    async ({ site_id, limit }) => {
      try {
        requireScope(ctx, 'audits:read');

        const siteCheck = await pool.query(
          `SELECT id, domain FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
          [site_id, ctx.userId]
        );
        if (siteCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
        }

        const limitNum = limit ?? 10;

        const result = await pool.query(
          `SELECT f.rule_id, f.rule_name, f.severity, f.category,
                  COUNT(DISTINCT f.audit_job_id) as audit_count,
                  COUNT(DISTINCT f.audit_page_id) as total_page_count
           FROM audit_findings f
           JOIN audit_jobs aj ON f.audit_job_id = aj.id
           WHERE aj.site_id = $1 AND aj.status = 'completed'
           GROUP BY f.rule_id, f.rule_name, f.severity, f.category
           ORDER BY audit_count DESC, total_page_count DESC
           LIMIT $2`,
          [site_id, limitNum]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `No issues found for ${siteCheck.rows[0].domain}.` }] };
        }

        // Get total audit count for context
        const auditCount = await pool.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM audit_jobs WHERE site_id = $1 AND status = 'completed'`,
          [site_id]
        );

        const totalAudits = parseInt(auditCount.rows[0].count, 10);
        const lines = [
          `Top Issues for ${siteCheck.rows[0].domain} (across ${totalAudits} audits)`,
          '',
        ];

        for (let i = 0; i < result.rows.length; i++) {
          const r = result.rows[i];
          lines.push(`${i + 1}. ${formatSeverity(r.severity)} ${r.rule_name} (${r.category})`);
          lines.push(`   Appeared in ${r.audit_count}/${totalAudits} audits, affecting ${r.total_page_count} total pages`);
          lines.push('');
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_improvement_summary ──────────────────────────────────
  server.tool(
    'get_improvement_summary',
    'Compare the two most recent audits for a site and show what improved, regressed, and stayed the same.',
    {
      site_id: z.string().uuid().describe('The site ID'),
    },
    async ({ site_id }) => {
      try {
        requireScope(ctx, 'audits:read');

        const siteCheck = await pool.query(
          `SELECT id, domain FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
          [site_id, ctx.userId]
        );
        if (siteCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
        }

        const audits = await pool.query(
          `SELECT id, seo_score, accessibility_score, security_score, performance_score, content_score,
                  total_issues, critical_issues, pages_crawled, completed_at
           FROM audit_jobs
           WHERE site_id = $1 AND status = 'completed'
           ORDER BY completed_at DESC LIMIT 2`,
          [site_id]
        );

        if (audits.rows.length < 2) {
          return { content: [{ type: 'text', text: `Need at least 2 completed audits to compare. Found ${audits.rows.length}.` }] };
        }

        const [latest, previous] = audits.rows;

        // Get rules from each
        const [latestRules, prevRules] = await Promise.all([
          pool.query<{ rule_id: string; rule_name: string; severity: string; category: string }>(
            `SELECT DISTINCT rule_id, rule_name, severity, category FROM audit_findings WHERE audit_job_id = $1`,
            [latest.id]
          ),
          pool.query<{ rule_id: string; rule_name: string; severity: string; category: string }>(
            `SELECT DISTINCT rule_id, rule_name, severity, category FROM audit_findings WHERE audit_job_id = $1`,
            [previous.id]
          ),
        ]);

        const latestRuleIds = new Set(latestRules.rows.map(r => r.rule_id));
        const prevRuleIds = new Set(prevRules.rows.map(r => r.rule_id));

        const fixed = prevRules.rows.filter(r => !latestRuleIds.has(r.rule_id));
        const newIssues = latestRules.rows.filter(r => !prevRuleIds.has(r.rule_id));

        const delta = (a: number | null, b: number | null) => {
          if (a === null || b === null) return 'N/A';
          const d = Math.round(b) - Math.round(a);
          return d > 0 ? `+${d}` : `${d}`;
        };

        const lines = [
          `Improvement Summary for ${siteCheck.rows[0].domain}`,
          `Previous: ${formatDate(previous.completed_at)} | Latest: ${formatDate(latest.completed_at)}`,
          '',
          'Score Changes:',
          `  SEO:            ${formatScore(previous.seo_score)} -> ${formatScore(latest.seo_score)} (${delta(previous.seo_score, latest.seo_score)})`,
          `  Accessibility:  ${formatScore(previous.accessibility_score)} -> ${formatScore(latest.accessibility_score)} (${delta(previous.accessibility_score, latest.accessibility_score)})`,
          `  Security:       ${formatScore(previous.security_score)} -> ${formatScore(latest.security_score)} (${delta(previous.security_score, latest.security_score)})`,
          `  Performance:    ${formatScore(previous.performance_score)} -> ${formatScore(latest.performance_score)} (${delta(previous.performance_score, latest.performance_score)})`,
          `  Content:        ${formatScore(previous.content_score)} -> ${formatScore(latest.content_score)} (${delta(previous.content_score, latest.content_score)})`,
          '',
          `Issues: ${prevRuleIds.size} -> ${latestRuleIds.size} unique`,
        ];

        if (fixed.length > 0) {
          lines.push('');
          lines.push(`Fixed (${fixed.length}):`);
          for (const f of fixed.slice(0, 10)) {
            lines.push(`  ${formatSeverity(f.severity)} ${f.rule_name} (${f.category})`);
          }
          if (fixed.length > 10) lines.push(`  ... and ${fixed.length - 10} more`);
        }

        if (newIssues.length > 0) {
          lines.push('');
          lines.push(`New issues (${newIssues.length}):`);
          for (const f of newIssues.slice(0, 10)) {
            lines.push(`  ${formatSeverity(f.severity)} ${f.rule_name} (${f.category})`);
          }
          if (newIssues.length > 10) lines.push(`  ... and ${newIssues.length - 10} more`);
        }

        if (fixed.length === 0 && newIssues.length === 0) {
          lines.push('');
          lines.push('No issues were fixed or introduced between these audits.');
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );
}
