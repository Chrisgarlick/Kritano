import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { McpContext } from '../auth.js';
import { requireScope } from '../auth.js';
import { formatScore, formatDate } from '../utils/formatting.js';

export function registerSiteTools(server: McpServer, pool: Pool, ctx: McpContext): void {

  // ── list_sites ───────────────────────────────────────────────
  server.tool(
    'list_sites',
    'List all sites in your account with their verification status and latest audit scores.',
    {},
    async () => {
      try {
        requireScope(ctx, 'audits:read');

        const result = await pool.query(
          `SELECT s.id, s.domain, s.name, s.verified, s.created_at,
                  (SELECT json_build_object(
                    'seo_score', aj.seo_score,
                    'accessibility_score', aj.accessibility_score,
                    'security_score', aj.security_score,
                    'performance_score', aj.performance_score,
                    'content_score', aj.content_score,
                    'completed_at', aj.completed_at
                  )
                  FROM audit_jobs aj
                  WHERE aj.site_id = s.id AND aj.status = 'completed'
                  ORDER BY aj.completed_at DESC LIMIT 1
                  ) as latest_audit
           FROM sites s
           WHERE COALESCE(s.owner_id, s.created_by) = $1
           ORDER BY s.created_at DESC`,
          [ctx.userId]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: 'No sites found. Use create_site to add one.' }] };
        }

        const lines = [`Sites (${result.rows.length})`, ''];

        for (const s of result.rows) {
          const verified = s.verified ? 'Verified' : 'Unverified';
          lines.push(`${s.name || s.domain} (${verified})`);
          lines.push(`  ID: ${s.id}`);
          lines.push(`  Domain: ${s.domain}`);

          if (s.latest_audit) {
            const la = s.latest_audit;
            lines.push(`  Latest audit: SEO ${formatScore(la.seo_score)} | A11y ${formatScore(la.accessibility_score)} | Sec ${formatScore(la.security_score)} | Perf ${formatScore(la.performance_score)} | Content ${formatScore(la.content_score)}`);
            lines.push(`  Last audited: ${formatDate(la.completed_at)}`);
          } else {
            lines.push('  No completed audits yet');
          }
          lines.push('');
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_site ─────────────────────────────────────────────────
  server.tool(
    'get_site',
    'Get detailed information about a site including verification status, latest scores, and audit count.',
    {
      site_id: z.string().uuid().describe('The site ID'),
    },
    async ({ site_id }) => {
      try {
        requireScope(ctx, 'audits:read');

        const result = await pool.query(
          `SELECT s.*, COUNT(aj.id) as audit_count
           FROM sites s
           LEFT JOIN audit_jobs aj ON aj.site_id = s.id AND aj.status = 'completed'
           WHERE s.id = $1 AND COALESCE(s.owner_id, s.created_by) = $2
           GROUP BY s.id`,
          [site_id, ctx.userId]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
        }

        const s = result.rows[0];

        // Get latest audit
        const latestAudit = await pool.query(
          `SELECT seo_score, accessibility_score, security_score, performance_score, content_score,
                  total_issues, critical_issues, completed_at
           FROM audit_jobs
           WHERE site_id = $1 AND status = 'completed'
           ORDER BY completed_at DESC LIMIT 1`,
          [site_id]
        );

        const lines = [
          `${s.name || s.domain}`,
          `Domain: ${s.domain}`,
          `Verified: ${s.verified ? 'Yes' : 'No'}`,
          `Created: ${formatDate(s.created_at)}`,
          `Completed audits: ${s.audit_count}`,
        ];

        if (latestAudit.rows.length > 0) {
          const la = latestAudit.rows[0];
          lines.push('');
          lines.push('Latest Audit Scores:');
          lines.push(`  SEO:            ${formatScore(la.seo_score)}`);
          lines.push(`  Accessibility:  ${formatScore(la.accessibility_score)}`);
          lines.push(`  Security:       ${formatScore(la.security_score)}`);
          lines.push(`  Performance:    ${formatScore(la.performance_score)}`);
          lines.push(`  Content:        ${formatScore(la.content_score)}`);
          lines.push(`  Issues: ${la.total_issues} total, ${la.critical_issues} critical`);
          lines.push(`  Completed: ${formatDate(la.completed_at)}`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── create_site ──────────────────────────────────────────────
  server.tool(
    'create_site',
    'Add a new site to your account. This creates a site record that audits can be linked to. The site will need to be verified via the dashboard for full access.',
    {
      domain: z.string().describe('The domain to add (e.g. "example.com")'),
      name: z.string().optional().describe('Display name for the site (defaults to the domain)'),
    },
    async ({ domain, name }) => {
      try {
        requireScope(ctx, 'audits:write');

        // Normalise domain
        const normalised = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();

        // Check if site already exists
        const existing = await pool.query(
          `SELECT id FROM sites WHERE domain = $1 AND COALESCE(owner_id, created_by) = $2`,
          [normalised, ctx.userId]
        );

        if (existing.rows.length > 0) {
          return { content: [{ type: 'text', text: `Site "${normalised}" already exists (ID: ${existing.rows[0].id}).` }] };
        }

        const result = await pool.query(
          `INSERT INTO sites (domain, name, created_by)
           VALUES ($1, $2, $3)
           RETURNING id, domain, name, verified, created_at`,
          [normalised, name || normalised, ctx.userId]
        );

        const s = result.rows[0];
        return {
          content: [{
            type: 'text',
            text: [
              `Site created successfully.`,
              ``,
              `ID: ${s.id}`,
              `Domain: ${s.domain}`,
              `Name: ${s.name}`,
              `Verified: No (verify via the Kritano dashboard)`,
            ].join('\n'),
          }],
        };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_site_history ─────────────────────────────────────────
  server.tool(
    'get_site_history',
    'Get the audit score history for a site -- shows how scores have changed over time.',
    {
      site_id: z.string().uuid().describe('The site ID'),
      limit: z.number().int().min(1).max(50).optional().describe('Number of audits to show (default: 10)'),
    },
    async ({ site_id, limit }) => {
      try {
        requireScope(ctx, 'audits:read');

        // Verify ownership
        const siteCheck = await pool.query(
          `SELECT id, domain FROM sites WHERE id = $1 AND COALESCE(owner_id, created_by) = $2`,
          [site_id, ctx.userId]
        );
        if (siteCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
        }

        const limitNum = limit ?? 10;
        const result = await pool.query(
          `SELECT id, seo_score, accessibility_score, security_score, performance_score, content_score,
                  total_issues, critical_issues, pages_crawled, completed_at
           FROM audit_jobs
           WHERE site_id = $1 AND status = 'completed'
           ORDER BY completed_at DESC
           LIMIT $2`,
          [site_id, limitNum]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `No completed audits for site "${siteCheck.rows[0].domain}".` }] };
        }

        const site = siteCheck.rows[0];
        const lines = [`Audit History for ${site.domain} (${result.rows.length} audits)`, ''];
        lines.push('Date            | SEO  | A11y | Sec  | Perf | Content | Issues');
        lines.push('----------------|------|------|------|------|---------|-------');

        for (const a of result.rows) {
          const date = formatDate(a.completed_at).substring(0, 16);
          lines.push(
            `${date} | ${formatScore(a.seo_score).padEnd(4)} | ${formatScore(a.accessibility_score).padEnd(4)} | ${formatScore(a.security_score).padEnd(4)} | ${formatScore(a.performance_score).padEnd(4)} | ${formatScore(a.content_score).padEnd(7)} | ${a.total_issues}`
          );
        }

        // Show trend if we have at least 2 audits
        if (result.rows.length >= 2) {
          const latest = result.rows[0];
          const previous = result.rows[1];

          const delta = (a: number | null, b: number | null) => {
            if (a === null || b === null) return '  ';
            const d = Math.round(a) - Math.round(b);
            return d > 0 ? `+${d}` : `${d}`;
          };

          lines.push('');
          lines.push(`Trend (last vs previous): SEO ${delta(latest.seo_score, previous.seo_score)} | A11y ${delta(latest.accessibility_score, previous.accessibility_score)} | Sec ${delta(latest.security_score, previous.security_score)} | Perf ${delta(latest.performance_score, previous.performance_score)} | Content ${delta(latest.content_score, previous.content_score)}`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );
}
