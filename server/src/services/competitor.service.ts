import { Pool } from 'pg';
import type {
  CompetitorProfile,
  CompetitorProfileWithLatestAudit,
  AuditComparison,
  AuditComparisonWithAudits,
  ScoresDiff,
  CategoryScores,
  FindingsDiff,
  FindingSummary,
  ComparisonRecommendation,
  CreateCompetitorInput,
  UpdateCompetitorInput,
  CreateComparisonInput,
} from '../types/competitor.types.js';
import { getOrganizationLimits } from './organization.service.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// COMPETITOR PROFILES
// =============================================

/**
 * Create a competitor profile
 */
export async function createCompetitor(
  organizationId: string,
  userId: string,
  input: CreateCompetitorInput
): Promise<CompetitorProfile> {
  // Normalize domain
  const domain = normalizeDomain(input.domain);

  // Check competitor limit
  const canAdd = await checkCompetitorLimit(organizationId);
  if (!canAdd.allowed) {
    throw new Error(canAdd.reason || 'Competitor limit reached');
  }

  // Check if domain already exists
  const existing = await pool.query(
    'SELECT id FROM competitor_profiles WHERE organization_id = $1 AND domain = $2',
    [organizationId, domain]
  );
  if (existing.rows.length > 0) {
    throw new Error('This competitor domain already exists');
  }

  const result = await pool.query<CompetitorProfile>(
    `INSERT INTO competitor_profiles (organization_id, domain, name, notes, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [organizationId, domain, input.name || null, input.notes || null, userId]
  );

  return result.rows[0];
}

/**
 * Get all competitors for an organization
 */
export async function getCompetitors(
  organizationId: string
): Promise<CompetitorProfileWithLatestAudit[]> {
  const result = await pool.query<CompetitorProfileWithLatestAudit>(
    `SELECT
      cp.*,
      aj.id as latest_audit_id,
      aj.completed_at as latest_audit_completed_at,
      aj.seo_score as latest_seo_score,
      aj.accessibility_score as latest_accessibility_score,
      aj.security_score as latest_security_score,
      aj.performance_score as latest_performance_score
     FROM competitor_profiles cp
     LEFT JOIN LATERAL (
       SELECT id, completed_at, seo_score, accessibility_score, security_score, performance_score
       FROM audit_jobs
       WHERE competitor_profile_id = cp.id AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1
     ) aj ON true
     WHERE cp.organization_id = $1
     ORDER BY cp.created_at DESC`,
    [organizationId]
  );

  return result.rows;
}

/**
 * Get a single competitor by ID
 */
export async function getCompetitorById(
  competitorId: string
): Promise<CompetitorProfile | null> {
  const result = await pool.query<CompetitorProfile>(
    'SELECT * FROM competitor_profiles WHERE id = $1',
    [competitorId]
  );
  return result.rows[0] || null;
}

/**
 * Update a competitor profile
 */
export async function updateCompetitor(
  competitorId: string,
  input: UpdateCompetitorInput
): Promise<CompetitorProfile> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(input.notes);
  }

  if (updates.length === 0) {
    const competitor = await getCompetitorById(competitorId);
    if (!competitor) throw new Error('Competitor not found');
    return competitor;
  }

  values.push(competitorId);
  const result = await pool.query<CompetitorProfile>(
    `UPDATE competitor_profiles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Competitor not found');
  }

  return result.rows[0];
}

/**
 * Delete a competitor profile
 */
export async function deleteCompetitor(competitorId: string): Promise<void> {
  await pool.query('DELETE FROM competitor_profiles WHERE id = $1', [competitorId]);
}

/**
 * Get audits for a competitor
 */
