/**
 * Schedule Service — Business logic for scheduled audits
 */

import { Pool } from 'pg';
import { Cron } from 'croner';
import type {
  AuditSchedule,
  AuditScheduleWithSite,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleFrequency,
  ScheduleRunSummary,
} from '../types/schedule.types.js';
import {
  findOrCreateSiteForDomain,
  getUserTierLimits,
  findOrCreateUrl,
} from './site.service.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// FREQUENCY → CRON HELPERS
// =============================================

/**
 * Convert a frequency preset + optional day/hour into a cron expression.
 */
export function frequencyToCron(
  frequency: ScheduleFrequency,
  dayOfWeek: number = 1, // Monday
  hourOfDay: number = 6  // 6 AM
): string {
  switch (frequency) {
    case 'daily':
      return `0 ${hourOfDay} * * *`;
    case 'weekly':
      return `0 ${hourOfDay} * * ${dayOfWeek}`;
    case 'biweekly':
      // Cron can't do biweekly natively — we use weekly cron and skip every other in the poller
      return `0 ${hourOfDay} * * ${dayOfWeek}`;
    case 'monthly':
      return `0 ${hourOfDay} 1 * *`; // 1st of month
    case 'custom':
      throw new Error('Custom frequency requires an explicit cron expression');
    default:
      return `0 ${hourOfDay} * * ${dayOfWeek}`;
  }
}

/**
 * Get the next occurrence from a cron expression using croner.
 */
export function getNextCronOccurrence(cronExpression: string, timezone: string = 'UTC'): Date | null {
  try {
    const job = new Cron(cronExpression, { timezone });
    return job.nextRun() ?? null;
  } catch {
    return null;
  }
}

/**
 * Validate a cron expression.
 */
export function isValidCron(cronExpression: string): boolean {
  try {
    new Cron(cronExpression);
    return true;
  } catch {
    return false;
  }
}

// =============================================
// TIER VALIDATION
// =============================================

const MIN_INTERVAL_MAP: Record<string, number> = {
  'free': Infinity,      // no scheduling
  'starter': 7 * 24 * 60,  // 7 days in minutes
  'pro': 24 * 60,          // 1 day
  'agency': 60,            // 1 hour
  'enterprise': 15,        // 15 minutes
};

/**
 * Validate that the user's tier allows scheduling and the requested frequency.
 */
export async function validateScheduleTier(
  userId: string,
  frequency: ScheduleFrequency,
  cronExpression?: string
): Promise<{ allowed: boolean; reason?: string; tier?: string }> {
  const tierLimits = await getUserTierLimits(userId);
  if (!tierLimits) {
    return { allowed: false, reason: 'Could not determine tier' };
  }

  const tier = (tierLimits as any).tier as string;
  const scheduledAllowed = (tierLimits as any).scheduled_audits as boolean;

  if (!scheduledAllowed) {
    return { allowed: false, reason: 'Your plan does not include scheduled audits. Please upgrade to Starter or above.', tier };
  }

  // Check minimum interval for custom crons
  if (frequency === 'custom' && cronExpression) {
    const minMinutes = MIN_INTERVAL_MAP[tier] ?? Infinity;
    const nextTwo = getNextTwoOccurrences(cronExpression);
    if (nextTwo) {
      const intervalMinutes = (nextTwo[1].getTime() - nextTwo[0].getTime()) / 60000;
      if (intervalMinutes < minMinutes) {
        return {
          allowed: false,
          reason: `Your plan requires at least ${formatInterval(minMinutes)} between scheduled audits.`,
          tier,
        };
      }
    }
  }

  // Check preset frequency against tier
  const presetMinutes: Record<string, number> = {
    daily: 24 * 60,
    weekly: 7 * 24 * 60,
    biweekly: 14 * 24 * 60,
    monthly: 30 * 24 * 60,
  };

  if (frequency !== 'custom') {
    const freqMinutes = presetMinutes[frequency] ?? Infinity;
    const minMinutes = MIN_INTERVAL_MAP[tier] ?? Infinity;
    if (freqMinutes < minMinutes) {
      return {
        allowed: false,
        reason: `Your plan requires at least ${formatInterval(minMinutes)} between scheduled audits.`,
        tier,
      };
    }
  }

  return { allowed: true, tier };
}

