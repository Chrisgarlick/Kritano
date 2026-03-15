/**
 * Lead Scoring Service
 *
 * Calculates lead scores and statuses for the CRM module.
 * Scores are recalculated on relevant events (idempotent).
 * Status is derived from score + behavior, not set manually.
 */

import { pool } from '../db/index.js';

// =============================================
// Types
// =============================================

export type LeadStatus =
  | 'new'
  | 'activated'
  | 'engaged'
  | 'power_user'
  | 'upgrade_prospect'
  | 'churning'
  | 'churned';

export interface LeadProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  lead_score: number;
  lead_status: LeadStatus;
  lead_score_updated_at: string | null;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  // Enriched data
  tier: string;
  total_audits: number;
  completed_audits: number;
  total_sites: number;
  verified_domains: number;
  team_members: number;
  has_exported_pdf: boolean;
}

export interface LeadBoardFilters {
  status?: LeadStatus;
  search?: string;
  sort?: 'lead_score' | 'created_at' | 'last_login_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LeadBoardResult {
  leads: LeadProfile[];
  total: number;
}

export interface LeadStats {
  total: number;
  by_status: Record<LeadStatus, number>;
  avg_score: number;
}

export interface LeadTimeline {
  event: string;
  detail: string;
  timestamp: string;
}

export interface LeadMembership {
  site_id: string;
  site_name: string;
  site_domain: string;
  role: string;
  tier: string;
  verified: boolean;
  last_audit_at: string | null;
  audit_count: number;
}

// =============================================
// Score Calculation
// =============================================

/**
 * Recalculate lead score for a single user.
 * Idempotent — checks current state, not event count.
 */
export async function recalculateScore(userId: string): Promise<{ score: number; status: LeadStatus }> {
  const client = await pool.connect();
  try {
    // Gather all scoring signals in parallel queries
    const [userRow, auditStats, siteStats, domainStats, teamStats, usageStats] = await Promise.all([
      client.query(
        `SELECT email_verified, last_login_at, created_at FROM users WHERE id = $1`,
        [userId]
      ),
      client.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(DISTINCT target_url) as unique_urls,
          COUNT(DISTINCT site_id) as unique_sites
        FROM audit_jobs WHERE user_id = $1`,
        [userId]
      ),
      client.query(
        `SELECT COUNT(*) as count FROM sites WHERE created_by = $1`,
        [userId]
      ),
      client.query(
        `SELECT COUNT(*) as count
         FROM sites s
         WHERE s.created_by = $1 AND s.verified = true`,
        [userId]
      ),
      client.query(
        `SELECT COUNT(DISTINCT ss.user_id) as count
         FROM site_shares ss
         JOIN sites s ON ss.site_id = s.id
         WHERE s.created_by = $1 AND ss.user_id != $1`,
        [userId]
      ),
      client.query(
        `SELECT
          COALESCE(SUM(ur.exports_count), 0) as exports,
          COALESCE(MAX(ur.audits_count), 0) as period_audits
        FROM usage_records ur
        JOIN sites s ON s.organization_id = ur.organization_id
        WHERE s.created_by = $1`,
        [userId]
      ),
    ]);

    const user = userRow.rows[0];
    if (!user) return { score: 0, status: 'new' };

    const completedAudits = parseInt(auditStats.rows[0].completed) || 0;
    const uniqueUrls = parseInt(auditStats.rows[0].unique_urls) || 0;
    const siteCount = parseInt(siteStats.rows[0].count) || 0;
    const verifiedDomains = parseInt(domainStats.rows[0].count) || 0;
    const teamMembers = parseInt(teamStats.rows[0].count) || 0;
    const exports = parseInt(usageStats.rows[0].exports) || 0;

    // Calculate score
    let score = 0;

    // Account created: +5
    score += 5;

    // Email verified: +10
    if (user.email_verified) score += 10;

    // First audit completed: +15
    if (completedAudits >= 1) score += 15;

    // Domain verified: +30
    if (verifiedDomains >= 1) score += 30;

    // 3+ completed audits: +20
    if (completedAudits >= 3) score += 20;

    // 3+ unique URLs on any site (agency signal): +25
    if (uniqueUrls >= 3) score += 25;

    // 10+ completed audits: +30
    if (completedAudits >= 10) score += 30;

    // Added team member: +15
    if (teamMembers > 0) score += 15;

    // Exported PDF: +10
    if (exports > 0) score += 10;

    // Check if hitting tier limits: site limit +40, audit limit +35
    const tierLimitResult = await client.query(
      `SELECT tl.max_domains, tl.max_audits_per_month
       FROM subscriptions sub
       JOIN sites s ON s.organization_id = sub.organization_id
       JOIN tier_limits tl ON tl.tier = sub.tier
       WHERE s.created_by = $1
       LIMIT 1`,
      [userId]
    );

    if (tierLimitResult.rows.length > 0) {
      const limits = tierLimitResult.rows[0];
      if (limits.max_domains && siteCount >= limits.max_domains) score += 40;
      // Monthly audit limit check
      const monthlyAudits = await client.query(
        `SELECT COUNT(*) as count FROM audit_jobs
         WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
        [userId]
      );
      const monthCount = parseInt(monthlyAudits.rows[0].count) || 0;
      if (limits.max_audits_per_month && monthCount >= limits.max_audits_per_month) score += 35;
    }

    // Inactivity decay
    if (user.last_login_at) {
      const daysSinceLogin = Math.floor(
        (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLogin >= 30) score -= 30;
      else if (daysSinceLogin >= 14) score -= 20;
      else if (daysSinceLogin >= 7) score -= 10;
    }

    // Floor at 0
    score = Math.max(0, score);

    // Derive status
    const status = deriveStatus(score, user.last_login_at);

    // Get the user's current tier
    const tierResult = await client.query(
      `SELECT sub.tier::text FROM subscriptions sub
       JOIN sites s ON s.organization_id = sub.organization_id
       WHERE s.created_by = $1
       LIMIT 1`,
      [userId]
    );
    const tier = tierResult.rows[0]?.tier || 'free';

    // Override status for upgrade prospects
    let finalStatus = status;
    if (score >= 50 && tier === 'free' && status !== 'churning' && status !== 'churned') {
      finalStatus = 'upgrade_prospect';
    }

    // Save
    await client.query(
      `UPDATE users SET lead_score = $1, lead_status = $2, lead_score_updated_at = NOW() WHERE id = $3`,
      [score, finalStatus, userId]
    );

    return { score, status: finalStatus };
  } finally {
    client.release();
  }
}

/**
 * Derive lead status from score and last login.
 */
function deriveStatus(score: number, lastLoginAt: string | null): LeadStatus {
  if (lastLoginAt) {
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin >= 60) return 'churned';
    if (daysSinceLogin >= 14 && score > 30) return 'churning';
  }

  if (score >= 70) return 'power_user';
  if (score >= 40) return 'engaged';
  if (score >= 15) return 'activated';
  return 'new';
}

