/**
 * Cold Prospect Admin Service
 *
 * CRUD operations, stats, and settings management for the cold prospects pipeline.
 */

import { Pool } from 'pg';
import type {
  ColdProspect,
  ColdProspectFilters,
  ColdProspectStats,
  ColdProspectSettings,
} from '../../types/cold-prospect.types.js';
import { getSettings, updateSetting } from './nrd-feed.service.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * List prospects with filters and pagination
 */
export async function getProspects(filters: ColdProspectFilters): Promise<{ prospects: ColdProspect[]; total: number }> {
  const {
    status,
    tld,
    minScore,
    maxScore,
    batchDate,
    hasEmail,
    hasName,
    search,
    page = 1,
    limit = 25,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  const conditions: string[] = ['is_excluded = FALSE'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (tld) {
    conditions.push(`tld = $${paramIdx++}`);
    params.push(tld);
  }

  if (minScore !== undefined) {
    conditions.push(`quality_score >= $${paramIdx++}`);
    params.push(minScore);
  }

  if (maxScore !== undefined) {
    conditions.push(`quality_score <= $${paramIdx++}`);
    params.push(maxScore);
  }

  if (batchDate) {
    conditions.push(`batch_date = $${paramIdx++}`);
    params.push(batchDate);
  }

  if (hasEmail) {
    conditions.push('contact_email IS NOT NULL');
  }

  if (hasName) {
    conditions.push('contact_name IS NOT NULL');
  }

  if (search) {
    conditions.push(`(domain ILIKE $${paramIdx} OR contact_email ILIKE $${paramIdx} OR contact_name ILIKE $${paramIdx} OR title ILIKE $${paramIdx})`);
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
    pool.query(
      `SELECT * FROM cold_prospects ${where}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM cold_prospects ${where}`,
      params
    ),
  ]);

  return {
    prospects: prospectsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

/**
 * Get a single prospect by ID
 */
export async function getProspect(id: string): Promise<ColdProspect | null> {
  const result = await pool.query('SELECT * FROM cold_prospects WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get pipeline statistics
 */
export async function getStats(): Promise<ColdProspectStats> {
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

  const byStatus: Record<string, number> = {};
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
export async function excludeProspect(id: string, reason: string): Promise<void> {
  await pool.query(
    `UPDATE cold_prospects SET is_excluded = TRUE, exclusion_reason = $2, updated_at = NOW() WHERE id = $1`,
    [id, reason]
  );
}

/**
 * Bulk exclude prospects
 */
export async function bulkExclude(ids: string[], reason: string): Promise<number> {
  const result = await pool.query(
    `UPDATE cold_prospects SET is_excluded = TRUE, exclusion_reason = $2, updated_at = NOW()
     WHERE id = ANY($1::uuid[])`,
    [ids, reason]
  );
  return result.rowCount || 0;
}

/**
 * Retry a prospect (reset to pending)
 */
export async function retryProspect(id: string): Promise<void> {
  await pool.query(
    `UPDATE cold_prospects SET
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
    WHERE id = $1`,
    [id]
  );
}

/**
 * Get pipeline settings
 */
export async function getPipelineSettings(): Promise<ColdProspectSettings> {
  return getSettings();
}

/**
 * Update pipeline settings
 */
export async function updatePipelineSettings(settings: Partial<ColdProspectSettings>): Promise<void> {
  const keyMap: Record<string, string> = {
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
      await updateSetting(dbKey, value);
    }
  }
}

/**
 * Get distinct TLDs for filter dropdown
 */
export async function getDistinctTlds(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT tld FROM cold_prospects WHERE is_excluded = FALSE ORDER BY tld`
  );
  return result.rows.map(r => r.tld);
}

/**
 * Get daily import stats for chart
 */
export async function getDailyStats(days: number = 30): Promise<{ date: string; imported: number; qualified: number; contacted: number }[]> {
  const result = await pool.query(
    `SELECT
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
    ORDER BY d.date`,
    [days]
  );
  return result.rows;
}