export async function getCompetitorAudits(competitorId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT id, target_url, target_domain, status,
            seo_score, accessibility_score, security_score, performance_score,
            total_issues, pages_crawled, started_at, completed_at, created_at
     FROM audit_jobs
     WHERE competitor_profile_id = $1
     ORDER BY created_at DESC`,
    [competitorId]
  );
  return result.rows;
}

// =============================================
// COMPETITOR DOMAIN LIMITS
// =============================================

/**
 * Check if organization can add more competitor domains this period
 */
export async function checkCompetitorLimit(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; used: number; max: number | null }> {
  const limits = await getOrganizationLimits(organizationId);

  if (!limits?.competitor_comparison) {
    return {
      allowed: false,
      reason: 'Competitor comparison is not available on your plan. Upgrade to Pro or higher.',
      used: 0,
      max: 0,
    };
  }

  const maxCompetitorDomains = limits.max_competitor_domains;

  // If unlimited, allow
  if (maxCompetitorDomains === null) {
    return { allowed: true, used: 0, max: null };
  }

  // Count unique competitor domains audited this billing period
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(DISTINCT target_domain) as count
     FROM audit_jobs
     WHERE organization_id = $1
       AND is_competitor = TRUE
       AND created_at >= $2`,
    [organizationId, periodStart]
  );

  const used = parseInt(result.rows[0].count, 10);

  if (used >= maxCompetitorDomains) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${maxCompetitorDomains} competitor domains this month. Upgrade your plan or wait until next month.`,
      used,
      max: maxCompetitorDomains,
    };
  }

  return { allowed: true, used, max: maxCompetitorDomains };
}

/**
 * Get competitor domain usage for the current period
 */
export async function getCompetitorUsage(
  organizationId: string
): Promise<{ domains: number; domainsUsed: string[]; max: number | null }> {
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const result = await pool.query<{ domain: string }>(
    `SELECT DISTINCT target_domain as domain
     FROM audit_jobs
     WHERE organization_id = $1
       AND is_competitor = TRUE
       AND created_at >= $2`,
    [organizationId, periodStart]
  );

  const domainsUsed = result.rows.map(r => r.domain);
  const limits = await getOrganizationLimits(organizationId);

  return {
    domains: domainsUsed.length,
    domainsUsed,
    max: limits?.max_competitor_domains ?? null,
  };
}

// =============================================
// COMPARISONS
// =============================================

/**
 * Create a comparison between two audits
 */
export async function createComparison(
  organizationId: string,
  userId: string,
  input: CreateComparisonInput
): Promise<AuditComparison> {
  // Verify both audits exist and belong to this org
  const audits = await pool.query(
    `SELECT id, is_competitor, status FROM audit_jobs
     WHERE id IN ($1, $2) AND organization_id = $3`,
    [input.myAuditId, input.competitorAuditId, organizationId]
  );

  if (audits.rows.length !== 2) {
    throw new Error('One or both audits not found');
  }

  // Verify at least one is a competitor audit
  const hasCompetitor = audits.rows.some(a => a.is_competitor);
  if (!hasCompetitor) {
    throw new Error('At least one audit must be a competitor audit');
  }

  // Verify both are completed
  const allCompleted = audits.rows.every(a => a.status === 'completed');
  if (!allCompleted) {
    throw new Error('Both audits must be completed before comparing');
  }

  const result = await pool.query<AuditComparison>(
    `INSERT INTO audit_comparisons (organization_id, name, my_audit_id, competitor_audit_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [organizationId, input.name || null, input.myAuditId, input.competitorAuditId, userId]
  );

  return result.rows[0];
}

/**
 * Get all comparisons for an organization
 */
