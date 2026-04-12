"use strict";
/**
 * Cold Prospect Admin Service
 *
 * CRUD operations, stats, and settings management for the cold prospects pipeline.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getProspects = getProspects;
exports.getProspect = getProspect;
exports.getStats = getStats;
exports.excludeProspect = excludeProspect;
exports.bulkExclude = bulkExclude;
exports.retryProspect = retryProspect;
exports.getPipelineSettings = getPipelineSettings;
exports.updatePipelineSettings = updatePipelineSettings;
exports.getDistinctTlds = getDistinctTlds;
exports.getDailyStats = getDailyStats;
const nrd_feed_service_js_1 = require("./nrd-feed.service.js");
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
/**
 * List prospects with filters and pagination
 */
async function getProspects(filters) {
    const { status, tld, minScore, maxScore, batchDate, hasEmail, hasName, isUnsubscribed, search, page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'desc', } = filters;
    const conditions = ['(cp.is_excluded = FALSE OR cp.exclusion_reason = \'unsubscribed\')'];
    const params = [];
    let paramIdx = 1;
    if (isUnsubscribed) {
        conditions.push(`EXISTS (SELECT 1 FROM cold_prospect_unsubscribes cu WHERE cu.email = cp.contact_email)`);
    }
    if (status) {
        conditions.push(`cp.status = $${paramIdx++}`);
        params.push(status);
    }
    if (tld) {
        conditions.push(`cp.tld = $${paramIdx++}`);
        params.push(tld);
    }
    if (minScore !== undefined) {
        conditions.push(`cp.quality_score >= $${paramIdx++}`);
        params.push(minScore);
    }
    if (maxScore !== undefined) {
        conditions.push(`cp.quality_score <= $${paramIdx++}`);
        params.push(maxScore);
    }
    if (batchDate) {
        conditions.push(`cp.batch_date = $${paramIdx++}`);
        params.push(batchDate);
    }
    if (hasEmail) {
        conditions.push('cp.contact_email IS NOT NULL');
    }
    if (hasName) {
        conditions.push('cp.contact_name IS NOT NULL');
    }
    if (search) {
        conditions.push(`(cp.domain ILIKE $${paramIdx} OR cp.contact_email ILIKE $${paramIdx} OR cp.contact_name ILIKE $${paramIdx} OR cp.title ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    // Validate sort column
    const allowedSorts = ['created_at', 'quality_score', 'domain', 'batch_date', 'status', 'contact_email'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;
    const [prospectsResult, countResult] = await Promise.all([
        pool.query(`SELECT cp.*,
        EXISTS (SELECT 1 FROM cold_prospect_unsubscribes cu WHERE cu.email = cp.contact_email) AS is_unsubscribed
       FROM cold_prospects cp ${where}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`, [...params, limit, offset]),
        pool.query(`SELECT COUNT(*) FROM cold_prospects cp ${where}`, params),
    ]);
    return {
        prospects: prospectsResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
}
/**
 * Get a single prospect by ID
 */
async function getProspect(id) {
    const result = await pool.query('SELECT * FROM cold_prospects WHERE id = $1', [id]);
    return result.rows[0] || null;
}
/**
 * Get pipeline statistics
 */
async function getStats() {
    const [statusResult, todayResult, emailResult, nameResult, avgResult] = await Promise.all([
        pool.query(`
      SELECT status, COUNT(*) as count
      FROM cold_prospects
      WHERE is_excluded = FALSE
      GROUP BY status
    `),
        pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE batch_date = CURRENT_DATE) as today_imported,
        COUNT(*) FILTER (WHERE status = 'qualified' AND updated_at::date = CURRENT_DATE) as today_qualified,
        COUNT(*) FILTER (WHERE status = 'contacted' AND email_sent_at::date = CURRENT_DATE) as today_contacted
      FROM cold_prospects
      WHERE is_excluded = FALSE
    `),
        pool.query(`
      SELECT COUNT(*) as count FROM cold_prospects
      WHERE contact_email IS NOT NULL AND is_excluded = FALSE
    `),
        pool.query(`
      SELECT COUNT(*) as count FROM cold_prospects
      WHERE contact_name IS NOT NULL AND is_excluded = FALSE
    `),
        pool.query(`
      SELECT
        COALESCE(AVG(quality_score), 0) as avg_score,
        COUNT(*) as total
      FROM cold_prospects
      WHERE is_excluded = FALSE
    `),
    ]);
    const byStatus = {};
    let total = 0;
    for (const row of statusResult.rows) {
        byStatus[row.status] = parseInt(row.count, 10);
        total += parseInt(row.count, 10);
    }
    const contacted = byStatus['contacted'] || 0;
    const converted = byStatus['converted'] || 0;
    const conversionRate = contacted > 0 ? (converted / contacted) * 100 : 0;
    return {
        total,
        byStatus,
        todayImported: parseInt(todayResult.rows[0].today_imported, 10),
        todayQualified: parseInt(todayResult.rows[0].today_qualified, 10),
        todayContacted: parseInt(todayResult.rows[0].today_contacted, 10),
        withEmail: parseInt(emailResult.rows[0].count, 10),
        withName: parseInt(nameResult.rows[0].count, 10),
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgQualityScore: Math.round(parseFloat(avgResult.rows[0].avg_score)),
    };
}
/**
 * Exclude a prospect
 */