function getNextTwoOccurrences(cronExpression: string): [Date, Date] | null {
  try {
    const job = new Cron(cronExpression);
    const first = job.nextRun();
    if (!first) return null;
    const second = job.nextRun(first);
    if (!second) return null;
    return [first, second];
  } catch {
    return null;
  }
}

function formatInterval(minutes: number): string {
  if (minutes >= 24 * 60) return `${Math.round(minutes / (24 * 60))} day(s)`;
  if (minutes >= 60) return `${Math.round(minutes / 60)} hour(s)`;
  return `${minutes} minute(s)`;
}

// =============================================
// CRUD
// =============================================

export async function createSchedule(
  userId: string,
  input: CreateScheduleInput
): Promise<AuditSchedule> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.targetUrl);
  } catch {
    throw Object.assign(new Error('Invalid URL'), { statusCode: 400 });
  }

  const domain = parsedUrl.hostname.replace(/^www\./, '');

  // Find or create site
  const site = await findOrCreateSiteForDomain(userId, domain);

  // Require verified domain for scheduled audits
  if (!site.verified) {
    throw Object.assign(
      new Error('Scheduled audits require a verified domain. Please verify your site first.'),
      { statusCode: 403 }
    );
  }

  // Tier validation
  const tierCheck = await validateScheduleTier(userId, input.frequency, input.cronExpression);
  if (!tierCheck.allowed) {
    throw Object.assign(new Error(tierCheck.reason!), { statusCode: 403 });
  }

  // Resolve cron expression
  let cronExpression: string;
  if (input.frequency === 'custom') {
    if (!input.cronExpression || !isValidCron(input.cronExpression)) {
      throw Object.assign(new Error('Invalid cron expression'), { statusCode: 400 });
    }
    cronExpression = input.cronExpression;
  } else {
    cronExpression = frequencyToCron(input.frequency, input.dayOfWeek, input.hourOfDay);
  }

  const timezone = input.timezone || 'UTC';
  const nextRunAt = getNextCronOccurrence(cronExpression, timezone);

  const result = await pool.query<AuditSchedule>(`
    INSERT INTO audit_schedules (
      user_id, site_id, name, target_url, target_domain, config,
      frequency, cron_expression, next_run_at, timezone,
      notify_on_completion, notify_on_failure
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    userId,
    site.id,
    input.name || `${domain} - ${input.frequency}`,
    input.targetUrl,
    domain,
    JSON.stringify(input.config || {}),
    input.frequency,
    cronExpression,
    nextRunAt?.toISOString() || null,
    timezone,
    input.notifyOnCompletion ?? true,
    input.notifyOnFailure ?? true,
  ]);

  return result.rows[0];
}

export async function updateSchedule(
  userId: string,
  scheduleId: string,
  input: UpdateScheduleInput
): Promise<AuditSchedule> {
  // Fetch existing
  const existing = await pool.query<AuditSchedule>(
    'SELECT * FROM audit_schedules WHERE id = $1 AND user_id = $2',
    [scheduleId, userId]
  );
  if (existing.rows.length === 0) {
    throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  }

  const schedule = existing.rows[0];
  const frequency = input.frequency || schedule.frequency;

  // Re-validate tier if frequency changed
  if (input.frequency) {
    const tierCheck = await validateScheduleTier(userId, input.frequency, input.cronExpression);
    if (!tierCheck.allowed) {
      throw Object.assign(new Error(tierCheck.reason!), { statusCode: 403 });
    }
  }

  // Resolve new cron if frequency or timing changed
  let cronExpression = schedule.cron_expression;
  let needsRecalc = false;

  if (input.frequency || input.dayOfWeek !== undefined || input.hourOfDay !== undefined || input.cronExpression) {
    if (frequency === 'custom') {
      if (input.cronExpression) {
        if (!isValidCron(input.cronExpression)) {
          throw Object.assign(new Error('Invalid cron expression'), { statusCode: 400 });
        }
        cronExpression = input.cronExpression;
      }
    } else {
      cronExpression = frequencyToCron(
        frequency as ScheduleFrequency,
        input.dayOfWeek,
        input.hourOfDay
      );
    }
    needsRecalc = true;
  }

  const timezone = input.timezone || schedule.timezone;
  const nextRunAt = needsRecalc
    ? getNextCronOccurrence(cronExpression, timezone)
    : undefined;

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const addParam = (col: string, val: unknown) => {
    setClauses.push(`${col} = $${idx}`);
    params.push(val);
    idx++;
  };

  if (input.name !== undefined) addParam('name', input.name);
  if (input.frequency) addParam('frequency', input.frequency);
  if (cronExpression !== schedule.cron_expression) addParam('cron_expression', cronExpression);
  if (nextRunAt !== undefined) addParam('next_run_at', nextRunAt?.toISOString() || null);
  if (input.timezone) addParam('timezone', input.timezone);
  if (input.config) addParam('config', JSON.stringify(input.config));
  if (input.notifyOnCompletion !== undefined) addParam('notify_on_completion', input.notifyOnCompletion);
  if (input.notifyOnFailure !== undefined) addParam('notify_on_failure', input.notifyOnFailure);

  if (setClauses.length === 0) {
    return schedule;
  }

  addParam('updated_at', new Date().toISOString());
  params.push(scheduleId, userId);

  const result = await pool.query<AuditSchedule>(`
    UPDATE audit_schedules
    SET ${setClauses.join(', ')}
    WHERE id = $${idx} AND user_id = $${idx + 1}
    RETURNING *
  `, params);

  return result.rows[0];
}

export async function deleteSchedule(userId: string, scheduleId: string): Promise<void> {
  const result = await pool.query(
    'DELETE FROM audit_schedules WHERE id = $1 AND user_id = $2 RETURNING id',
    [scheduleId, userId]
  );
  if (result.rowCount === 0) {
    throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  }
}

export async function getScheduleById(
  userId: string,
  scheduleId: string
): Promise<AuditScheduleWithSite | null> {
  const result = await pool.query<AuditScheduleWithSite>(`
    SELECT s.*, si.name as site_name, si.verified as site_verified
    FROM audit_schedules s
    LEFT JOIN sites si ON si.id = s.site_id
    WHERE s.id = $1 AND s.user_id = $2
  `, [scheduleId, userId]);
  return result.rows[0] || null;
}

export async function getSchedulesByUser(
  userId: string,
  siteId?: string
): Promise<AuditScheduleWithSite[]> {
  const params: unknown[] = [userId];
  let whereClause = 's.user_id = $1';

  if (siteId) {
    whereClause += ' AND s.site_id = $2';
    params.push(siteId);
  }

  const result = await pool.query<AuditScheduleWithSite>(`
    SELECT s.*, si.name as site_name, si.verified as site_verified
    FROM audit_schedules s
    LEFT JOIN sites si ON si.id = s.site_id
    WHERE ${whereClause}
    ORDER BY s.created_at DESC
  `, params);

  return result.rows;
}

export async function toggleSchedule(
  userId: string,
  scheduleId: string,
  enabled: boolean
): Promise<AuditSchedule> {
  // If re-enabling, clear paused reason and recalculate next_run_at
  const existing = await pool.query<AuditSchedule>(
    'SELECT * FROM audit_schedules WHERE id = $1 AND user_id = $2',
    [scheduleId, userId]
  );
  if (existing.rows.length === 0) {
    throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  }

  const schedule = existing.rows[0];

  if (enabled) {
    // Re-validate tier before re-enabling
    const tierCheck = await validateScheduleTier(userId, schedule.frequency as ScheduleFrequency, schedule.cron_expression);
    if (!tierCheck.allowed) {
      throw Object.assign(new Error(tierCheck.reason!), { statusCode: 403 });
    }

    const nextRunAt = getNextCronOccurrence(schedule.cron_expression, schedule.timezone);
    const result = await pool.query<AuditSchedule>(`
      UPDATE audit_schedules
      SET enabled = true, paused_reason = NULL, paused_at = NULL,
          consecutive_failures = 0, next_run_at = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [nextRunAt?.toISOString() || null, scheduleId, userId]);
    return result.rows[0];
  } else {
    const result = await pool.query<AuditSchedule>(`
      UPDATE audit_schedules
      SET enabled = false, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [scheduleId, userId]);
    return result.rows[0];
  }
}

export async function getScheduleRunHistory(
  scheduleId: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ runs: ScheduleRunSummary[]; total: number }> {
  // Verify ownership
  const ownerCheck = await pool.query(
    'SELECT id FROM audit_schedules WHERE id = $1 AND user_id = $2',
    [scheduleId, userId]
  );
  if (ownerCheck.rows.length === 0) {
    throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  }

  const [runsResult, countResult] = await Promise.all([
    pool.query<ScheduleRunSummary>(`
      SELECT id, status, target_url, created_at, completed_at,
             seo_score, accessibility_score, security_score, performance_score, total_issues
      FROM audit_jobs
      WHERE schedule_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [scheduleId, limit, offset]),
    pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM audit_jobs WHERE schedule_id = $1',
      [scheduleId]
    ),
  ]);

  return {
    runs: runsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

// =============================================
// POLLER FUNCTIONS
// =============================================

/**
 * Get schedules that are due to run. Uses FOR UPDATE SKIP LOCKED
 * to prevent duplicate execution across multiple workers.
 */
export async function getDueSchedules(limit: number = 10): Promise<AuditSchedule[]> {
  const result = await pool.query<AuditSchedule>(`
    SELECT *
    FROM audit_schedules
    WHERE enabled = true
      AND paused_reason IS NULL
      AND next_run_at <= NOW()
    ORDER BY next_run_at ASC
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  `, [limit]);
  return result.rows;
}

/**
 * Create an audit job from a schedule. Mirrors the main audit creation logic
 * with tier re-validation and config clamping.
 */
export async function createAuditFromSchedule(
  schedule: AuditSchedule
): Promise<{ auditId: string } | { skipped: true; reason: string }> {
  const userId = schedule.user_id;

  // Re-validate tier
  const tierLimits = await getUserTierLimits(userId);
  if (!tierLimits) {
    return { skipped: true, reason: 'Could not determine tier' };
  }

  const scheduledAllowed = (tierLimits as any).scheduled_audits as boolean;
  if (!scheduledAllowed) {
    return { skipped: true, reason: 'Tier no longer allows scheduled audits' };
  }

  // Check concurrent audit limit
  const maxConcurrent = ((tierLimits as any).concurrent_audits as number) || 3;
  const activeAudits = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')`,
    [userId]
  );

  if (parseInt(activeAudits.rows[0].count, 10) >= maxConcurrent) {
    return { skipped: true, reason: 'Concurrent audit limit reached' };
  }

  // Clamp config to tier limits
  const config = schedule.config || {};
  const maxPagesLimit = ((tierLimits as any).max_pages_per_audit as number) || 1000;
  const maxDepthLimit = ((tierLimits as any).max_audit_depth as number) || 10;
  const maxPages = Math.min((config.maxPages as number) ?? 100, maxPagesLimit);
  const maxDepth = Math.min((config.maxDepth as number) ?? 5, maxDepthLimit);

  const availableChecks = (tierLimits as any).available_checks as string[] | undefined;
  const checkSeo = availableChecks ? availableChecks.includes('seo') : true;
  const checkAccessibility = availableChecks ? availableChecks.includes('accessibility') : true;
  const checkSecurity = availableChecks ? availableChecks.includes('security') : true;
  const checkPerformance = availableChecks ? availableChecks.includes('performance') : true;
  const checkContent = availableChecks ? availableChecks.includes('content') : true;

  // Find or create URL for the site
  let urlId: string | null = null;
  if (schedule.site_id) {
    try {
      const siteUrl = await findOrCreateUrl(schedule.site_id, schedule.target_url, 'audit');
      urlId = siteUrl.id;
    } catch {
      // Non-fatal — continue without URL association
    }
  }

  const result = await pool.query<{ id: string }>(`
    INSERT INTO audit_jobs (
      user_id, site_id, url_id, schedule_id, target_url, target_domain,
      max_pages, max_depth, respect_robots_txt, include_subdomains,
      check_seo, check_accessibility, check_security, check_performance, check_content,
      wcag_version, wcag_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
  `, [
    userId,
    schedule.site_id,
    urlId,
    schedule.id,
    schedule.target_url,
    schedule.target_domain,
    maxPages,
    maxDepth,
    (config.respectRobotsTxt as boolean) ?? true,
    (config.includeSubdomains as boolean) ?? false,
    checkSeo,
    checkAccessibility,
    checkSecurity,
    checkPerformance,
    checkContent,
    (config.wcagVersion as string) ?? '2.2',
    (config.wcagLevel as string) ?? 'AA',
  ]);

  return { auditId: result.rows[0].id };
}