export async function getComparisons(
  organizationId: string
): Promise<AuditComparisonWithAudits[]> {
  const result = await pool.query(
    `SELECT
      ac.*,
      a1.id as my_id, a1.target_url as my_url, a1.target_domain as my_domain,
      a1.seo_score as my_seo, a1.accessibility_score as my_acc,
      a1.security_score as my_sec, a1.performance_score as my_perf,
      a1.completed_at as my_completed,
      a2.id as comp_id, a2.target_url as comp_url, a2.target_domain as comp_domain,
      a2.seo_score as comp_seo, a2.accessibility_score as comp_acc,
      a2.security_score as comp_sec, a2.performance_score as comp_perf,
      a2.completed_at as comp_completed
     FROM audit_comparisons ac
     JOIN audit_jobs a1 ON ac.my_audit_id = a1.id
     JOIN audit_jobs a2 ON ac.competitor_audit_id = a2.id
     WHERE ac.organization_id = $1
     ORDER BY ac.created_at DESC`,
    [organizationId]
  );

  return result.rows.map(row => ({
    id: row.id,
    organization_id: row.organization_id,
    name: row.name,
    my_audit_id: row.my_audit_id,
    competitor_audit_id: row.competitor_audit_id,
    created_by: row.created_by,
    created_at: row.created_at,
    my_audit: {
      id: row.my_id,
      target_url: row.my_url,
      target_domain: row.my_domain,
      seo_score: row.my_seo,
      accessibility_score: row.my_acc,
      security_score: row.my_sec,
      performance_score: row.my_perf,
      completed_at: row.my_completed,
    },
    competitor_audit: {
      id: row.comp_id,
      target_url: row.comp_url,
      target_domain: row.comp_domain,
      seo_score: row.comp_seo,
      accessibility_score: row.comp_acc,
      security_score: row.comp_sec,
      performance_score: row.comp_perf,
      completed_at: row.comp_completed,
    },
  }));
}

/**
 * Get a single comparison by ID
 */