// =============================================
// Lead Board
// =============================================

/**
 * Get paginated lead board for admin CRM view.
 */
export async function getLeadBoard(filters: LeadBoardFilters): Promise<LeadBoardResult> {
  const {
    status,
    search,
    sort = 'lead_score',
    order = 'desc',
    page = 1,
    limit = 50,
  } = filters;

  const conditions: string[] = [`u.status != 'deleted'`];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`u.lead_status = $${paramIdx++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(u.email ILIKE $${paramIdx} OR u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSorts: Record<string, string> = {
    lead_score: 'u.lead_score',
    created_at: 'u.created_at',
    last_login_at: 'u.last_login_at',
  };
  const sortCol = allowedSorts[sort] || 'u.lead_score';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT
        u.id, u.email, u.first_name, u.last_name,
        u.lead_score, u.lead_status, u.lead_score_updated_at,
        u.email_verified, u.last_login_at, u.created_at,
        COALESCE(sub.tier, 'free') as tier,
        COALESCE(audit_counts.total, 0) as total_audits,
        COALESCE(audit_counts.completed, 0) as completed_audits,
        COALESCE(site_counts.count, 0) as total_sites,
        COALESCE(domain_counts.count, 0) as verified_domains,
        COALESCE(team_counts.count, 0) as team_members,
        COALESCE(usage_counts.exports, 0) > 0 as has_exported_pdf
      FROM users u
      LEFT JOIN LATERAL (
        SELECT sub2.tier FROM subscriptions sub2
        JOIN sites s ON s.organization_id = sub2.organization_id
        WHERE s.created_by = u.id LIMIT 1
      ) sub ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM audit_jobs WHERE user_id = u.id
      ) audit_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM sites WHERE created_by = u.id
      ) site_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM sites WHERE created_by = u.id AND verified = true
      ) domain_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT ss.user_id) as count
        FROM site_shares ss JOIN sites s ON ss.site_id = s.id
        WHERE s.created_by = u.id AND ss.user_id != u.id
      ) team_counts ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(ur.exports_count), 0) as exports
        FROM usage_records ur JOIN sites s ON s.organization_id = ur.organization_id
        WHERE s.created_by = u.id
      ) usage_counts ON true
      ${where}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM users u ${where}`,
      params
    ),
  ]);

  return {
    leads: dataResult.rows.map(row => ({
      ...row,
      total_audits: parseInt(row.total_audits) || 0,
      completed_audits: parseInt(row.completed_audits) || 0,
      total_sites: parseInt(row.total_sites) || 0,
      verified_domains: parseInt(row.verified_domains) || 0,
      team_members: parseInt(row.team_members) || 0,
    })),
    total: parseInt(countResult.rows[0].count) || 0,
  };
}

