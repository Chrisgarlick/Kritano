"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGscTools = registerGscTools;
const zod_1 = require("zod");
const auth_js_1 = require("../auth.js");
function registerGscTools(server, pool, ctx) {
    // ── get_gsc_overview ─────────────────────────────────────────
    server.tool('get_gsc_overview', 'Get Google Search Console overview for a connected property -- top queries, top pages, clicks, impressions, CTR, and position.', {
        site_id: zod_1.z.string().uuid().describe('The site ID (must have GSC connected)'),
        period: zod_1.z.enum(['7d', '28d', '90d']).optional().describe('Time period (default: 28d)'),
        limit: zod_1.z.number().int().min(1).max(50).optional().describe('Max results per section (default: 10)'),
    }, async ({ site_id, period, limit }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'audits:read');
            // Check site ownership and GSC connection
            const siteCheck = await pool.query(`SELECT s.id, s.domain, g.id as gsc_id, g.property_url
           FROM sites s
           LEFT JOIN gsc_profiles g ON g.site_id = s.id
           WHERE s.id = $1 AND COALESCE(s.owner_id, s.created_by) = $2`, [site_id, ctx.userId]);
            if (siteCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
            }
            if (!siteCheck.rows[0].gsc_id) {
                return { content: [{ type: 'text', text: `No Google Search Console connection for ${siteCheck.rows[0].domain}. Connect it via the Kritano dashboard.` }] };
            }
            const gscId = siteCheck.rows[0].gsc_id;
            const days = { '7d': 7, '28d': 28, '90d': 90 }[period || '28d'];
            const limitNum = limit ?? 10;
            // Top queries
            const queries = await pool.query(`SELECT query, SUM(clicks) as clicks, SUM(impressions) as impressions,
                  ROUND(AVG(ctr)::numeric, 4) as avg_ctr, ROUND(AVG(position)::numeric, 1) as avg_position
           FROM gsc_query_data
           WHERE gsc_profile_id = $1 AND date > NOW() - $2::interval
           GROUP BY query
           ORDER BY clicks DESC
           LIMIT $3`, [gscId, `${days} days`, limitNum]);
            // Top pages
            const pages = await pool.query(`SELECT page, SUM(clicks) as clicks, SUM(impressions) as impressions,
                  ROUND(AVG(ctr)::numeric, 4) as avg_ctr, ROUND(AVG(position)::numeric, 1) as avg_position
           FROM gsc_page_data
           WHERE gsc_profile_id = $1 AND date > NOW() - $2::interval
           GROUP BY page
           ORDER BY clicks DESC
           LIMIT $3`, [gscId, `${days} days`, limitNum]);
            const lines = [
                `GSC Overview for ${siteCheck.rows[0].domain} (last ${days} days)`,
                '',
            ];
            if (queries.rows.length > 0) {
                lines.push('Top Queries:');
                lines.push('Query                              | Clicks | Impr   | CTR    | Pos');
                lines.push('-----------------------------------|--------|--------|--------|----');
                for (const q of queries.rows) {
                    const query = (q.query || '').substring(0, 35).padEnd(35);
                    const clicks = String(q.clicks).padEnd(6);
                    const impr = String(q.impressions).padEnd(6);
                    const ctr = (parseFloat(q.avg_ctr) * 100).toFixed(1).padEnd(6) + '%';
                    const pos = String(q.avg_position).padEnd(4);
                    lines.push(`${query} | ${clicks} | ${impr} | ${ctr} | ${pos}`);
                }
            }
            else {
                lines.push('No query data available for this period.');
            }
            if (pages.rows.length > 0) {
                lines.push('');
                lines.push('Top Pages:');
                for (const p of pages.rows) {
                    lines.push(`  ${p.page}`);
                    lines.push(`    Clicks: ${p.clicks} | Impressions: ${p.impressions} | CTR: ${(parseFloat(p.avg_ctr) * 100).toFixed(1)}% | Pos: ${p.avg_position}`);
                }
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            // Handle case where GSC tables don't exist
            if (error.message?.includes('does not exist')) {
                return { content: [{ type: 'text', text: 'GSC data tables not found. GSC integration may not be set up.' }] };
            }
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── get_gsc_opportunities ────────────────────────────────────
    server.tool('get_gsc_opportunities', 'Find CTR opportunities -- queries where your position is good (top 10) but CTR is below average. These are quick wins for improving organic traffic.', {
        site_id: zod_1.z.string().uuid().describe('The site ID'),
        limit: zod_1.z.number().int().min(1).max(30).optional().describe('Max results (default: 15)'),
    }, async ({ site_id, limit }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'audits:read');
            const siteCheck = await pool.query(`SELECT s.id, s.domain, g.id as gsc_id
           FROM sites s
           LEFT JOIN gsc_profiles g ON g.site_id = s.id
           WHERE s.id = $1 AND COALESCE(s.owner_id, s.created_by) = $2`, [site_id, ctx.userId]);
            if (siteCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
            }
            if (!siteCheck.rows[0].gsc_id) {
                return { content: [{ type: 'text', text: `No GSC connection for ${siteCheck.rows[0].domain}.` }] };
            }
            const limitNum = limit ?? 15;
            // Queries with good position but low CTR
            const result = await pool.query(`SELECT query, SUM(clicks) as clicks, SUM(impressions) as impressions,
                  ROUND(AVG(ctr)::numeric, 4) as avg_ctr, ROUND(AVG(position)::numeric, 1) as avg_position
           FROM gsc_query_data
           WHERE gsc_profile_id = $1 AND date > NOW() - INTERVAL '28 days'
           GROUP BY query
           HAVING AVG(position) <= 10 AND SUM(impressions) >= 10
           ORDER BY SUM(impressions) * (1 - AVG(ctr)) DESC
           LIMIT $2`, [siteCheck.rows[0].gsc_id, limitNum]);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: 'No CTR opportunities found. This could mean CTR is already optimised, or there is not enough data.' }] };
            }
            const lines = [
                `CTR Opportunities for ${siteCheck.rows[0].domain}`,
                'Queries ranking well but with below-average CTR:',
                '',
            ];
            for (let i = 0; i < result.rows.length; i++) {
                const q = result.rows[i];
                const potentialClicks = Math.round(parseFloat(q.impressions) * 0.1); // 10% CTR benchmark
                const currentClicks = parseInt(q.clicks, 10);
                const uplift = potentialClicks - currentClicks;
                lines.push(`${i + 1}. "${q.query}"`);
                lines.push(`   Position: ${q.avg_position} | CTR: ${(parseFloat(q.avg_ctr) * 100).toFixed(1)}% | Impressions: ${q.impressions}`);
                lines.push(`   Current clicks: ${q.clicks} | Potential uplift: ~${Math.max(0, uplift)} clicks/month`);
                lines.push('');
            }
            lines.push('Tip: Improve title tags and meta descriptions for these queries to boost CTR.');
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            if (error.message?.includes('does not exist')) {
                return { content: [{ type: 'text', text: 'GSC data tables not found.' }] };
            }
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
    // ── get_gsc_cannibalisations ─────────────────────────────────
    server.tool('get_gsc_cannibalisations', 'Find keyword cannibalisation -- queries where multiple pages from your site compete for the same keyword.', {
        site_id: zod_1.z.string().uuid().describe('The site ID'),
        limit: zod_1.z.number().int().min(1).max(30).optional().describe('Max results (default: 10)'),
    }, async ({ site_id, limit }) => {
        try {
            (0, auth_js_1.requireScope)(ctx, 'audits:read');
            const siteCheck = await pool.query(`SELECT s.id, s.domain, g.id as gsc_id
           FROM sites s
           LEFT JOIN gsc_profiles g ON g.site_id = s.id
           WHERE s.id = $1 AND COALESCE(s.owner_id, s.created_by) = $2`, [site_id, ctx.userId]);
            if (siteCheck.rows.length === 0) {
                return { content: [{ type: 'text', text: `Site "${site_id}" not found.` }] };
            }
            if (!siteCheck.rows[0].gsc_id) {
                return { content: [{ type: 'text', text: `No GSC connection for ${siteCheck.rows[0].domain}.` }] };
            }
            const limitNum = limit ?? 10;
            // Find queries appearing on multiple pages
            const result = await pool.query(`WITH query_pages AS (
            SELECT query, page, SUM(clicks) as clicks, SUM(impressions) as impressions,
                   ROUND(AVG(position)::numeric, 1) as avg_position
            FROM gsc_query_page_data
            WHERE gsc_profile_id = $1 AND date > NOW() - INTERVAL '28 days'
            GROUP BY query, page
            HAVING SUM(impressions) >= 5
          )
          SELECT query, COUNT(DISTINCT page) as page_count,
                 json_agg(json_build_object('page', page, 'clicks', clicks, 'impressions', impressions, 'position', avg_position)
                          ORDER BY clicks DESC) as pages
          FROM query_pages
          GROUP BY query
          HAVING COUNT(DISTINCT page) >= 2
          ORDER BY SUM(impressions) DESC
          LIMIT $2`, [siteCheck.rows[0].gsc_id, limitNum]);
            if (result.rows.length === 0) {
                return { content: [{ type: 'text', text: 'No keyword cannibalisation detected.' }] };
            }
            const lines = [
                `Keyword Cannibalisation for ${siteCheck.rows[0].domain}`,
                `${result.rows.length} queries competing across multiple pages:`,
                '',
            ];
            for (const r of result.rows) {
                lines.push(`"${r.query}" (${r.page_count} pages)`);
                const pagelist = Array.isArray(r.pages) ? r.pages : JSON.parse(r.pages);
                for (const p of pagelist.slice(0, 5)) {
                    lines.push(`  Pos ${p.position} | ${p.clicks} clicks | ${p.impressions} impr | ${p.page}`);
                }
                lines.push('');
            }
            lines.push('Tip: Consolidate content or use canonical tags to resolve cannibalisation.');
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        catch (error) {
            if (error.message?.includes('does not exist')) {
                return { content: [{ type: 'text', text: 'GSC data tables not found.' }] };
            }
            return { content: [{ type: 'text', text: error.message }], isError: true };
        }
    });
}
//# sourceMappingURL=gsc-tools.js.map