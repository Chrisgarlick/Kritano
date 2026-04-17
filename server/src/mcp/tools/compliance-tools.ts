import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { McpContext } from '../auth.js';
import { requireScope } from '../auth.js';
import { formatSeverity } from '../utils/formatting.js';

export function registerComplianceTools(server: McpServer, pool: Pool, ctx: McpContext): void {

  // ── get_compliance_status ────────────────────────────────────
  server.tool(
    'get_compliance_status',
    'Get the EAA/EN 301 549 compliance status for an audit. Maps accessibility findings to European Accessibility Act clauses.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
    },
    async ({ audit_id }) => {
      try {
        requireScope(ctx, 'audits:read');

        const auditCheck = await pool.query(
          `SELECT id, target_url, wcag_version, wcag_level, accessibility_score
           FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );
        if (auditCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
        }

        const audit = auditCheck.rows[0];

        // Get accessibility findings grouped by WCAG criterion
        const findings = await pool.query<{ criterion: string; severity: string; count: string; rule_names: string[] }>(
          `SELECT unnest(wcag_criteria) as criterion,
                  MAX(CASE severity WHEN 'critical' THEN 'critical' WHEN 'serious' THEN 'serious' WHEN 'moderate' THEN 'moderate' ELSE 'minor' END) as severity,
                  COUNT(*) as count,
                  array_agg(DISTINCT rule_name) as rule_names
           FROM audit_findings
           WHERE audit_job_id = $1 AND category = 'accessibility' AND wcag_criteria IS NOT NULL
           GROUP BY criterion
           ORDER BY criterion`,
          [audit_id]
        );

        // EN 301 549 clause mapping (key WCAG criteria to clauses)
        const clauseMap: Record<string, string> = {
          '1.1.1': '9.1.1.1 Non-text Content',
          '1.2.1': '9.1.2.1 Audio-only and Video-only',
          '1.2.2': '9.1.2.2 Captions',
          '1.2.3': '9.1.2.3 Audio Description',
          '1.3.1': '9.1.3.1 Info and Relationships',
          '1.3.2': '9.1.3.2 Meaningful Sequence',
          '1.3.3': '9.1.3.3 Sensory Characteristics',
          '1.4.1': '9.1.4.1 Use of Colour',
          '1.4.2': '9.1.4.2 Audio Control',
          '1.4.3': '9.1.4.3 Contrast (Minimum)',
          '1.4.4': '9.1.4.4 Resize Text',
          '1.4.5': '9.1.4.5 Images of Text',
          '2.1.1': '9.2.1.1 Keyboard',
          '2.1.2': '9.2.1.2 No Keyboard Trap',
          '2.2.1': '9.2.2.1 Timing Adjustable',
          '2.2.2': '9.2.2.2 Pause, Stop, Hide',
          '2.3.1': '9.2.3.1 Three Flashes',
          '2.4.1': '9.2.4.1 Bypass Blocks',
          '2.4.2': '9.2.4.2 Page Titled',
          '2.4.3': '9.2.4.3 Focus Order',
          '2.4.4': '9.2.4.4 Link Purpose',
          '2.4.5': '9.2.4.5 Multiple Ways',
          '2.4.6': '9.2.4.6 Headings and Labels',
          '2.4.7': '9.2.4.7 Focus Visible',
          '3.1.1': '9.3.1.1 Language of Page',
          '3.1.2': '9.3.1.2 Language of Parts',
          '3.2.1': '9.3.2.1 On Focus',
          '3.2.2': '9.3.2.2 On Input',
          '3.3.1': '9.3.3.1 Error Identification',
          '3.3.2': '9.3.3.2 Labels or Instructions',
          '4.1.1': '9.4.1.1 Parsing',
          '4.1.2': '9.4.1.2 Name, Role, Value',
          '4.1.3': '9.4.1.3 Status Messages',
        };

        const failedCriteria = new Set(findings.rows.map(f => f.criterion));
        const allTestable = Object.keys(clauseMap);
        const passedCriteria = allTestable.filter(c => !failedCriteria.has(c));

        const hasCritical = findings.rows.some(f => f.severity === 'critical');
        const hasSerious = findings.rows.some(f => f.severity === 'serious');

        let complianceStatus = 'Compliant';
        if (hasCritical) complianceStatus = 'Non-compliant (critical issues)';
        else if (hasSerious) complianceStatus = 'Partially compliant (serious issues)';
        else if (failedCriteria.size > 0) complianceStatus = 'Partially compliant (minor issues)';

        const lines = [
          `EAA Compliance Status for ${audit.target_url}`,
          `WCAG ${audit.wcag_version} Level ${audit.wcag_level}`,
          `Accessibility Score: ${audit.accessibility_score !== null ? Math.round(audit.accessibility_score) + '/100' : 'N/A'}`,
          `Status: ${complianceStatus}`,
          '',
          `EN 301 549 Clauses with Issues (${failedCriteria.size}):`,
          '',
        ];

        for (const f of findings.rows) {
          const clause = clauseMap[f.criterion] || `Clause for WCAG ${f.criterion}`;
          lines.push(`  ${formatSeverity(f.severity)} WCAG ${f.criterion} -> ${clause}`);
          lines.push(`    ${f.count} finding(s): ${f.rule_names.slice(0, 3).join(', ')}${f.rule_names.length > 3 ? '...' : ''}`);
        }

        lines.push('');
        lines.push(`Clauses passing: ${passedCriteria.length}/${allTestable.length}`);
        lines.push('');
        lines.push('Note: This is based on automated testing only and does not replace a full manual audit. Always consult with an accessibility specialist for full EAA compliance.');

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );

  // ── get_clause_detail ────────────────────────────────────────
  server.tool(
    'get_clause_detail',
    'Get detail for a specific WCAG criterion showing all related findings, affected pages, and the mapped EN 301 549 clause.',
    {
      audit_id: z.string().uuid().describe('The audit job ID'),
      wcag_criterion: z.string().describe('WCAG criterion (e.g. "1.1.1", "2.4.4")'),
    },
    async ({ audit_id, wcag_criterion }) => {
      try {
        requireScope(ctx, 'audits:read');

        const auditCheck = await pool.query(
          `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
          [audit_id, ctx.userId]
        );
        if (auditCheck.rows.length === 0) {
          return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
        }

        const result = await pool.query(
          `SELECT f.rule_id, f.rule_name, f.severity, f.message, f.selector, f.snippet, p.url as page_url
           FROM audit_findings f
           LEFT JOIN audit_pages p ON f.audit_page_id = p.id
           WHERE f.audit_job_id = $1 AND $2 = ANY(f.wcag_criteria)
           ORDER BY
             CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 ELSE 4 END,
             p.url`,
          [audit_id, wcag_criterion]
        );

        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: `No findings for WCAG ${wcag_criterion} in audit #${audit_id.substring(0, 8)}.` }] };
        }

        const pages = new Set(result.rows.map(r => r.page_url).filter(Boolean));

        const lines = [
          `WCAG ${wcag_criterion} -- ${result.rows.length} findings across ${pages.size} pages`,
          '',
        ];

        for (const f of result.rows.slice(0, 20)) {
          lines.push(`${formatSeverity(f.severity)} ${f.rule_name}`);
          lines.push(`  ${f.message}`);
          if (f.page_url) lines.push(`  Page: ${f.page_url}`);
          if (f.selector) lines.push(`  Selector: ${f.selector}`);
          if (f.snippet) {
            lines.push('  ```html');
            lines.push(`  ${f.snippet.substring(0, 200)}`);
            lines.push('  ```');
          }
          lines.push('');
        }

        if (result.rows.length > 20) {
          lines.push(`... and ${result.rows.length - 20} more findings.`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
  );
}