// =============================================
// Lead Profile
// =============================================

/**
 * Get detailed lead profile for CRM view.
 */
export async function getLeadProfile(userId: string): Promise<LeadProfile | null> {
  const result = await pool.query(
    `SELECT
      u.id, u.email, u.first_name, u.last_name,
      u.lead_score, u.lead_status, u.lead_score_updated_at,
      u.email_verified, u.last_login_at, u.created_at,
      COALESCE(sub.tier, 'free') as tier,
      COALESCE(audit_counts.total, 0) as total_audits,
      COALESCE(audit_counts.completed, 0) as completed_audits,
      COALESCE(site_counts.count, 0) as total_sites,
      COALESCE(domain_counts.count, 0) as verified_domains,
      COALESCE(team_counts.count, 0) as team_members,
      COALESCE(usage_counts.exports, 0) > 0 as has_exported_pdf
    FROM users u
    LEFT JOIN LATERAL (
      SELECT sub2.tier FROM subscriptions sub2
      JOIN organization_members om ON om.organization_id = sub2.organization_id
      WHERE om.user_id = u.id AND sub2.status IN ('active', 'trialing')
      ORDER BY sub2.created_at DESC LIMIT 1
    ) sub ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM audit_jobs WHERE user_id = u.id
    ) audit_counts ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count FROM sites WHERE created_by = u.id
    ) site_counts ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count FROM sites WHERE created_by = u.id AND verified = true
    ) domain_counts ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT ss.user_id) as count
      FROM site_shares ss JOIN sites s ON ss.site_id = s.id
      WHERE s.created_by = u.id AND ss.user_id != u.id
    ) team_counts ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(ur.exports_count), 0) as exports
      FROM usage_records ur JOIN sites s ON s.organization_id = ur.organization_id
      WHERE s.created_by = u.id
    ) usage_counts ON true
    WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    total_audits: parseInt(row.total_audits) || 0,
    completed_audits: parseInt(row.completed_audits) || 0,
    total_sites: parseInt(row.total_sites) || 0,
    verified_domains: parseInt(row.verified_domains) || 0,
    team_members: parseInt(row.team_members) || 0,
  };
}

/**
 * Get timeline events for a lead.
 */
export async function getLeadTimeline(userId: string): Promise<LeadTimeline[]> {
  const events: LeadTimeline[] = [];

  // Registration
  const userResult = await pool.query(
    `SELECT created_at, email_verified, last_login_at FROM users WHERE id = $1`,
    [userId]
  );
  if (userResult.rows.length === 0) return events;
  const user = userResult.rows[0];
  events.push({ event: 'registered', detail: 'Account created', timestamp: user.created_at });

  // Email verification
  if (user.email_verified) {
    events.push({ event: 'email_verified', detail: 'Email verified', timestamp: user.created_at });
  }

  // Audits (first, milestones)
  const audits = await pool.query(
    `SELECT id, target_url, target_domain, status, created_at, completed_at,
            seo_score, accessibility_score, security_score, performance_score
     FROM audit_jobs WHERE user_id = $1 AND status = 'completed'
     ORDER BY created_at ASC`,
    [userId]
  );

  audits.rows.forEach((audit, idx) => {
    if (idx === 0) {
      events.push({
        event: 'first_audit',
        detail: `First audit completed: ${audit.target_domain}`,
        timestamp: audit.completed_at || audit.created_at,
      });
    }
    if (idx === 2) {
      events.push({
        event: 'milestone_3_audits',
        detail: '3 audits completed',
        timestamp: audit.completed_at || audit.created_at,
      });
    }
    if (idx === 9) {
      events.push({
        event: 'milestone_10_audits',
        detail: '10 audits completed',
        timestamp: audit.completed_at || audit.created_at,
      });
    }
  });

  // Domain verifications
  const domains = await pool.query(
    `SELECT s.domain, s.verified_at FROM sites s
     WHERE s.created_by = $1 AND s.verified = true AND s.verified_at IS NOT NULL
     ORDER BY s.verified_at ASC`,
    [userId]
  );
  domains.rows.forEach(d => {
    events.push({
      event: 'domain_verified',
      detail: `Domain verified: ${d.domain}`,
      timestamp: d.verified_at,
    });
  });

  // Team members added
  const members = await pool.query(
    `SELECT ss.created_at, u.email, s.domain
     FROM site_shares ss
     JOIN sites s ON ss.site_id = s.id
     JOIN users u ON ss.user_id = u.id
     WHERE s.created_by = $1 AND ss.user_id != $1
     ORDER BY ss.created_at ASC`,
    [userId]
  );
  members.rows.forEach(m => {
    events.push({
      event: 'team_member_added',
      detail: `Team member added: ${m.email} on ${m.domain}`,
      timestamp: m.created_at,
    });
  });

  // Triggers
  const triggers = await pool.query(
    `SELECT trigger_type, context, created_at FROM crm_triggers
     WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  triggers.rows.forEach(t => {
    events.push({
      event: `trigger_${t.trigger_type}`,
      detail: `Trigger: ${t.trigger_type.replace(/_/g, ' ')}`,
      timestamp: t.created_at,
    });
  });

  // Sort by timestamp descending (most recent first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

/**
 * Get memberships (sites + role) for a lead.
 */
export async function getLeadMemberships(userId: string): Promise<LeadMembership[]> {
  const result = await pool.query(
    `SELECT
      s.id as site_id, s.name as site_name, s.domain as site_domain,
      CASE WHEN s.created_by = $1 THEN 'owner' ELSE COALESCE(ss.permission::text, 'viewer') END as role,
      COALESCE(sub.tier::text, 'free') as tier,
      s.verified,
      latest_audit.completed_at as last_audit_at,
      COALESCE(audit_count.count, 0) as audit_count
    FROM sites s
    LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $1
    LEFT JOIN LATERAL (
      SELECT tier FROM subscriptions
      WHERE organization_id = s.organization_id AND status IN ('active', 'trialing')
      ORDER BY created_at DESC LIMIT 1
    ) sub ON true
    LEFT JOIN LATERAL (
      SELECT completed_at FROM audit_jobs
      WHERE site_id = s.id AND status = 'completed'
      ORDER BY completed_at DESC NULLS LAST LIMIT 1
    ) latest_audit ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count FROM audit_jobs WHERE site_id = s.id AND status = 'completed'
    ) audit_count ON true
    WHERE s.created_by = $1 OR ss.user_id = $1
    ORDER BY s.domain ASC`,
    [userId]
  );

  return result.rows.map(row => ({
    ...row,
    audit_count: parseInt(row.audit_count) || 0,
  }));
}

// =============================================
// Stats
// =============================================

/**
 * Get lead funnel stats by status.
 */
export async function getLeadStats(): Promise<LeadStats> {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total,
      AVG(lead_score) as avg_score,
      COUNT(*) FILTER (WHERE lead_status = 'new') as new,
      COUNT(*) FILTER (WHERE lead_status = 'activated') as activated,
      COUNT(*) FILTER (WHERE lead_status = 'engaged') as engaged,
      COUNT(*) FILTER (WHERE lead_status = 'power_user') as power_user,
      COUNT(*) FILTER (WHERE lead_status = 'upgrade_prospect') as upgrade_prospect,
      COUNT(*) FILTER (WHERE lead_status = 'churning') as churning,
      COUNT(*) FILTER (WHERE lead_status = 'churned') as churned
    FROM users
    WHERE status != 'deleted'`
  );

  const row = result.rows[0];
  return {
    total: parseInt(row.total) || 0,
    avg_score: Math.round(parseFloat(row.avg_score) || 0),
    by_status: {
      new: parseInt(row.new) || 0,
      activated: parseInt(row.activated) || 0,
      engaged: parseInt(row.engaged) || 0,
      power_user: parseInt(row.power_user) || 0,
      upgrade_prospect: parseInt(row.upgrade_prospect) || 0,
      churning: parseInt(row.churning) || 0,
      churned: parseInt(row.churned) || 0,
    },
  };
}

// =============================================
// Batch Operations
// =============================================

/**
 * Batch recalculate scores for all users.
 * Used for nightly jobs and initial backfill.
 */
export async function batchRecalculate(): Promise<{ processed: number; errors: number }> {
  const result = await pool.query(
    `SELECT id FROM users WHERE status != 'deleted' ORDER BY id`
  );

  let processed = 0;
  let errors = 0;

  for (const row of result.rows) {
    try {
      await recalculateScore(row.id);
      processed++;
    } catch (err) {
      console.error(`Failed to recalculate score for user ${row.id}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}