/**
 * Update schedule state after a run.
 */
export async function markScheduleRun(
  scheduleId: string,
  status: 'completed' | 'failed',
  auditId: string | null,
  nextRunAt: Date | null
): Promise<void> {
  await pool.query(`
    UPDATE audit_schedules
    SET last_run_at = NOW(),
        last_status = $2,
        last_audit_id = $3,
        next_run_at = $4,
        run_count = run_count + 1,
        failure_count = CASE WHEN $2 = 'failed' THEN failure_count + 1 ELSE failure_count END,
        consecutive_failures = CASE WHEN $2 = 'failed' THEN consecutive_failures + 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = $1
  `, [scheduleId, status, auditId, nextRunAt?.toISOString() || null]);
}

/**
 * Auto-pause a schedule (e.g., after too many consecutive failures).
 */
export async function pauseSchedule(scheduleId: string, reason: string): Promise<void> {
  await pool.query(`
    UPDATE audit_schedules
    SET paused_reason = $2, paused_at = NOW(), updated_at = NOW()
    WHERE id = $1
  `, [scheduleId, reason]);
}

// =============================================
// ADMIN FUNCTIONS
// =============================================

export async function getAdminSchedulesList(
  filters: { status?: string; search?: string; page?: number; limit?: number }
): Promise<{ schedules: any[]; total: number }> {
  const { status, search, page = 1, limit = 25 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status === 'active') {
    conditions.push(`s.enabled = true AND s.paused_reason IS NULL`);
  } else if (status === 'paused') {
    conditions.push(`s.paused_reason IS NOT NULL`);
  } else if (status === 'disabled') {
    conditions.push(`s.enabled = false`);
  }

  if (search) {
    conditions.push(`(s.target_domain ILIKE $${idx} OR s.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    pool.query(`
      SELECT s.*, u.email as user_email, u.first_name, si.name as site_name
      FROM audit_schedules s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN sites si ON si.id = s.site_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM audit_schedules s
      JOIN users u ON u.id = s.user_id
      ${whereClause}
    `, params),
  ]);

  return {
    schedules: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getAdminScheduleStats(): Promise<{
  total: number;
  active: number;
  paused: number;
  disabled: number;
  ranToday: number;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE enabled = true AND paused_reason IS NULL) as active,
      COUNT(*) FILTER (WHERE paused_reason IS NOT NULL) as paused,
      COUNT(*) FILTER (WHERE enabled = false) as disabled,
      COUNT(*) FILTER (WHERE last_run_at >= CURRENT_DATE) as ran_today
    FROM audit_schedules
  `);

  const row = result.rows[0];
  return {
    total: parseInt(row.total, 10),
    active: parseInt(row.active, 10),
    paused: parseInt(row.paused, 10),
    disabled: parseInt(row.disabled, 10),
    ranToday: parseInt(row.ran_today, 10),
  };
}

export async function adminGetScheduleById(scheduleId: string): Promise<any | null> {
  const result = await pool.query(`
    SELECT s.*, u.email as user_email, u.first_name, si.name as site_name, si.verified as site_verified
    FROM audit_schedules s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN sites si ON si.id = s.site_id
    WHERE s.id = $1
  `, [scheduleId]);
  return result.rows[0] || null;
}

export async function adminUpdateSchedule(
  scheduleId: string,
  updates: { enabled?: boolean; paused_reason?: string | null; max_consecutive_failures?: number }
): Promise<any> {
  const setClauses: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [];
  let idx = 1;

  if (updates.enabled !== undefined) {
    setClauses.push(`enabled = $${idx}`);
    params.push(updates.enabled);
    idx++;

    if (updates.enabled) {
      setClauses.push(`paused_reason = NULL`);
      setClauses.push(`paused_at = NULL`);
      setClauses.push(`consecutive_failures = 0`);
    }
  }

  if (updates.paused_reason !== undefined) {
    setClauses.push(`paused_reason = $${idx}`);
    params.push(updates.paused_reason);
    idx++;
    if (updates.paused_reason) {
      setClauses.push(`paused_at = NOW()`);
    }
  }

  if (updates.max_consecutive_failures !== undefined) {
    setClauses.push(`max_consecutive_failures = $${idx}`);
    params.push(updates.max_consecutive_failures);
    idx++;
  }

  params.push(scheduleId);

  const result = await pool.query(`
    UPDATE audit_schedules
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `, params);

  return result.rows[0] || null;
}

export async function adminDeleteSchedule(scheduleId: string): Promise<void> {
  await pool.query('DELETE FROM audit_schedules WHERE id = $1', [scheduleId]);
}
