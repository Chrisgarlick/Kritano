/**
 * Admin Analytics Service — Phase 6
 *
 * Pure aggregation queries over existing tables.
 * No new tables needed — funnel, global trends, and revenue metrics.
 */

import { Pool } from 'pg';

let pool: Pool;

export function initializeAdminAnalyticsService(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// Tier Pricing (config-driven, no hardcoding)
// Replace with env vars or a tier_pricing table when Stripe is integrated
// =============================================

const TIER_PRICING: Record<string, number> = {
  free: 0,
  starter: parseInt(process.env.TIER_PRICE_STARTER || '19', 10),
  pro: parseInt(process.env.TIER_PRICE_PRO || '49', 10),
  agency: parseInt(process.env.TIER_PRICE_AGENCY || '99', 10),
  enterprise: parseInt(process.env.TIER_PRICE_ENTERPRISE || '199', 10),
};

function getTierPrice(tier: string): number {
  return TIER_PRICING[tier] ?? 0;
}

// =============================================
// Types
// =============================================

export interface FunnelStage {
  name: string;
  count: number;
  conversionFromPrevious: number | null;
}

export interface FunnelAnalytics {
  range: string;
  stages: FunnelStage[];
}

export interface TopIssue {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  affectedAudits: number;
  percentage: number;
}

export interface ScoreDistribution {
  avg: number;
  median: number;
  p10: number;
  p90: number;
}

export interface TierAuditBreakdown {
  audits: number;
  avgScore: number;
}

export interface GlobalTrends {
  range: string;
  totalAuditsCompleted: number;
  totalPagesScanned: number;
  topIssues: TopIssue[];
  scoreDistribution: Record<string, ScoreDistribution>;
  tierBreakdown: Record<string, TierAuditBreakdown>;
}

export interface TierRevenue {
  count: number;
  mrr: number;
}

export interface ChurnNewMetrics {
  count: number;
  mrrLost?: number;
  mrrGained?: number;
}

export interface RevenueAnalytics {
  mrr: number;
  arr: number;
  byTier: Record<string, TierRevenue>;
  churnThisMonth: ChurnNewMetrics;
  newThisMonth: ChurnNewMetrics;
}

// =============================================
// Helpers
// =============================================

function parseRangeDays(range: string): number {
  const match = range.match(/^(\d+)d$/);
  if (match) return parseInt(match[1], 10);
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  return 30; // default
}

// =============================================
// Funnel Analytics
// =============================================

export async function getFunnelAnalytics(range: string = '30d'): Promise<FunnelAnalytics> {
  const days = parseRangeDays(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Stage 1: Registered users
  const registeredResult = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE created_at >= $1`,
    [since]
  );
  const registered = parseInt(registeredResult.rows[0].count);

  // Stage 2: Verified email (among users registered in range)
  const verifiedResult = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE created_at >= $1 AND email_verified = true`,
    [since]
  );
  const verified = parseInt(verifiedResult.rows[0].count);

  // Stage 3: Ran first audit (distinct users with a completed audit, registered in range)
  const firstAuditResult = await pool.query(
    `SELECT COUNT(DISTINCT aj.user_id) as count
     FROM audit_jobs aj
     JOIN users u ON u.id = aj.user_id
     WHERE u.created_at >= $1 AND aj.status = 'completed'`,
    [since]
  );
  const firstAudit = parseInt(firstAuditResult.rows[0].count);

  // Stage 4: Domain verified (distinct org owners who registered in range and have a verified domain)
  const domainVerifiedResult = await pool.query(
    `SELECT COUNT(DISTINCT o.owner_id) as count
     FROM organization_domains od
     JOIN organizations o ON o.id = od.organization_id
     JOIN users u ON u.id = o.owner_id
     WHERE u.created_at >= $1 AND od.verified = true`,
    [since]
  );
  const domainVerified = parseInt(domainVerifiedResult.rows[0].count);

  // Stage 5: Paid subscriber (orgs with paid tier where owner registered in range)
  const paidResult = await pool.query(
    `SELECT COUNT(DISTINCT o.owner_id) as count
     FROM subscriptions s
     JOIN organizations o ON o.id = s.organization_id
     JOIN users u ON u.id = o.owner_id
     WHERE u.created_at >= $1 AND s.tier != 'free' AND s.status = 'active'`,
    [since]
  );
  const paid = parseInt(paidResult.rows[0].count);

  const stages: FunnelStage[] = [
    { name: 'Registered', count: registered, conversionFromPrevious: null },
    { name: 'Verified Email', count: verified, conversionFromPrevious: registered > 0 ? Math.round((verified / registered) * 1000) / 10 : 0 },
    { name: 'First Audit', count: firstAudit, conversionFromPrevious: verified > 0 ? Math.round((firstAudit / verified) * 1000) / 10 : 0 },
    { name: 'Domain Verified', count: domainVerified, conversionFromPrevious: firstAudit > 0 ? Math.round((domainVerified / firstAudit) * 1000) / 10 : 0 },
    { name: 'Paid Subscriber', count: paid, conversionFromPrevious: domainVerified > 0 ? Math.round((paid / domainVerified) * 1000) / 10 : 0 },
  ];

  return { range, stages };
}

// =============================================
// Global Trends
// =============================================

export async function getGlobalTrends(range: string = '30d'): Promise<GlobalTrends> {
  const days = parseRangeDays(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Total audits and pages
  const totalsResult = await pool.query(
    `SELECT
       COUNT(*) as total_audits,
       COALESCE(SUM(pages_crawled), 0) as total_pages
     FROM audit_jobs
     WHERE status = 'completed' AND completed_at >= $1`,
    [since]
  );
  const totalAuditsCompleted = parseInt(totalsResult.rows[0].total_audits);
  const totalPagesScanned = parseInt(totalsResult.rows[0].total_pages);

  // Top issues: most common rule_ids across audits in range
  const topIssuesResult = await pool.query(
    `SELECT
       af.rule_id,
       af.rule_name,
       af.category,
       af.severity,
       COUNT(DISTINCT af.audit_job_id) as affected_audits
     FROM audit_findings af
     JOIN audit_jobs aj ON aj.id = af.audit_job_id
     WHERE aj.status = 'completed' AND aj.completed_at >= $1
     GROUP BY af.rule_id, af.rule_name, af.category, af.severity
     ORDER BY affected_audits DESC
     LIMIT 20`,
    [since]
  );
  const topIssues: TopIssue[] = topIssuesResult.rows.map((row) => ({
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    category: row.category,
    severity: row.severity,
    affectedAudits: parseInt(row.affected_audits),
    percentage: totalAuditsCompleted > 0
      ? Math.round((parseInt(row.affected_audits) / totalAuditsCompleted) * 1000) / 10
      : 0,
  }));

  // Score distribution by category
  const categories = ['seo', 'accessibility', 'security', 'performance'];
  const scoreDistribution: Record<string, ScoreDistribution> = {};

  for (const cat of categories) {
    const col = `${cat}_score`;
    const distResult = await pool.query(
      `SELECT
         COALESCE(ROUND(AVG(${col})), 0) as avg,
         COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${col}), 0) as median,
         COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY ${col}), 0) as p10,
         COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY ${col}), 0) as p90
       FROM audit_jobs
       WHERE status = 'completed' AND completed_at >= $1 AND ${col} IS NOT NULL`,
      [since]
    );
    const row = distResult.rows[0];
    scoreDistribution[cat] = {
      avg: Math.round(parseFloat(row.avg)),
      median: Math.round(parseFloat(row.median)),
      p10: Math.round(parseFloat(row.p10)),
      p90: Math.round(parseFloat(row.p90)),
    };
  }

  // Tier breakdown
  const tierResult = await pool.query(
    `SELECT
       s.tier,
       COUNT(aj.id) as audits,
       COALESCE(ROUND(AVG(
         (COALESCE(aj.seo_score, 0) + COALESCE(aj.accessibility_score, 0) +
          COALESCE(aj.security_score, 0) + COALESCE(aj.performance_score, 0)) /
         GREATEST(
           (CASE WHEN aj.seo_score IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN aj.accessibility_score IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN aj.security_score IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN aj.performance_score IS NOT NULL THEN 1 ELSE 0 END), 1
         )
       )), 0) as avg_score
     FROM audit_jobs aj
     JOIN organizations o ON o.id = aj.organization_id
     JOIN subscriptions s ON s.organization_id = o.id
     WHERE aj.status = 'completed' AND aj.completed_at >= $1
     GROUP BY s.tier
     ORDER BY s.tier`,
    [since]
  );

  const tierBreakdown: Record<string, TierAuditBreakdown> = {};
  for (const row of tierResult.rows) {
    tierBreakdown[row.tier] = {
      audits: parseInt(row.audits),
      avgScore: Math.round(parseFloat(row.avg_score)),
    };
  }

  return {
    range,
    totalAuditsCompleted,
    totalPagesScanned,
    topIssues,
    scoreDistribution,
    tierBreakdown,
  };
}

// =============================================
// Revenue Analytics
// =============================================

export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  // Current tier counts (active subscriptions only)
  const tierCountsResult = await pool.query(
    `SELECT tier, COUNT(*) as count
     FROM subscriptions
     WHERE status = 'active'
     GROUP BY tier`
  );

  const byTier: Record<string, TierRevenue> = {};
  let totalMrr = 0;
  for (const row of tierCountsResult.rows) {
    const count = parseInt(row.count);
    const price = getTierPrice(row.tier);
    const mrr = count * price;
    byTier[row.tier] = { count, mrr };
    totalMrr += mrr;
  }

  // Ensure all tiers are represented
  for (const tier of Object.keys(TIER_PRICING)) {
    if (!byTier[tier]) {
      byTier[tier] = { count: 0, mrr: 0 };
    }
  }

  // Churn this month: subscriptions that became cancelled this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const churnResult = await pool.query(
    `SELECT tier, COUNT(*) as count
     FROM subscriptions
     WHERE status = 'canceled' AND updated_at >= $1
     GROUP BY tier`,
    [monthStart.toISOString()]
  );

  let churnCount = 0;
  let mrrLost = 0;
  for (const row of churnResult.rows) {
    const count = parseInt(row.count);
    churnCount += count;
    mrrLost += count * getTierPrice(row.tier);
  }

  // New paid subscribers this month
  const newResult = await pool.query(
    `SELECT s.tier, COUNT(*) as count
     FROM subscriptions s
     JOIN organizations o ON o.id = s.organization_id
     WHERE s.tier != 'free' AND s.status = 'active' AND s.created_at >= $1
     GROUP BY s.tier`,
    [monthStart.toISOString()]
  );

  let newCount = 0;
  let mrrGained = 0;
  for (const row of newResult.rows) {
    const count = parseInt(row.count);
    newCount += count;
    mrrGained += count * getTierPrice(row.tier);
  }

  return {
    mrr: totalMrr,
    arr: totalMrr * 12,
    byTier,
    churnThisMonth: { count: churnCount, mrrLost },
    newThisMonth: { count: newCount, mrrGained },
  };
}