export async function getComparisonById(
  comparisonId: string
): Promise<AuditComparisonWithAudits | null> {
  const result = await pool.query(
    `SELECT
      ac.*,
      a1.id as my_id, a1.target_url as my_url, a1.target_domain as my_domain,
      a1.seo_score as my_seo, a1.accessibility_score as my_acc,
      a1.security_score as my_sec, a1.performance_score as my_perf,
      a1.completed_at as my_completed,
      a2.id as comp_id, a2.target_url as comp_url, a2.target_domain as comp_domain,
      a2.seo_score as comp_seo, a2.accessibility_score as comp_acc,
      a2.security_score as comp_sec, a2.performance_score as comp_perf,
      a2.completed_at as comp_completed
     FROM audit_comparisons ac
     JOIN audit_jobs a1 ON ac.my_audit_id = a1.id
     JOIN audit_jobs a2 ON ac.competitor_audit_id = a2.id
     WHERE ac.id = $1`,
    [comparisonId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    organization_id: row.organization_id,
    name: row.name,
    my_audit_id: row.my_audit_id,
    competitor_audit_id: row.competitor_audit_id,
    created_by: row.created_by,
    created_at: row.created_at,
    my_audit: {
      id: row.my_id,
      target_url: row.my_url,
      target_domain: row.my_domain,
      seo_score: row.my_seo,
      accessibility_score: row.my_acc,
      security_score: row.my_sec,
      performance_score: row.my_perf,
      completed_at: row.my_completed,
    },
    competitor_audit: {
      id: row.comp_id,
      target_url: row.comp_url,
      target_domain: row.comp_domain,
      seo_score: row.comp_seo,
      accessibility_score: row.comp_acc,
      security_score: row.comp_sec,
      performance_score: row.comp_perf,
      completed_at: row.comp_completed,
    },
  };
}

/**
 * Delete a comparison
 */
export async function deleteComparison(comparisonId: string): Promise<void> {
  await pool.query('DELETE FROM audit_comparisons WHERE id = $1', [comparisonId]);
}

// =============================================
// COMPARISON ANALYSIS
// =============================================

/**
 * Get score differences between two audits
 */
export async function getScoresDiff(
  myAuditId: string,
  competitorAuditId: string
): Promise<ScoresDiff> {
  const result = await pool.query(
    `SELECT
      a1.seo_score as my_seo, a1.accessibility_score as my_acc,
      a1.security_score as my_sec, a1.performance_score as my_perf,
      a2.seo_score as comp_seo, a2.accessibility_score as comp_acc,
      a2.security_score as comp_sec, a2.performance_score as comp_perf
     FROM audit_jobs a1, audit_jobs a2
     WHERE a1.id = $1 AND a2.id = $2`,
    [myAuditId, competitorAuditId]
  );

  if (result.rows.length === 0) {
    throw new Error('Audits not found');
  }

  const row = result.rows[0];

  const my: CategoryScores = {
    seo: row.my_seo,
    accessibility: row.my_acc,
    security: row.my_sec,
    performance: row.my_perf,
    overall: calculateOverall(row.my_seo, row.my_acc, row.my_sec, row.my_perf),
  };

  const competitor: CategoryScores = {
    seo: row.comp_seo,
    accessibility: row.comp_acc,
    security: row.comp_sec,
    performance: row.comp_perf,
    overall: calculateOverall(row.comp_seo, row.comp_acc, row.comp_sec, row.comp_perf),
  };

  const diff: CategoryScores = {
    seo: calculateDiff(my.seo, competitor.seo),
    accessibility: calculateDiff(my.accessibility, competitor.accessibility),
    security: calculateDiff(my.security, competitor.security),
    performance: calculateDiff(my.performance, competitor.performance),
    overall: calculateDiff(my.overall, competitor.overall),
  };

  return { my, competitor, diff };
}

/**
 * Get findings differences between two audits
 */
export async function getFindingsDiff(
  myAuditId: string,
  competitorAuditId: string,
  category?: string,
  severity?: string
): Promise<FindingsDiff> {
  // Build WHERE clause for optional filters
  let filterClause = '';
  const filterParams: string[] = [];
  let paramOffset = 2;

  if (category) {
    filterClause += ` AND f.category = $${++paramOffset}`;
    filterParams.push(category);
  }
  if (severity) {
    filterClause += ` AND f.severity = $${++paramOffset}`;
    filterParams.push(severity);
  }

  // Findings only in my audit
  const onlyInMineResult = await pool.query<FindingSummary>(
    `SELECT DISTINCT f.rule_id, f.rule_name, f.category, f.severity, COUNT(*) as count
     FROM audit_findings f
     WHERE f.audit_job_id = $1 ${filterClause}
     AND f.rule_id NOT IN (
       SELECT rule_id FROM audit_findings WHERE audit_job_id = $2
     )
     GROUP BY f.rule_id, f.rule_name, f.category, f.severity
     ORDER BY
       CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END`,
    [myAuditId, competitorAuditId, ...filterParams]
  );

  // Findings only in competitor audit
  const onlyInCompetitorResult = await pool.query<FindingSummary>(
    `SELECT DISTINCT f.rule_id, f.rule_name, f.category, f.severity, COUNT(*) as count
     FROM audit_findings f
     WHERE f.audit_job_id = $2 ${filterClause.replace(/\$3/g, '$' + (paramOffset + 1)).replace(/\$4/g, '$' + (paramOffset + 2))}
     AND f.rule_id NOT IN (
       SELECT rule_id FROM audit_findings WHERE audit_job_id = $1
     )
     GROUP BY f.rule_id, f.rule_name, f.category, f.severity
     ORDER BY
       CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END`,
    [myAuditId, competitorAuditId, ...filterParams]
  );

  // Findings in both
  const inBothResult = await pool.query<FindingSummary>(
    `SELECT DISTINCT f1.rule_id, f1.rule_name, f1.category, f1.severity, COUNT(*) as count
     FROM audit_findings f1
     JOIN audit_findings f2 ON f1.rule_id = f2.rule_id
     WHERE f1.audit_job_id = $1 AND f2.audit_job_id = $2 ${filterClause}
     GROUP BY f1.rule_id, f1.rule_name, f1.category, f1.severity
     ORDER BY
       CASE f1.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END`,
    [myAuditId, competitorAuditId, ...filterParams]
  );

  return {
    onlyInMine: onlyInMineResult.rows.map(r => ({ ...r, count: parseInt(r.count as unknown as string, 10) })),
    onlyInCompetitor: onlyInCompetitorResult.rows.map(r => ({ ...r, count: parseInt(r.count as unknown as string, 10) })),
    inBoth: inBothResult.rows.map(r => ({ ...r, count: parseInt(r.count as unknown as string, 10) })),
  };
}

/**
 * Generate recommendations based on comparison
 */
export function getRecommendations(scoresDiff: ScoresDiff): ComparisonRecommendation[] {
  const recommendations: ComparisonRecommendation[] = [];
  const categories = ['seo', 'accessibility', 'security', 'performance'] as const;

  for (const category of categories) {
    const diff = scoresDiff.diff[category];
    if (diff === null) continue;

    if (diff < -10) {
      recommendations.push({
        category,
        gap: diff,
        priority: 'high',
        recommendation: getRecommendationText(category, diff, 'high'),
      });
    } else if (diff < -5) {
      recommendations.push({
        category,
        gap: diff,
        priority: 'medium',
        recommendation: getRecommendationText(category, diff, 'medium'),
      });
    } else if (diff < 0) {
      recommendations.push({
        category,
        gap: diff,
        priority: 'low',
        recommendation: getRecommendationText(category, diff, 'low'),
      });
    }
  }

  // Sort by priority (high first)
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// =============================================
// HELPERS
// =============================================

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
}

function calculateOverall(
  seo: number | null,
  accessibility: number | null,
  security: number | null,
  performance: number | null
): number | null {
  const scores = [seo, accessibility, security, performance].filter(s => s !== null) as number[];
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calculateDiff(my: number | null, competitor: number | null): number | null {
  if (my === null || competitor === null) return null;
  return my - competitor;
}

function getRecommendationText(
  category: string,
  gap: number,
  priority: 'high' | 'medium' | 'low'
): string {
  const categoryNames: Record<string, string> = {
    seo: 'SEO',
    accessibility: 'Accessibility',
    security: 'Security',
    performance: 'Performance',
  };

  const name = categoryNames[category] || category;
  const absGap = Math.abs(gap);

  const recommendations: Record<string, Record<'high' | 'medium' | 'low', string>> = {
    seo: {
      high: `Your competitor leads by ${absGap} points in ${name}. Focus on meta tags, content optimization, and structured data to close this gap.`,
      medium: `You're trailing by ${absGap} points in ${name}. Review your page titles, descriptions, and heading structure.`,
      low: `Minor ${name} gap of ${absGap} points. Small improvements to internal linking and content could help.`,
    },
    accessibility: {
      high: `Significant accessibility gap of ${absGap} points. Prioritize WCAG compliance - check color contrast, alt text, and keyboard navigation.`,
      medium: `Accessibility is ${absGap} points behind. Review form labels, focus states, and ARIA attributes.`,
      low: `Small accessibility difference of ${absGap} points. Check for minor issues like missing alt text or unclear link text.`,
    },
    security: {
      high: `Security score is ${absGap} points lower. Urgent: Review HTTPS, security headers, and CSP policies.`,
      medium: `Security needs attention - ${absGap} point gap. Check HTTP security headers and cookie settings.`,
      low: `Minor security gap of ${absGap} points. Review for any missing security best practices.`,
    },
    performance: {
      high: `Performance is ${absGap} points behind. Optimize images, reduce JavaScript, and improve server response times.`,
      medium: `${absGap} point performance gap. Look at caching, compression, and resource optimization.`,
      low: `Small performance difference of ${absGap} points. Consider lazy loading and code splitting.`,
    },
  };

  return recommendations[category]?.[priority] || `${name} is ${absGap} points behind your competitor.`;
}

// =============================================
// SITE-SCOPED FUNCTIONS
// =============================================

/**
 * Get competitors for a specific site
 */
export async function getCompetitorsBySite(
  siteId: string
): Promise<CompetitorProfileWithLatestAudit[]> {
  const result = await pool.query<CompetitorProfileWithLatestAudit>(
    `SELECT
      cp.*,
      aj.id as latest_audit_id,
      aj.completed_at as latest_audit_completed_at,
      aj.seo_score as latest_seo_score,
      aj.accessibility_score as latest_accessibility_score,
      aj.security_score as latest_security_score,
      aj.performance_score as latest_performance_score
     FROM competitor_profiles cp
     LEFT JOIN LATERAL (
       SELECT id, completed_at, seo_score, accessibility_score, security_score, performance_score
       FROM audit_jobs
       WHERE competitor_profile_id = cp.id AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1
     ) aj ON true
     WHERE cp.site_id = $1
     ORDER BY cp.created_at DESC`,
    [siteId]
  );

  return result.rows;
}

/**
 * Create a competitor for a specific site
 */
export async function createCompetitorForSite(
  siteId: string,
  organizationId: string,
  userId: string,
  input: CreateCompetitorInput
): Promise<CompetitorProfile> {
  const domain = normalizeDomain(input.domain);

  // Check site competitor limit
  const limits = await getOrganizationLimits(organizationId);
  if (!limits?.competitor_comparison) {
    throw new Error('Competitor comparison is not available on your plan.');
  }

  const maxCompetitors = limits.max_competitors_per_site;
  if (maxCompetitors !== null) {
    const countResult = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM competitor_profiles WHERE site_id = $1',
      [siteId]
    );
    const used = parseInt(countResult.rows[0].count, 10);
    if (used >= maxCompetitors) {
      throw new Error(`You've reached your limit of ${maxCompetitors} competitors for this site.`);
    }
  }

  // Check if domain already exists for this site
  const existing = await pool.query(
    'SELECT id FROM competitor_profiles WHERE site_id = $1 AND domain = $2',
    [siteId, domain]
  );
  if (existing.rows.length > 0) {
    throw new Error('This competitor domain already exists for this site');
  }

  const result = await pool.query<CompetitorProfile>(
    `INSERT INTO competitor_profiles (organization_id, site_id, domain, name, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [organizationId, siteId, domain, input.name || null, input.notes || null, userId]
  );

  return result.rows[0];
}

/**
 * Get comparisons for a specific site
 */
export async function getComparisonsBySite(
  siteId: string
): Promise<AuditComparisonWithAudits[]> {
  const result = await pool.query(
    `SELECT
      ac.*,
      a1.id as my_id, a1.target_url as my_url, a1.target_domain as my_domain,
      a1.seo_score as my_seo, a1.accessibility_score as my_acc,
      a1.security_score as my_sec, a1.performance_score as my_perf,
      a1.completed_at as my_completed,
      a2.id as comp_id, a2.target_url as comp_url, a2.target_domain as comp_domain,
      a2.seo_score as comp_seo, a2.accessibility_score as comp_acc,
      a2.security_score as comp_sec, a2.performance_score as comp_perf,
      a2.completed_at as comp_completed
     FROM audit_comparisons ac
     JOIN audit_jobs a1 ON ac.my_audit_id = a1.id
     JOIN audit_jobs a2 ON ac.competitor_audit_id = a2.id
     WHERE ac.site_id = $1
     ORDER BY ac.created_at DESC`,
    [siteId]
  );

  return result.rows.map(row => ({
    id: row.id,
    organization_id: row.organization_id,
    name: row.name,
    my_audit_id: row.my_audit_id,
    competitor_audit_id: row.competitor_audit_id,
    created_by: row.created_by,
    created_at: row.created_at,
    my_audit: {
      id: row.my_id,
      target_url: row.my_url,
      target_domain: row.my_domain,
      seo_score: row.my_seo,
      accessibility_score: row.my_acc,
      security_score: row.my_sec,
      performance_score: row.my_perf,
      completed_at: row.my_completed,
    },
    competitor_audit: {
      id: row.comp_id,
      target_url: row.comp_url,
      target_domain: row.comp_domain,
      seo_score: row.comp_seo,
      accessibility_score: row.comp_acc,
      security_score: row.comp_sec,
      performance_score: row.comp_perf,
      completed_at: row.comp_completed,
    },
  }));
}