async function excludeProspect(id, reason) {
    await pool.query(`UPDATE cold_prospects SET is_excluded = TRUE, exclusion_reason = $2, updated_at = NOW() WHERE id = $1`, [id, reason]);
}
/**
 * Bulk exclude prospects
 */
async function bulkExclude(ids, reason) {
    const result = await pool.query(`UPDATE cold_prospects SET is_excluded = TRUE, exclusion_reason = $2, updated_at = NOW()
     WHERE id = ANY($1::uuid[])`, [ids, reason]);
    return result.rowCount || 0;
}
/**
 * Retry a prospect (reset to pending)
 */
async function retryProspect(id) {
    await pool.query(`UPDATE cold_prospects SET
      status = 'pending',
      is_live = FALSE,
      http_status = NULL,
      has_ssl = NULL,
      title = NULL,
      meta_description = NULL,
      technology_stack = '[]',
      page_count_estimate = NULL,
      contact_email = NULL,
      contact_name = NULL,
      contact_role = NULL,
      emails = '[]',
      contact_page_url = NULL,
      has_contact_form = FALSE,
      social_links = '{}',
      quality_score = 0,
      updated_at = NOW()
    WHERE id = $1`, [id]);
}
/**
 * Get pipeline settings
 */
async function getPipelineSettings() {
    return (0, nrd_feed_service_js_1.getSettings)();
}
/**
 * Update pipeline settings
 */
async function updatePipelineSettings(settings) {
    const keyMap = {
        targetTlds: 'target_tlds',
        excludedKeywords: 'excluded_keywords',
        minQualityScore: 'min_quality_score',
        dailyCheckLimit: 'daily_check_limit',
        dailyEmailLimit: 'daily_email_limit',
        autoOutreachEnabled: 'auto_outreach_enabled',
    };
    for (const [key, value] of Object.entries(settings)) {
        const dbKey = keyMap[key];
        if (dbKey && value !== undefined) {
            await (0, nrd_feed_service_js_1.updateSetting)(dbKey, value);
        }
    }
}
/**
 * Get distinct TLDs for filter dropdown
 */
async function getDistinctTlds() {
    const result = await pool.query(`SELECT DISTINCT tld FROM cold_prospects WHERE is_excluded = FALSE ORDER BY tld`);
    return result.rows.map(r => r.tld);
}
/**
 * Get daily import stats for chart
 */
async function getDailyStats(days = 30) {
    const result = await pool.query(`SELECT
      d.date::text as date,
      COALESCE(imp.count, 0)::int as imported,
      COALESCE(qual.count, 0)::int as qualified,
      COALESCE(con.count, 0)::int as contacted
    FROM generate_series(
      CURRENT_DATE - $1::int * INTERVAL '1 day',
      CURRENT_DATE,
      '1 day'
    ) AS d(date)
    LEFT JOIN (
      SELECT batch_date, COUNT(*) as count
      FROM cold_prospects WHERE is_excluded = FALSE
      GROUP BY batch_date
    ) imp ON imp.batch_date = d.date
    LEFT JOIN (
      SELECT updated_at::date as date, COUNT(*) as count
      FROM cold_prospects WHERE status = 'qualified' AND is_excluded = FALSE
      GROUP BY updated_at::date
    ) qual ON qual.date = d.date
    LEFT JOIN (
      SELECT email_sent_at::date as date, COUNT(*) as count
      FROM cold_prospects WHERE status = 'contacted' AND is_excluded = FALSE
      GROUP BY email_sent_at::date
    ) con ON con.date = d.date
    ORDER BY d.date`, [days]);
    return result.rows;
}
//# sourceMappingURL=cold-prospect-admin.service.js.map