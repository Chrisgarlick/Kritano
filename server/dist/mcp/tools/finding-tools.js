"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFindingTools = registerFindingTools;
const zod_1 = require("zod");
const auth_js_1 = require("../auth.js");
const formatting_js_1 = require("../utils/formatting.js");
function registerFindingTools(server, pool, ctx) {
    // ── list_findings ────────────────────────────────────────────
    server.tool('list_findings', 'List findings (issues) for an audit. Filter by severity, category, WCAG criterion, or page URL. Results are ordered by severity (critical first).', {
        audit_id: zod_1.z.string().uuid().describe('The audit job ID'),
        severity: zod_1.z.enum(['critical', 'serious', 'moderate', 'minor', 'info']).optional().describe('Filter by severity'),
        category: zod_1.z.enum(['seo', 'accessibility', 'security', 'performance', 'content', 'structured-data']).optional().describe('Filter by category'),
        wcag_criterion: zod_1.z.string().optional().describe('Filter by WCAG criterion (e.g. "1.1.1")'),
        page_url: zod_1.z.string().optional().describe('Filter findings to a specific page URL'),
        limit: zod_1.z.number().int().min(1).max(100).optional().describe('Max results (default: 20)'),
        offset: zod_1.z.number().int().min(0).optional().describe('Offset for pagination (default: 0)'),
    }, async ({ audit_id, severity, category, wcag_criterion, page_url, limit, offset }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'findings:read');
            // Verify ownership
            const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [audit_id, ctx.userId]);
            if (auditCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
            }
            const limitNum = limit ?? 20;
            const offsetNum = offset ?? 0;
            const params = [audit_id];
            let query = `
          SELECT f.id, f.category, f.severity, f.rule_id, f.rule_name, f.message,
                 f.wcag_criteria, f.device_type, p.url as page_url
          FROM audit_findings f
          LEFT JOIN audit_pages p ON f.audit_page_id = p.id
          WHERE f.audit_job_id = $1
        `;
            if (severity) {
                params.push(severity);
                query += ` AND f.severity = $${params.length}`;
            }
            if (category) {
                params.push(category);
                query += ` AND f.category = $${params.length}`;
            }
            if (wcag_criterion) {
                params.push(wcag_criterion);
                query += ` AND $${params.length} = ANY(f.wcag_criteria)`;
            }
            if (page_url) {
                params.push(page_url);
                query += ` AND p.url = $${params.length}`;
            }
            // Count
            let countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM');
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count, 10);
            query += `
          ORDER BY
            CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
            f.rule_name
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
            params.push(limitNum, offsetNum);
            const result = await pool.query(query, params);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: 'No findings match your criteria.' }] };
            }
            const lines = [`Findings for audit #${audit_id.substring(0, 8)} (showing ${result.rows.length} of ${total})`, ''];
            for (let i = 0; i < result.rows.length; i++) {
                const f = result.rows[i];
                const num = offsetNum + i + 1;
                lines.push(`${num}. ${(0, formatting_js_1.formatSeverity)(f.severity)} ${f.rule_name} (${f.category})`);
                if (f.wcag_criteria?.length) {
                    lines.push(`   WCAG: ${f.wcag_criteria.join(', ')}`);
                }
                lines.push(`   ${(0, formatting_js_1.truncate)(f.message, 120)}`);
                if (f.page_url) {
                    lines.push(`   Page: ${f.page_url}`);
                }
                lines.push('');
            }
            if (total > offsetNum + limitNum) {
                lines.push(`Use offset: ${offsetNum + limitNum} to see more results.`);
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── get_finding_detail ───────────────────────────────────────
    server.tool('get_finding_detail', 'Get full detail for a specific finding including the code snippet, recommendation, and help URL.', {
        finding_id: zod_1.z.string().uuid().describe('The finding ID'),
    }, async ({ finding_id }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'findings:read');
            const result = await pool.query(`SELECT f.*, p.url as page_url
           FROM audit_findings f
           LEFT JOIN audit_pages p ON f.audit_page_id = p.id
           JOIN audit_jobs j ON f.audit_job_id = j.id
           WHERE f.id = $1 AND j.user_id = $2`, [finding_id, ctx.userId]);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: `Finding "${finding_id}" not found.` }] };
            }
            const f = result.rows[0];
            const lines = [
                `${(0, formatting_js_1.formatSeverity)(f.severity)} ${f.rule_name}`,
                `Category: ${f.category}`,
                `Rule ID: ${f.rule_id}`,
            ];
            if (f.wcag_criteria?.length) {
                lines.push(`WCAG: ${f.wcag_criteria.join(', ')}`);
            }
            if (f.device_type && f.device_type !== 'desktop') {
                lines.push(`Device: ${f.device_type}`);
            }
            lines.push('');
            lines.push(`Message: ${f.message}`);
            if (f.description) {
                lines.push('');
                lines.push(`Description: ${f.description}`);
            }
            if (f.recommendation) {
                lines.push('');
                lines.push(`Recommendation: ${f.recommendation}`);
            }
            if (f.page_url) {
                lines.push('');
                lines.push(`Page: ${f.page_url}`);
            }
            if (f.selector) {
                lines.push(`Selector: ${f.selector}`);
            }
            if (f.snippet) {
                lines.push('');
                lines.push('Code snippet:');
                lines.push('```html');
                lines.push(f.snippet);
                lines.push('```');
            }
            if (f.help_url) {
                lines.push('');
                lines.push(`Learn more: ${f.help_url}`);
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── search_findings ──────────────────────────────────────────
    server.tool('search_findings', 'Search findings by keyword across rule names, messages, and descriptions for a specific audit.', {
        audit_id: zod_1.z.string().uuid().describe('The audit job ID'),
        query: zod_1.z.string().min(2).describe('Search keyword (e.g. "alt text", "heading", "contrast")'),
        limit: zod_1.z.number().int().min(1).max(50).optional().describe('Max results (default: 15)'),
    }, async ({ audit_id, query, limit }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'findings:read');
            const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [audit_id, ctx.userId]);
            if (auditCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
            }
            const limitNum = limit ?? 15;
            const searchPattern = `%${query}%`;
            const result = await pool.query(`SELECT f.id, f.severity, f.rule_name, f.category, f.message, f.wcag_criteria, p.url as page_url
           FROM audit_findings f
           LEFT JOIN audit_pages p ON f.audit_page_id = p.id
           WHERE f.audit_job_id = $1
             AND (f.rule_name ILIKE $2 OR f.message ILIKE $2 OR f.description ILIKE $2 OR f.rule_id ILIKE $2)
           ORDER BY
             CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END
           LIMIT $3`, [audit_id, searchPattern, limitNum]);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: `No findings matching "${query}" in audit #${audit_id.substring(0, 8)}.` }] };
            }
            const lines = [`Search results for "${query}" (${result.rows.length} matches)`, ''];
            for (const f of result.rows) {
                lines.push(`${(0, formatting_js_1.formatSeverity)(f.severity)} ${f.rule_name} (${f.category})`);
                lines.push(`  ${(0, formatting_js_1.truncate)(f.message, 120)}`);
                lines.push(`  ID: ${f.id}`);
                lines.push('');
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── get_findings_summary ─────────────────────────────────────
    server.tool('get_findings_summary', 'Get an aggregated summary of findings for an audit -- counts by severity, category, top recurring rules, and most affected pages.', {
        audit_id: zod_1.z.string().uuid().describe('The audit job ID'),
    }, async ({ audit_id }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'findings:read');
            const auditCheck = await pool.query(`SELECT id, target_url FROM audit_jobs WHERE id = $1 AND user_id = $2`, [audit_id, ctx.userId]);
            if (auditCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
            }
            // Counts by severity
            const bySeverity = await pool.query(`SELECT severity, COUNT(DISTINCT rule_id) as count FROM audit_findings WHERE audit_job_id = $1 GROUP BY severity`, [audit_id]);
            // Counts by category
            const byCategory = await pool.query(`SELECT category, COUNT(DISTINCT rule_id) as count FROM audit_findings WHERE audit_job_id = $1 GROUP BY category`, [audit_id]);
            // Top recurring rules
            const topRules = await pool.query(`SELECT rule_id, rule_name, severity, category, COUNT(DISTINCT audit_page_id) as page_count
           FROM audit_findings WHERE audit_job_id = $1
           GROUP BY rule_id, rule_name, severity, category
           ORDER BY
             CASE severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
             page_count DESC
           LIMIT 10`, [audit_id]);
            // Most affected pages
            const topPages = await pool.query(`SELECT p.url, COUNT(f.id) as finding_count
           FROM audit_findings f
           JOIN audit_pages p ON f.audit_page_id = p.id
           WHERE f.audit_job_id = $1
           GROUP BY p.url
           ORDER BY finding_count DESC
           LIMIT 5`, [audit_id]);
            const lines = [`Findings Summary for ${auditCheck.rows[0].target_url}`, ''];
            lines.push('By Severity:');
            for (const row of bySeverity.rows) {
                lines.push(`  ${row.severity.padEnd(10)} ${row.count} unique issues`);
            }
            lines.push('');
            lines.push('By Category:');
            for (const row of byCategory.rows) {
                lines.push(`  ${row.category.padEnd(16)} ${row.count} unique issues`);
            }
            lines.push('');
            lines.push('Top Issues (by pages affected):');
            for (const row of topRules.rows) {
                lines.push(`  ${(0, formatting_js_1.formatSeverity)(row.severity)} ${row.rule_name} -- ${row.page_count} pages (${row.category})`);
            }
            if (topPages.rows.length > 0) {
                lines.push('');
                lines.push('Most Affected Pages:');
                for (const row of topPages.rows) {
                    lines.push(`  ${row.finding_count} findings -- ${row.url}`);
                }
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── get_wcag_coverage ────────────────────────────────────────
    server.tool('get_wcag_coverage', 'Show WCAG criterion coverage for an audit -- which WCAG criteria have issues and how many pages are affected.', {
        audit_id: zod_1.z.string().uuid().describe('The audit job ID'),
        level: zod_1.z.enum(['A', 'AA', 'AAA']).optional().describe('Filter by WCAG level'),
    }, async ({ audit_id, level }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'findings:read');
            const auditCheck = await pool.query(`SELECT id, wcag_version, wcag_level FROM audit_jobs WHERE id = $1 AND user_id = $2`, [audit_id, ctx.userId]);
            if (auditCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Audit "${audit_id}" not found.` }] };
            }
            const audit = auditCheck.rows[0];
            // Get all WCAG criteria with issues
            const result = await pool.query(`SELECT unnest(wcag_criteria) as criterion,
                  MIN(CASE severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END) as sev_order,
                  MAX(severity) as severity,
                  COUNT(*) as finding_count,
                  COUNT(DISTINCT audit_page_id) as page_count
           FROM audit_findings
           WHERE audit_job_id = $1 AND wcag_criteria IS NOT NULL AND array_length(wcag_criteria, 1) > 0
           GROUP BY criterion
           ORDER BY sev_order, criterion`, [audit_id]);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: `No WCAG-mapped findings for audit #${audit_id.substring(0, 8)}.` }] };
            }
            const lines = [
                `WCAG Coverage for audit #${audit_id.substring(0, 8)}`,
                `WCAG Version: ${audit.wcag_version} | Target Level: ${audit.wcag_level}`,
                '',
                'Criteria with issues:',
                '',
            ];
            for (const row of result.rows) {
                lines.push(`  ${row.criterion.padEnd(8)} ${(0, formatting_js_1.formatSeverity)(row.severity).padEnd(12)} ${row.finding_count} findings on ${row.page_count} pages`);
            }
            lines.push('');
            lines.push(`Total: ${result.rows.length} WCAG criteria with issues`);
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
}
//# sourceMappingURL=finding-tools.js.map