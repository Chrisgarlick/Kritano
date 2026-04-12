"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getSiteScoreHistory = getSiteScoreHistory;
exports.getIssueTrends = getIssueTrends;
exports.compareAudits = compareAudits;
exports.getOrganizationOverview = getOrganizationOverview;
exports.compareSites = compareSites;
exports.getUserOverview = getUserOverview;
exports.getUrlScoreHistory = getUrlScoreHistory;
exports.getUrlAnalytics = getUrlAnalytics;
exports.getUserAuditedUrls = getUserAuditedUrls;
exports.compareUrls = compareUrls;
exports.getIssueWaterfall = getIssueWaterfall;
exports.getFixVelocity = getFixVelocity;
exports.getPageHeatmap = getPageHeatmap;
exports.getResponseTimeDistribution = getResponseTimeDistribution;
exports.getPageSizeDistribution = getPageSizeDistribution;
const cache_utils_1 = require("../utils/cache.utils");
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
// =============================================
// Helper Functions
// =============================================
function getDateRangeFilter(range) {
    const now = new Date();
    switch (range) {
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '1y':
            return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        case 'all':
        default:
            return new Date(0); // Beginning of time
    }
}
function calculateTrend(values) {
    const validValues = values.filter((v) => v !== null);
    if (validValues.length < 2)
        return 'stable';
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 2)
        return 'up';
    if (diff < -2)
        return 'down';
    return 'stable';
}
function calculateOverallTrend(scores) {
    if (scores.length < 2)
        return 'stable';
    const categories = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'];
    let improvingCount = 0;
    let decliningCount = 0;
    for (const category of categories) {
        const values = scores.map(s => s[category] ?? null);
        const trend = calculateTrend(values);
        if (trend === 'up')
            improvingCount++;
        if (trend === 'down')
            decliningCount++;
    }
    if (improvingCount > decliningCount)
        return 'improving';
    if (decliningCount > improvingCount)
        return 'declining';
    return 'stable';
}
// =============================================
// Site Score History
// =============================================
async function getSiteScoreHistory(options) {
    const { siteId, range = '30d', from, to } = options;
    let dateFilter;
    let endDate = new Date();
    if (from && to) {
        dateFilter = from;
        endDate = to;
    }
    else {
        dateFilter = getDateRangeFilter(range);
    }
    const result = await pool.query(`SELECT
      id,
      completed_at,
      seo_score,
      accessibility_score,
      security_score,
      performance_score,
      content_score,
      structured_data_score,
      cqs_score,
      total_issues,
      pages_crawled
    FROM audit_jobs
    WHERE site_id = $1
      AND status = 'completed'
      AND completed_at >= $2
      AND completed_at <= $3
    ORDER BY completed_at ASC`, [siteId, dateFilter, endDate]);
    const scores = result.rows.map(row => ({
        auditId: row.id,
        completedAt: row.completed_at.toISOString(),
        seo: row.seo_score,
        accessibility: row.accessibility_score,
        security: row.security_score,
        performance: row.performance_score,
        content: row.content_score,
        structuredData: row.structured_data_score,
        cqs: row.cqs_score,
        totalIssues: row.total_issues ?? 0,
        pagesCrawled: row.pages_crawled ?? 0,
    }));
    // Calculate summary
    const validScores = {
        seo: scores.map(s => s.seo).filter((v) => v !== null),
        accessibility: scores.map(s => s.accessibility).filter((v) => v !== null),
        security: scores.map(s => s.security).filter((v) => v !== null),
        performance: scores.map(s => s.performance).filter((v) => v !== null),
        content: scores.map(s => s.content).filter((v) => v !== null),
        structuredData: scores.map(s => s.structuredData).filter((v) => v !== null),
        cqs: scores.map(s => s.cqs).filter((v) => v !== null),
    };
    const summary = {
        averages: {
            seo: validScores.seo.length > 0
                ? Math.round(validScores.seo.reduce((a, b) => a + b, 0) / validScores.seo.length)
                : null,
            accessibility: validScores.accessibility.length > 0
                ? Math.round(validScores.accessibility.reduce((a, b) => a + b, 0) / validScores.accessibility.length)
                : null,
            security: validScores.security.length > 0
                ? Math.round(validScores.security.reduce((a, b) => a + b, 0) / validScores.security.length)
                : null,
            performance: validScores.performance.length > 0
                ? Math.round(validScores.performance.reduce((a, b) => a + b, 0) / validScores.performance.length)
                : null,
            content: validScores.content.length > 0
                ? Math.round(validScores.content.reduce((a, b) => a + b, 0) / validScores.content.length)
                : null,
            structuredData: validScores.structuredData.length > 0
                ? Math.round(validScores.structuredData.reduce((a, b) => a + b, 0) / validScores.structuredData.length)
                : null,
            cqs: validScores.cqs.length > 0
                ? Math.round(validScores.cqs.reduce((a, b) => a + b, 0) / validScores.cqs.length)
                : null,
        },
        trends: {
            seo: calculateTrend(scores.map(s => s.seo)),
            accessibility: calculateTrend(scores.map(s => s.accessibility)),
            security: calculateTrend(scores.map(s => s.security)),
            performance: calculateTrend(scores.map(s => s.performance)),
            content: calculateTrend(scores.map(s => s.content ?? null)),
            structuredData: calculateTrend(scores.map(s => s.structuredData ?? null)),
            cqs: calculateTrend(scores.map(s => s.cqs ?? null)),
        },
        totalAudits: scores.length,
    };
    return { scores, summary };
}
// =============================================
// Issue Trends
// =============================================
async function getIssueTrends(options) {
    const { siteId, range = '30d', groupBy = 'week' } = options;
    const dateFilter = getDateRangeFilter(range);
    // Determine the date truncation based on groupBy
    const truncation = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';
    const result = await pool.query(`SELECT
      date_trunc($3, aj.completed_at) as period,
      af.category,
      af.severity,
      COUNT(DISTINCT af.rule_id)::text as count
    FROM audit_findings af
    JOIN audit_jobs aj ON aj.id = af.audit_job_id
    WHERE aj.site_id = $1
      AND aj.status = 'completed'
      AND aj.completed_at >= $2
    GROUP BY period, af.category, af.severity
    ORDER BY period ASC`, [siteId, dateFilter, truncation]);
    // Group results by period
    const periodMap = new Map();
    for (const row of result.rows) {
        const periodKey = row.period.toISOString();
        let point = periodMap.get(periodKey);
        if (!point) {
            point = {
                period: periodKey,
                bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
                byCategory: { seo: 0, accessibility: 0, security: 0, performance: 0, content: 0, 'structured-data': 0 },
                total: 0,
            };
            periodMap.set(periodKey, point);
        }
        const count = parseInt(row.count, 10);
        point.total += count;
        if (row.severity in point.bySeverity) {
            point.bySeverity[row.severity] += count;
        }
        if (row.category in point.byCategory) {
            point.byCategory[row.category] += count;
        }
    }
    return {
        trends: Array.from(periodMap.values()),
    };
}
// =============================================
// Audit Comparison
// =============================================
async function compareAudits(auditIds) {
    if (auditIds.length < 2 || auditIds.length > 4) {
        throw new Error('Comparison requires 2-4 audits');
    }
    // Get audit summaries
    const auditsResult = await pool.query(`SELECT
      aj.id,
      aj.site_id,
      COALESCE(s.name, aj.target_domain) as site_name,
      COALESCE(s.domain, aj.target_domain) as domain,
      aj.completed_at,
      aj.seo_score,
      aj.accessibility_score,
      aj.security_score,
      aj.performance_score,
      aj.content_score,
      aj.structured_data_score,
      aj.cqs_score,
      aj.total_issues,
      aj.pages_crawled
    FROM audit_jobs aj
    LEFT JOIN sites s ON s.id = aj.site_id
    WHERE aj.id = ANY($1)
      AND aj.status = 'completed'
    ORDER BY aj.completed_at ASC`, [auditIds]);
    if (auditsResult.rows.length < 2) {
        throw new Error('Not enough valid audits found for comparison');
    }
    // Get issue severity counts for each audit
    const severityResult = await pool.query(`SELECT
      audit_job_id,
      severity,
      COUNT(DISTINCT rule_id)::text as count
    FROM audit_findings
    WHERE audit_job_id = ANY($1)
    GROUP BY audit_job_id, severity`, [auditIds]);
    const severityByAudit = new Map();
    for (const row of severityResult.rows) {
        let counts = severityByAudit.get(row.audit_job_id);
        if (!counts) {
            counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
            severityByAudit.set(row.audit_job_id, counts);
        }
        if (row.severity in counts) {
            counts[row.severity] = parseInt(row.count, 10);
        }
    }
    const audits = auditsResult.rows.map(row => {
        const sev = severityByAudit.get(row.id) || { critical: 0, serious: 0, moderate: 0, minor: 0 };
        return {
            id: row.id,
            siteName: row.site_name,
            domain: row.domain,
            completedAt: row.completed_at.toISOString(),
            scores: {
                seo: row.seo_score,
                accessibility: row.accessibility_score,
                security: row.security_score,
                performance: row.performance_score,
                content: row.content_score,
                structuredData: row.structured_data_score,
                cqs: row.cqs_score,
            },
            issues: {
                total: sev.critical + sev.serious + sev.moderate + sev.minor,
                ...sev,
            },
            pagesCrawled: row.pages_crawled || 0,
        };
    });
    // Calculate score deltas between consecutive audits
    const scoreDeltas = [];
    for (let i = 0; i < audits.length - 1; i++) {
        const from = audits[i];
        const to = audits[i + 1];
        scoreDeltas.push({
            from: from.id,
            to: to.id,
            deltas: {
                seo: from.scores.seo !== null && to.scores.seo !== null
                    ? to.scores.seo - from.scores.seo
                    : null,
                accessibility: from.scores.accessibility !== null && to.scores.accessibility !== null
                    ? to.scores.accessibility - from.scores.accessibility
                    : null,
                security: from.scores.security !== null && to.scores.security !== null
                    ? to.scores.security - from.scores.security
                    : null,
                performance: from.scores.performance !== null && to.scores.performance !== null
                    ? to.scores.performance - from.scores.performance
                    : null,
                content: from.scores.content !== null && to.scores.content !== null
                    ? to.scores.content - from.scores.content
                    : null,
                structuredData: from.scores.structuredData !== null && to.scores.structuredData !== null
                    ? to.scores.structuredData - from.scores.structuredData
                    : null,
                cqs: from.scores.cqs !== null && to.scores.cqs !== null
                    ? to.scores.cqs - from.scores.cqs
                    : null,
            },
        });
    }
    // Get issues for each audit to compare (with highest severity per rule)
    const issuesResult = await pool.query(`SELECT DISTINCT ON (audit_job_id, rule_id)
      audit_job_id,
      rule_id,
      rule_name,
      category,
      severity
    FROM audit_findings
    WHERE audit_job_id = ANY($1)
    ORDER BY audit_job_id, rule_id,
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'serious' THEN 2
        WHEN 'moderate' THEN 3
        WHEN 'minor' THEN 4
        ELSE 5
      END`, [auditIds]);
    // Group issues by rule_id, keeping highest severity
    const severityRank = { critical: 1, serious: 2, moderate: 3, minor: 4 };
    const issuesByRule = new Map();
    for (const row of issuesResult.rows) {
        let issue = issuesByRule.get(row.rule_id);
        if (!issue) {
            issue = { ruleName: row.rule_name, category: row.category, severity: row.severity, presentIn: new Set() };
            issuesByRule.set(row.rule_id, issue);
        }
        else if ((severityRank[row.severity] || 5) < (severityRank[issue.severity] || 5)) {
            issue.severity = row.severity;
        }
        issue.presentIn.add(row.audit_job_id);
    }
    // Categorize issues
    const commonIssues = [];
    const resolvedIssues = [];
    const newIssues = [];
    const orderedAuditIds = audits.map(a => a.id);
    const firstAuditId = orderedAuditIds[0];
    const lastAuditId = orderedAuditIds[orderedAuditIds.length - 1];
    for (const [ruleId, issue] of issuesByRule) {
        const presentInArray = Array.from(issue.presentIn);
        // Common: present in both first and last audit
        if (issue.presentIn.has(firstAuditId) && issue.presentIn.has(lastAuditId)) {
            commonIssues.push({
                ruleId,
                ruleName: issue.ruleName,
                category: issue.category,
                severity: issue.severity,
                presentIn: presentInArray,
            });
        }
        // Resolved: present in first but not in last
        else if (issue.presentIn.has(firstAuditId) && !issue.presentIn.has(lastAuditId)) {
            resolvedIssues.push({
                ruleId,
                ruleName: issue.ruleName,
                category: issue.category,
                severity: issue.severity,
                resolvedIn: lastAuditId,
            });
        }
        // New: not in first but in last
        else if (!issue.presentIn.has(firstAuditId) && issue.presentIn.has(lastAuditId)) {
            newIssues.push({
                ruleId,
                ruleName: issue.ruleName,
                category: issue.category,
                severity: issue.severity,
                introducedIn: lastAuditId,
            });
        }
    }
    return {
        audits,
        comparison: {
            scoreDeltas,
            commonIssues,
            resolvedIssues,
            newIssues,
        },
    };
}
// =============================================
// Organization Analytics Overview
// =============================================
async function getOrganizationOverview(organizationId) {
    // Get all sites with their latest scores and audit counts
    const sitesResult = await pool.query(`SELECT
      s.id,
      s.name,
      s.domain,
      COUNT(aj.id)::text as audit_count,
      MAX(aj.completed_at) as last_audit_at,
      (
        SELECT seo_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as seo_score,
      (
        SELECT accessibility_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as accessibility_score,
      (
        SELECT security_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as security_score,
      (
        SELECT performance_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as performance_score,
      (
        SELECT content_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as content_score,
      (
        SELECT structured_data_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as structured_data_score,
      (
        SELECT cqs_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as cqs_score
    FROM sites s
    LEFT JOIN audit_jobs aj ON aj.site_id = s.id AND aj.status = 'completed'
    WHERE s.organization_id = $1
    GROUP BY s.id
    ORDER BY s.name ASC`, [organizationId]);
    // Get recent score history for all sites in one query to avoid N+1
    const siteIds = sitesResult.rows.map(r => r.id);
    const trendResult = siteIds.length > 0 ? await pool.query(`SELECT site_id, seo_score, accessibility_score, security_score, performance_score, completed_at
     FROM audit_jobs
     WHERE site_id = ANY($1) AND status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days'
     ORDER BY completed_at ASC`, [siteIds]) : { rows: [] };
    // Group scores by site and calculate trends
    const siteScoreMap = new Map();
    for (const row of trendResult.rows) {
        if (!siteScoreMap.has(row.site_id))
            siteScoreMap.set(row.site_id, []);
        siteScoreMap.get(row.site_id).push({
            seo: row.seo_score,
            accessibility: row.accessibility_score,
            security: row.security_score,
            performance: row.performance_score,
        });
    }
    const trendMap = new Map();
    for (const [siteId, scores] of siteScoreMap) {
        trendMap.set(siteId, calculateOverallTrend(scores));
    }
    const sites = sitesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        latestScores: {
            seo: row.seo_score,
            accessibility: row.accessibility_score,
            security: row.security_score,
            performance: row.performance_score,
            content: row.content_score,
            structuredData: row.structured_data_score,
            cqs: row.cqs_score,
        },
        lastAuditAt: row.last_audit_at?.toISOString() || null,
        auditCount: parseInt(row.audit_count, 10),
        trend: trendMap.get(row.id) || 'stable',
    }));
    // Calculate aggregates
    const totalAudits = sites.reduce((sum, s) => sum + s.auditCount, 0);
    const validScores = {
        seo: sites.map(s => s.latestScores.seo).filter((v) => v !== null),
        accessibility: sites.map(s => s.latestScores.accessibility).filter((v) => v !== null),
        security: sites.map(s => s.latestScores.security).filter((v) => v !== null),
        performance: sites.map(s => s.latestScores.performance).filter((v) => v !== null),
        content: sites.map(s => s.latestScores.content).filter((v) => v !== null),
        structuredData: sites.map(s => s.latestScores.structuredData).filter((v) => v !== null),
        cqs: sites.map(s => s.latestScores.cqs).filter((v) => v !== null),
    };
    const averageScores = {
        seo: validScores.seo.length > 0
            ? Math.round(validScores.seo.reduce((a, b) => a + b, 0) / validScores.seo.length)
            : null,
        accessibility: validScores.accessibility.length > 0
            ? Math.round(validScores.accessibility.reduce((a, b) => a + b, 0) / validScores.accessibility.length)
            : null,
        security: validScores.security.length > 0
            ? Math.round(validScores.security.reduce((a, b) => a + b, 0) / validScores.security.length)
            : null,
        performance: validScores.performance.length > 0
            ? Math.round(validScores.performance.reduce((a, b) => a + b, 0) / validScores.performance.length)
            : null,
        content: validScores.content.length > 0
            ? Math.round(validScores.content.reduce((a, b) => a + b, 0) / validScores.content.length)
            : null,
        structuredData: validScores.structuredData.length > 0
            ? Math.round(validScores.structuredData.reduce((a, b) => a + b, 0) / validScores.structuredData.length)
            : null,
        cqs: validScores.cqs.length > 0
            ? Math.round(validScores.cqs.reduce((a, b) => a + b, 0) / validScores.cqs.length)
            : null,
    };
    // Get top issues across all sites
    const topIssuesResult = await pool.query(`SELECT
      af.rule_id,
      af.rule_name,
      af.category,
      COUNT(*)::text as count
    FROM audit_findings af
    JOIN audit_jobs aj ON aj.id = af.audit_job_id
    JOIN sites s ON s.id = aj.site_id
    WHERE s.organization_id = $1
      AND aj.status = 'completed'
      AND aj.completed_at >= NOW() - INTERVAL '30 days'
    GROUP BY af.rule_id, af.rule_name, af.category
    ORDER BY count DESC
    LIMIT 10`, [organizationId]);
    const topIssues = topIssuesResult.rows.map(row => ({
        ruleId: row.rule_id,
        ruleName: row.rule_name,
        category: row.category,
        count: parseInt(row.count, 10),
    }));
    return {
        sites,
        aggregates: {
            totalAudits,
            averageScores,
            topIssues,
        },
    };
}
// =============================================
// Site Comparison
// =============================================
async function compareSites(siteIds) {
    if (siteIds.length < 2 || siteIds.length > 6) {
        throw new Error('Comparison requires 2-6 sites');
    }
    const result = await pool.query(`SELECT
      s.id,
      s.name,
      s.domain,
      (
        SELECT id FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_audit_id,
      (
        SELECT completed_at FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_completed_at,
      (
        SELECT seo_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_seo,
      (
        SELECT accessibility_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_accessibility,
      (
        SELECT security_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_security,
      (
        SELECT performance_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_performance,
      (
        SELECT content_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_content,
      (
        SELECT structured_data_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_structured_data,
      (
        SELECT cqs_score FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      ) as latest_cqs,
      (
        SELECT COUNT(DISTINCT af.rule_id) FROM audit_findings af
        WHERE af.audit_job_id = (
          SELECT id FROM audit_jobs
          WHERE site_id = s.id AND status = 'completed'
          ORDER BY completed_at DESC LIMIT 1
        )
      ) as latest_total_issues,
      (
        SELECT ROUND(AVG(seo_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_seo,
      (
        SELECT ROUND(AVG(accessibility_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_accessibility,
      (
        SELECT ROUND(AVG(security_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_security,
      (
        SELECT ROUND(AVG(performance_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_performance,
      (
        SELECT ROUND(AVG(content_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_content,
      (
        SELECT ROUND(AVG(structured_data_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_structured_data,
      (
        SELECT ROUND(AVG(cqs_score)) FROM audit_jobs
        WHERE site_id = s.id AND status = 'completed'
      ) as avg_cqs
    FROM sites s
    WHERE s.id = ANY($1)
    ORDER BY s.name ASC`, [siteIds]);
    const sites = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        latestAudit: row.latest_audit_id
            ? {
                id: row.latest_audit_id,
                completedAt: row.latest_completed_at.toISOString(),
                scores: {
                    seo: row.latest_seo,
                    accessibility: row.latest_accessibility,
                    security: row.latest_security,
                    performance: row.latest_performance,
                    content: row.latest_content,
                    structuredData: row.latest_structured_data,
                    cqs: row.latest_cqs,
                },
                totalIssues: row.latest_total_issues || 0,
            }
            : null,
        historicalAverage: {
            seo: row.avg_seo,
            accessibility: row.avg_accessibility,
            security: row.avg_security,
            performance: row.avg_performance,
            content: row.avg_content,
            structuredData: row.avg_structured_data,
            cqs: row.avg_cqs,
        },
    }));
    return { sites };
}
// =============================================
// User-Centric Analytics
// =============================================
async function getUserOverview(userId) {
    return (0, cache_utils_1.withCache)(`analytics:overview:${userId}`, 60, () => computeUserOverview(userId));
}
async function computeUserOverview(userId) {
    // Get all sites the user has access to (owned + shared)
    const sitesResult = await pool.query(`SELECT s.id, s.name, s.domain
     FROM sites s
     WHERE s.owner_id = $1
     UNION
     SELECT s.id, s.name, s.domain
     FROM sites s
     JOIN site_shares ss ON ss.site_id = s.id
     WHERE ss.user_id = $1 AND ss.accepted_at IS NOT NULL`, [userId]);
    const siteIds = sitesResult.rows.map(s => s.id);
    const siteMap = new Map(sitesResult.rows.map(s => [s.id, s]));
    if (siteIds.length === 0) {
        return {
            totalSites: 0,
            totalAudits: 0,
            avgScores: { seo: null, accessibility: null, security: null, performance: null, content: null, structuredData: null, cqs: null },
            sitesNeedingAttention: [],
            siteTrends: {},
            recentActivity: [],
        };
    }
    // Get total audits count
    const auditsCountResult = await pool.query(`SELECT COUNT(*)::text as count FROM audit_jobs WHERE site_id = ANY($1) AND status = 'completed'`, [siteIds]);
    const totalAudits = parseInt(auditsCountResult.rows[0]?.count || '0', 10);
    // Get latest scores for each site
    const latestScoresResult = await pool.query(`SELECT DISTINCT ON (site_id)
      site_id,
      seo_score,
      accessibility_score,
      security_score,
      performance_score,
      content_score,
      structured_data_score,
      cqs_score
    FROM audit_jobs
    WHERE site_id = ANY($1) AND status = 'completed'
    ORDER BY site_id, completed_at DESC`, [siteIds]);
    // Calculate average scores across all sites
    const allScores = {
        seo: latestScoresResult.rows.map(r => r.seo_score).filter((v) => v !== null),
        accessibility: latestScoresResult.rows.map(r => r.accessibility_score).filter((v) => v !== null),
        security: latestScoresResult.rows.map(r => r.security_score).filter((v) => v !== null),
        performance: latestScoresResult.rows.map(r => r.performance_score).filter((v) => v !== null),
        content: latestScoresResult.rows.map(r => r.content_score).filter((v) => v !== null),
        structuredData: latestScoresResult.rows.map(r => r.structured_data_score).filter((v) => v !== null),
        cqs: latestScoresResult.rows.map(r => r.cqs_score).filter((v) => v !== null),
    };
    const avgScores = {
        seo: allScores.seo.length > 0
            ? Math.round(allScores.seo.reduce((a, b) => a + b, 0) / allScores.seo.length)
            : null,
        accessibility: allScores.accessibility.length > 0
            ? Math.round(allScores.accessibility.reduce((a, b) => a + b, 0) / allScores.accessibility.length)
            : null,
        security: allScores.security.length > 0
            ? Math.round(allScores.security.reduce((a, b) => a + b, 0) / allScores.security.length)
            : null,
        performance: allScores.performance.length > 0
            ? Math.round(allScores.performance.reduce((a, b) => a + b, 0) / allScores.performance.length)
            : null,
        content: allScores.content.length > 0
            ? Math.round(allScores.content.reduce((a, b) => a + b, 0) / allScores.content.length)
            : null,
        structuredData: allScores.structuredData.length > 0
            ? Math.round(allScores.structuredData.reduce((a, b) => a + b, 0) / allScores.structuredData.length)
            : null,
        cqs: allScores.cqs.length > 0
            ? Math.round(allScores.cqs.reduce((a, b) => a + b, 0) / allScores.cqs.length)
            : null,
    };
    // Calculate trends for all sites and find sites needing attention
    const sitesNeedingAttention = [];
    const siteTrends = {};
    // Batch-fetch recent audit scores for all sites (for trend calculation)
    const allTrendResult = siteIds.length > 0 ? await pool.query(`SELECT site_id, seo_score, accessibility_score, security_score, performance_score,
            content_score, structured_data_score, cqs_score, completed_at
     FROM audit_jobs
     WHERE site_id = ANY($1) AND status = 'completed' AND completed_at >= NOW() - INTERVAL '90 days'
     ORDER BY completed_at ASC`, [siteIds]) : { rows: [] };
    // Group scores by site
    const siteScoresMap = new Map();
    for (const row of allTrendResult.rows) {
        if (!siteScoresMap.has(row.site_id))
            siteScoresMap.set(row.site_id, []);
        siteScoresMap.get(row.site_id).push({
            seo: row.seo_score,
            accessibility: row.accessibility_score,
            security: row.security_score,
            performance: row.performance_score,
            content: row.content_score,
            structuredData: row.structured_data_score,
            cqs: row.cqs_score,
        });
    }
    // Calculate trend for each site
    for (const siteId of siteIds) {
        const scores = siteScoresMap.get(siteId) || [];
        const trend = calculateOverallTrend(scores);
        siteTrends[siteId] = trend;
        if (trend === 'declining') {
            const site = siteMap.get(siteId);
            const latestScore = latestScoresResult.rows.find(r => r.site_id === siteId);
            if (site && latestScore) {
                sitesNeedingAttention.push({
                    id: siteId,
                    name: site.name,
                    domain: site.domain,
                    latestScores: {
                        seo: latestScore.seo_score,
                        accessibility: latestScore.accessibility_score,
                        security: latestScore.security_score,
                        performance: latestScore.performance_score,
                        content: latestScore.content_score,
                        structuredData: latestScore.structured_data_score,
                        cqs: latestScore.cqs_score,
                    },
                    trend: 'declining',
                });
            }
        }
    }
    // Get recent activity (5 most recent audits)
    // Check which optional columns exist (from later migrations)
    const columnsCheck = await pool.query(`SELECT column_name FROM information_schema.columns
     WHERE table_name = 'audit_jobs' AND column_name IN ('content_score', 'url_id', 'structured_data_score', 'cqs_score')`);
    const existingColumns = new Set(columnsCheck.rows.map(r => r.column_name));
    const hasContentScore = existingColumns.has('content_score');
    const hasUrlId = existingColumns.has('url_id');
    const hasStructuredDataScore = existingColumns.has('structured_data_score');
    const hasCqsScore = existingColumns.has('cqs_score');
    const recentActivityResult = await pool.query(`SELECT aj.id, aj.site_id, aj.completed_at, aj.seo_score, aj.accessibility_score, aj.security_score,
            aj.performance_score,
            ${hasContentScore ? 'aj.content_score' : 'NULL::int as content_score'},
            ${hasStructuredDataScore ? 'aj.structured_data_score' : 'NULL::int as structured_data_score'},
            ${hasCqsScore ? 'aj.cqs_score' : 'NULL::int as cqs_score'},
            COALESCE(aj.pages_crawled, 0) as pages_crawled,
            COALESCE(aj.total_issues, 0) as total_issues,
            ${hasUrlId ? 'aj.url_id' : 'NULL::uuid as url_id'},
            aj.target_url,
            aj.max_pages, aj.check_seo, aj.check_accessibility, aj.check_security, aj.check_performance,
            u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
     FROM audit_jobs aj
     JOIN users u ON aj.user_id = u.id
     WHERE aj.site_id = ANY($1) AND aj.status = 'completed'
     ORDER BY aj.completed_at DESC
     LIMIT 5`, [siteIds]);
    const recentActivity = recentActivityResult.rows.map(row => {
        const site = siteMap.get(row.site_id);
        const scores = [row.seo_score, row.accessibility_score, row.security_score, row.performance_score]
            .filter((s) => s !== null);
        const overallScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        // Determine scan type based on the audit configuration
        // Matches the presets in NewAudit.tsx
        let scanType;
        if (row.max_pages === 1) {
            scanType = 'single-page';
        }
        else if (row.max_pages === 10 && row.check_seo && !row.check_accessibility && row.check_security && !row.check_performance) {
            scanType = 'quick-scan';
        }
        else if (row.max_pages === 100 && row.check_seo && row.check_accessibility && row.check_security && row.check_performance) {
            scanType = 'full-audit';
        }
        else if (!row.check_seo && row.check_accessibility && !row.check_security && !row.check_performance) {
            scanType = 'accessibility';
        }
        else {
            scanType = 'custom';
        }
        return {
            auditId: row.id,
            siteName: site?.name || 'Unknown',
            domain: site?.domain || '',
            completedAt: row.completed_at.toISOString(),
            overallScore,
            scanType,
            pagesCrawled: row.pages_crawled || 0,
            totalIssues: row.total_issues || 0,
            url: scanType === 'single-page' ? row.target_url : null,
            scores: {
                seo: row.seo_score,
                accessibility: row.accessibility_score,
                security: row.security_score,
                performance: row.performance_score,
                content: row.content_score,
                structuredData: row.structured_data_score,
                cqs: row.cqs_score,
            },
            startedBy: {
                name: `${row.user_first_name} ${row.user_last_name}`.trim(),
                email: row.user_email,
            },
        };
    });
    return {
        totalSites: siteIds.length,
        totalAudits,
        avgScores,
        sitesNeedingAttention,
        siteTrends,
        recentActivity,
    };
}
// =============================================
// URL Score History
// =============================================
async function getUrlScoreHistory(options) {
    const { urlId, url, siteId, range = '30d', from, to } = options;
    let dateFilter;
    let endDate = new Date();
    if (from && to) {
        dateFilter = from;
        endDate = to;
    }
    else {
        dateFilter = getDateRangeFilter(range);
    }
    // If we have the URL string and siteId, query audit_pages (for full-site audits)
    // Otherwise fall back to audit_jobs.url_id (for single-URL audits)
    let result;
    if (url && siteId) {
        result = await pool.query(`SELECT
        aj.id,
        aj.completed_at,
        ap.seo_score,
        ap.accessibility_score,
        ap.security_score,
        ap.performance_score,
        ap.content_score,
        ap.structured_data_score,
        ap.cqs_score
      FROM audit_pages ap
      JOIN audit_jobs aj ON ap.audit_job_id = aj.id
      WHERE ap.url = $1
        AND aj.site_id = $2
        AND aj.status = 'completed'
        AND ap.crawl_status = 'crawled'
        AND aj.completed_at >= $3
        AND aj.completed_at <= $4
      ORDER BY aj.completed_at ASC`, [url, siteId, dateFilter, endDate]);
    }
    else {
        // Fallback for single-URL audits
        result = await pool.query(`SELECT
        id,
        completed_at,
        seo_score,
        accessibility_score,
        security_score,
        performance_score,
        content_score,
        structured_data_score,
        cqs_score
      FROM audit_jobs
      WHERE url_id = $1
        AND status = 'completed'
        AND completed_at >= $2
        AND completed_at <= $3
      ORDER BY completed_at ASC`, [urlId, dateFilter, endDate]);
    }
    const scores = result.rows.map(row => ({
        auditId: row.id,
        completedAt: row.completed_at.toISOString(),
        seo: row.seo_score,
        accessibility: row.accessibility_score,
        security: row.security_score,
        performance: row.performance_score,
        content: row.content_score,
        structuredData: row.structured_data_score,
        cqs: row.cqs_score,
        totalIssues: row.total_issues ?? 0,
        pagesCrawled: row.pages_crawled ?? 0,
    }));
    // Calculate summary
    const validScores = {
        seo: scores.map(s => s.seo).filter((v) => v !== null),
        accessibility: scores.map(s => s.accessibility).filter((v) => v !== null),
        security: scores.map(s => s.security).filter((v) => v !== null),
        performance: scores.map(s => s.performance).filter((v) => v !== null),
        content: scores.map(s => s.content).filter((v) => v !== null),
        structuredData: scores.map(s => s.structuredData).filter((v) => v !== null),
        cqs: scores.map(s => s.cqs).filter((v) => v !== null),
    };
    const summary = {
        averages: {
            seo: validScores.seo.length > 0
                ? Math.round(validScores.seo.reduce((a, b) => a + b, 0) / validScores.seo.length)
                : null,
            accessibility: validScores.accessibility.length > 0
                ? Math.round(validScores.accessibility.reduce((a, b) => a + b, 0) / validScores.accessibility.length)
                : null,
            security: validScores.security.length > 0
                ? Math.round(validScores.security.reduce((a, b) => a + b, 0) / validScores.security.length)
                : null,
            performance: validScores.performance.length > 0
                ? Math.round(validScores.performance.reduce((a, b) => a + b, 0) / validScores.performance.length)
                : null,
            content: validScores.content.length > 0
                ? Math.round(validScores.content.reduce((a, b) => a + b, 0) / validScores.content.length)
                : null,
            structuredData: validScores.structuredData.length > 0
                ? Math.round(validScores.structuredData.reduce((a, b) => a + b, 0) / validScores.structuredData.length)
                : null,
            cqs: validScores.cqs.length > 0
                ? Math.round(validScores.cqs.reduce((a, b) => a + b, 0) / validScores.cqs.length)
                : null,
        },
        trends: {
            seo: calculateTrend(scores.map(s => s.seo)),
            accessibility: calculateTrend(scores.map(s => s.accessibility)),
            security: calculateTrend(scores.map(s => s.security)),
            performance: calculateTrend(scores.map(s => s.performance)),
            content: calculateTrend(scores.map(s => s.content ?? null)),
            structuredData: calculateTrend(scores.map(s => s.structuredData ?? null)),
            cqs: calculateTrend(scores.map(s => s.cqs ?? null)),
        },
        totalAudits: scores.length,
    };
    return { scores, summary };
}
// =============================================
// URL Analytics
// =============================================
async function getUrlAnalytics(urlId, siteId) {
    // Get URL details including scores from site_urls (synced by trigger from audit_pages)
    const urlResult = await pool.query(`SELECT id, url_path, url, last_audited_at, audit_count,
            last_seo_score, last_accessibility_score, last_security_score, last_performance_score, last_content_score
     FROM site_urls WHERE id = $1 AND site_id = $2`, [urlId, siteId]);
    if (urlResult.rows.length === 0) {
        throw new Error('URL not found');
    }
    const urlRow = urlResult.rows[0];
    // Get score history from audit_pages (for this specific URL across all site audits)
    const scoreHistory = await getUrlScoreHistory({ urlId, url: urlRow.url, siteId, range: '90d' });
    // Get site average scores from site_urls (which has synced scores)
    const siteAvgResult = await pool.query(`SELECT
      ROUND(AVG(last_seo_score))::int as avg_seo,
      ROUND(AVG(last_accessibility_score))::int as avg_accessibility,
      ROUND(AVG(last_security_score))::int as avg_security,
      ROUND(AVG(last_performance_score))::int as avg_performance,
      ROUND(AVG(last_content_score))::int as avg_content
    FROM site_urls
    WHERE site_id = $1 AND last_audited_at IS NOT NULL`, [siteId]);
    const siteAvg = siteAvgResult.rows[0] || {
        avg_seo: null,
        avg_accessibility: null,
        avg_security: null,
        avg_performance: null,
        avg_content: null,
    };
    // Use scores from site_urls (already synced from audit_pages by trigger)
    const latestUrlScores = {
        seo_score: urlRow.last_seo_score,
        accessibility_score: urlRow.last_accessibility_score,
        security_score: urlRow.last_security_score,
        performance_score: urlRow.last_performance_score,
        content_score: urlRow.last_content_score,
        structured_data_score: null,
        cqs_score: null,
    };
    // Calculate comparison
    function calcDiff(urlScore, siteScore) {
        if (urlScore === null || siteScore === null)
            return null;
        return urlScore - siteScore;
    }
    const comparisonToSite = {
        seo: {
            url: latestUrlScores.seo_score,
            site: siteAvg.avg_seo,
            diff: calcDiff(latestUrlScores.seo_score, siteAvg.avg_seo),
        },
        accessibility: {
            url: latestUrlScores.accessibility_score,
            site: siteAvg.avg_accessibility,
            diff: calcDiff(latestUrlScores.accessibility_score, siteAvg.avg_accessibility),
        },
        security: {
            url: latestUrlScores.security_score,
            site: siteAvg.avg_security,
            diff: calcDiff(latestUrlScores.security_score, siteAvg.avg_security),
        },
        performance: {
            url: latestUrlScores.performance_score,
            site: siteAvg.avg_performance,
            diff: calcDiff(latestUrlScores.performance_score, siteAvg.avg_performance),
        },
        content: {
            url: latestUrlScores.content_score,
            site: siteAvg.avg_content,
            diff: calcDiff(latestUrlScores.content_score, siteAvg.avg_content),
        },
        structuredData: {
            url: latestUrlScores.structured_data_score,
            site: null,
            diff: null,
        },
        cqs: {
            url: latestUrlScores.cqs_score,
            site: null,
            diff: null,
        },
    };
    // Get recent audits for this URL from audit_pages (includes full-site audits)
    const recentAuditsResult = await pool.query(`SELECT
      aj.id as audit_id,
      aj.completed_at,
      ap.seo_score,
      ap.accessibility_score,
      ap.security_score,
      ap.performance_score,
      ap.content_score,
      ap.structured_data_score,
      ap.cqs_score,
      (COALESCE(ap.seo_issues, 0) + COALESCE(ap.accessibility_issues, 0) +
       COALESCE(ap.security_issues, 0) + COALESCE(ap.performance_issues, 0) +
       COALESCE(ap.content_issues, 0)) as total_issues
     FROM audit_pages ap
     JOIN audit_jobs aj ON ap.audit_job_id = aj.id
     WHERE ap.url = $1
       AND aj.site_id = $2
       AND aj.status = 'completed'
       AND ap.crawl_status = 'crawled'
     ORDER BY aj.completed_at DESC
     LIMIT 10`, [urlRow.url, siteId]);
    const recentAudits = recentAuditsResult.rows.map(row => ({
        id: row.audit_id,
        completedAt: row.completed_at.toISOString(),
        scores: {
            seo: row.seo_score,
            accessibility: row.accessibility_score,
            security: row.security_score,
            performance: row.performance_score,
            content: row.content_score,
            structuredData: row.structured_data_score,
            cqs: row.cqs_score,
        },
        totalIssues: row.total_issues || 0,
    }));
    return {
        url: {
            id: urlRow.id,
            urlPath: urlRow.url_path,
            fullUrl: urlRow.url,
            auditCount: urlRow.audit_count || 0,
            lastAuditedAt: urlRow.last_audited_at?.toISOString() || null,
        },
        scoreHistory,
        comparisonToSite,
        recentAudits,
    };
}
// =============================================
// User Audited URLs (for URL comparison picker)
// =============================================
async function getUserAuditedUrls(userId, search, limit = 50) {
    const params = [userId, Math.min(limit, 100)];
    let searchClause = '';
    if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        searchClause = `AND su.url ILIKE $${params.length}`;
    }
    const result = await pool.query(`SELECT
      su.id as url_id,
      s.id as site_id,
      s.name as site_name,
      s.domain as site_domain,
      su.url,
      su.url_path,
      su.last_audited_at,
      su.last_seo_score,
      su.last_content_score
    FROM site_urls su
    JOIN sites s ON s.id = su.site_id
    LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $1 AND ss.accepted_at IS NOT NULL
    WHERE (s.owner_id = $1 OR ss.id IS NOT NULL)
      AND su.last_audited_at IS NOT NULL
      ${searchClause}
    ORDER BY su.last_audited_at DESC
    LIMIT $2`, params);
    return result.rows.map(row => ({
        urlId: row.url_id,
        siteId: row.site_id,
        siteName: row.site_name,
        siteDomain: row.site_domain,
        url: row.url,
        urlPath: row.url_path,
        lastAuditedAt: row.last_audited_at.toISOString(),
        seoScore: row.last_seo_score,
        contentScore: row.last_content_score,
    }));
}
// =============================================
// URL Comparison
// =============================================
async function getUrlPageSnapshot(siteId, urlId) {
    // Get URL info from site_urls
    const urlResult = await pool.query(`SELECT su.id, su.url, su.url_path, s.id as site_id, s.name as site_name, s.domain as site_domain
     FROM site_urls su
     JOIN sites s ON s.id = su.site_id
     WHERE su.id = $1 AND su.site_id = $2`, [urlId, siteId]);
    if (urlResult.rows.length === 0) {
        throw new Error(`URL ${urlId} not found in site ${siteId}`);
    }
    const urlRow = urlResult.rows[0];
    // Get most recent audit_pages row for this URL
    const pageResult = await pool.query(`SELECT
      ap.id as page_id,
      ap.audit_job_id,
      aj.completed_at,
      ap.seo_score,
      ap.accessibility_score,
      ap.security_score,
      ap.performance_score,
      ap.content_score,
      ap.structured_data_score,
      ap.cqs_score,
      ap.content_quality_score,
      ap.content_readability_score,
      ap.content_structure_score,
      ap.content_engagement_score,
      ap.eeat_score,
      ap.eeat_experience_score,
      ap.eeat_expertise_score,
      ap.eeat_authoritativeness_score,
      ap.eeat_trustworthiness_score,
      ap.eeat_tier,
      ap.has_author_bio,
      ap.has_author_credentials,
      ap.citation_count,
      ap.has_contact_info,
      ap.has_privacy_policy,
      ap.has_terms_of_service,
      ap.eeat_evidence,
      ap.aeo_score,
      ap.aeo_nugget_score,
      ap.aeo_factual_density_score,
      ap.aeo_source_authority_score,
      ap.aeo_tier,
      ap.aeo_nuggets,
      ap.keyword_data,
      ap.flesch_kincaid_grade,
      ap.flesch_reading_ease,
      ap.reading_time_minutes,
      ap.word_count,
      ap.title,
      ap.meta_description,
      ap.h1_text,
      ap.canonical_url,
      ap.content_type as page_content_type,
      ap.status_code,
      ap.response_time_ms,
      ap.page_size_bytes,
      ap.seo_issues,
      ap.accessibility_issues,
      ap.security_issues,
      ap.performance_issues,
      ap.content_issues,
      ap.structured_data_issues,
      ap.json_ld_count,
      ap.has_open_graph,
      ap.has_twitter_card,
      ap.detected_schema_types,
      ap.detected_page_type
    FROM audit_pages ap
    JOIN audit_jobs aj ON aj.id = ap.audit_job_id
    WHERE ap.url = $1
      AND aj.site_id = $2
      AND aj.status = 'completed'
      AND ap.crawl_status = 'crawled'
    ORDER BY aj.completed_at DESC
    LIMIT 1`, [urlRow.url, siteId]);
    if (pageResult.rows.length === 0) {
        throw new Error(`No audit data found for URL ${urlRow.url}`);
    }
    const p = pageResult.rows[0];
    const kw = p.keyword_data;
    const evidence = Array.isArray(p.eeat_evidence) ? p.eeat_evidence : [];
    const nuggets = Array.isArray(p.aeo_nuggets) ? p.aeo_nuggets : [];
    return {
        urlId: urlRow.id,
        siteId: urlRow.site_id,
        siteName: urlRow.site_name,
        siteDomain: urlRow.site_domain,
        url: urlRow.url,
        urlPath: urlRow.url_path,
        auditId: p.audit_job_id,
        auditedAt: p.completed_at.toISOString(),
        pageId: p.page_id,
        scores: {
            seo: p.seo_score,
            accessibility: p.accessibility_score,
            security: p.security_score,
            performance: p.performance_score,
            content: p.content_score,
            structuredData: p.structured_data_score,
            cqs: p.cqs_score,
        },
        issueCountByCategory: {
            seo: p.seo_issues ?? 0,
            accessibility: p.accessibility_issues ?? 0,
            security: p.security_issues ?? 0,
            performance: p.performance_issues ?? 0,
            content: p.content_issues ?? 0,
            structuredData: p.structured_data_issues ?? 0,
        },
        httpPerformance: {
            statusCode: p.status_code,
            responseTimeMs: p.response_time_ms,
            pageSizeBytes: p.page_size_bytes,
        },
        contentSubscores: {
            quality: p.content_quality_score,
            readability: p.content_readability_score,
            structure: p.content_structure_score,
            engagement: p.content_engagement_score,
        },
        eeat: {
            overall: p.eeat_score,
            experience: p.eeat_experience_score,
            expertise: p.eeat_expertise_score,
            authoritativeness: p.eeat_authoritativeness_score,
            trustworthiness: p.eeat_trustworthiness_score,
            tier: p.eeat_tier,
            trustSignals: {
                hasAuthorBio: p.has_author_bio,
                hasAuthorCredentials: p.has_author_credentials,
                citationCount: p.citation_count,
                hasContactInfo: p.has_contact_info,
                hasPrivacyPolicy: p.has_privacy_policy,
                hasTermsOfService: p.has_terms_of_service,
            },
            evidence: evidence.map((e) => ({
                pillar: e.pillar || '',
                type: e.type || '',
                label: e.label || '',
                text: e.text || '',
            })),
        },
        aeo: {
            overall: p.aeo_score,
            nuggetScore: p.aeo_nugget_score,
            factualDensity: p.aeo_factual_density_score,
            sourceAuthority: p.aeo_source_authority_score,
            tier: p.aeo_tier,
            nuggets: nuggets.map((n) => ({
                text: n.text || '',
                type: n.type || '',
                wordCount: n.wordCount || 0,
            })),
        },
        keyword: kw ? {
            keyword: kw.keyword || '',
            density: kw.density || 0,
            occurrences: kw.occurrences || 0,
            inTitle: !!kw.inTitle,
            inH1: !!kw.inH1,
            inFirstParagraph: !!kw.inFirstParagraph,
            inMetaDescription: !!kw.inMetaDescription,
            inUrl: !!kw.inUrl,
            inAltText: !!kw.inAltText,
            inLastParagraph: !!kw.inLastParagraph,
            variationsUsed: kw.variationsUsed || [],
            isStuffed: !!kw.isStuffed,
        } : null,
        readability: {
            fleschKincaidGrade: p.flesch_kincaid_grade != null ? Number(p.flesch_kincaid_grade) : null,
            fleschReadingEase: p.flesch_reading_ease != null ? Number(p.flesch_reading_ease) : null,
            readingTimeMinutes: p.reading_time_minutes,
        },
        meta: {
            wordCount: p.word_count,
            title: p.title,
            metaDescription: p.meta_description,
            h1Text: p.h1_text,
            contentType: p.page_content_type,
            canonicalUrl: p.canonical_url,
        },
        structuredDataDetail: {
            jsonLdCount: p.json_ld_count ?? 0,
            hasOpenGraph: p.has_open_graph ?? false,
            hasTwitterCard: p.has_twitter_card ?? false,
            detectedSchemaTypes: p.detected_schema_types ?? [],
            detectedPageType: p.detected_page_type,
            structuredDataIssues: p.structured_data_issues ?? 0,
        },
    };
}
async function getUrlFindingsDiff(pageIdA, pageIdB) {
    const result = await pool.query(`SELECT af.audit_page_id, af.rule_id, af.rule_name, af.category, af.severity, af.message, af.recommendation
     FROM audit_findings af
     WHERE af.audit_page_id IN ($1, $2)
     ORDER BY af.severity, af.category
     LIMIT 200`, [pageIdA, pageIdB]);
    const findingsA = new Map();
    const findingsB = new Map();
    for (const row of result.rows) {
        const item = {
            ruleId: row.rule_id,
            ruleName: row.rule_name,
            category: row.category,
            severity: row.severity,
            message: row.message,
            recommendation: row.recommendation,
        };
        if (row.audit_page_id === pageIdA) {
            findingsA.set(row.rule_id, item);
        }
        else {
            findingsB.set(row.rule_id, item);
        }
    }
    const uniqueToA = [];
    const uniqueToB = [];
    const shared = [];
    for (const [ruleId, item] of findingsA) {
        if (findingsB.has(ruleId)) {
            shared.push(item);
        }
        else {
            uniqueToA.push(item);
        }
    }
    for (const [ruleId, item] of findingsB) {
        if (!findingsA.has(ruleId)) {
            uniqueToB.push(item);
        }
    }
    function countSeverities(items) {
        return {
            critical: items.filter(i => i.severity === 'critical').length,
            serious: items.filter(i => i.severity === 'serious').length,
            moderate: items.filter(i => i.severity === 'moderate').length,
            minor: items.filter(i => i.severity === 'minor').length,
        };
    }
    return {
        uniqueToA,
        uniqueToB,
        shared,
        summaryA: countSeverities([...uniqueToA, ...shared]),
        summaryB: countSeverities([...uniqueToB, ...shared]),
    };
}
function generateUrlInsights(a, b) {
    const insights = [];
    // Helper to determine winner
    function winner(aVal, bVal) {
        if (aVal === null && bVal === null)
            return 'tie';
        if (aVal === null)
            return 'b';
        if (bVal === null)
            return 'a';
        if (Math.abs(aVal - bVal) < 1)
            return 'tie';
        return bVal > aVal ? 'b' : 'a';
    }
    function severity(delta) {
        if (delta >= 15)
            return 'high';
        if (delta >= 5)
            return 'medium';
        return 'low';
    }
    // Main scores
    const scoreCategories = [
        { key: 'seo', label: 'SEO' },
        { key: 'accessibility', label: 'Accessibility' },
        { key: 'security', label: 'Security' },
        { key: 'performance', label: 'Performance' },
        { key: 'content', label: 'Content' },
        { key: 'structuredData', label: 'Structured Data' },
    ];
    for (const cat of scoreCategories) {
        const aScore = a.scores[cat.key];
        const bScore = b.scores[cat.key];
        if (aScore === null && bScore === null)
            continue;
        const delta = Math.abs((bScore ?? 0) - (aScore ?? 0));
        if (delta < 5)
            continue;
        const w = winner(aScore, bScore);
        const winnerUrl = w === 'a' ? a.urlPath : b.urlPath;
        const loserScore = w === 'a' ? bScore : aScore;
        insights.push({
            category: cat.label,
            winner: w,
            severity: severity(delta),
            title: `${cat.label} score gap of ${delta} points`,
            description: `${winnerUrl} scores ${delta} points higher in ${cat.label} (${w === 'a' ? aScore : bScore} vs ${loserScore}).`,
            recommendation: loserScore !== null && loserScore < 50
                ? `The lower-scoring page needs significant ${cat.label.toLowerCase()} improvements. Review the audit findings for specific issues.`
                : `Review the ${cat.label.toLowerCase()} audit findings on the lower-scoring page to close the gap.`,
        });
    }
    // Content subscores
    const contentSubs = [
        { key: 'quality', label: 'Content Quality' },
        { key: 'readability', label: 'Readability' },
        { key: 'structure', label: 'Content Structure' },
        { key: 'engagement', label: 'Engagement' },
    ];
    for (const sub of contentSubs) {
        const aScore = a.contentSubscores[sub.key];
        const bScore = b.contentSubscores[sub.key];
        if (aScore === null && bScore === null)
            continue;
        const delta = Math.abs((bScore ?? 0) - (aScore ?? 0));
        if (delta < 5)
            continue;
        insights.push({
            category: sub.label,
            winner: winner(aScore, bScore),
            severity: severity(delta),
            title: `${sub.label} differs by ${delta} points`,
            description: `One page scores significantly higher in ${sub.label.toLowerCase()}.`,
            recommendation: sub.key === 'readability'
                ? 'Aim for a Flesch-Kincaid grade level of 7-9 for optimal readability.'
                : `Improve ${sub.label.toLowerCase()} by reviewing the content analysis recommendations.`,
        });
    }
    // E-E-A-T pillars
    const eeatPillars = [
        { key: 'experience', label: 'E-E-A-T Experience' },
        { key: 'expertise', label: 'E-E-A-T Expertise' },
        { key: 'authoritativeness', label: 'E-E-A-T Authoritativeness' },
        { key: 'trustworthiness', label: 'E-E-A-T Trustworthiness' },
    ];
    for (const pillar of eeatPillars) {
        const aScore = a.eeat[pillar.key];
        const bScore = b.eeat[pillar.key];
        if (aScore === null && bScore === null)
            continue;
        const delta = Math.abs((bScore ?? 0) - (aScore ?? 0));
        if (delta < 5)
            continue;
        insights.push({
            category: 'E-E-A-T',
            winner: winner(aScore, bScore),
            severity: severity(delta),
            title: `${pillar.label} gap of ${delta} points`,
            description: `There is a significant difference in ${pillar.label.replace('E-E-A-T ', '').toLowerCase()} signals.`,
            recommendation: pillar.key === 'trustworthiness'
                ? 'Add trust signals like privacy policy, terms of service, and contact information.'
                : pillar.key === 'expertise'
                    ? 'Add author credentials, bios, and cite authoritative sources.'
                    : pillar.key === 'authoritativeness'
                        ? 'Build authority through citations, credentials, and authoritative references.'
                        : 'Demonstrate first-hand experience with specific examples and case studies.',
        });
    }
    // E-E-A-T trust signals comparison
    const aTrustCount = [a.eeat.trustSignals.hasAuthorBio, a.eeat.trustSignals.hasAuthorCredentials,
        a.eeat.trustSignals.hasContactInfo, a.eeat.trustSignals.hasPrivacyPolicy,
        a.eeat.trustSignals.hasTermsOfService].filter(v => v === true).length;
    const bTrustCount = [b.eeat.trustSignals.hasAuthorBio, b.eeat.trustSignals.hasAuthorCredentials,
        b.eeat.trustSignals.hasContactInfo, b.eeat.trustSignals.hasPrivacyPolicy,
        b.eeat.trustSignals.hasTermsOfService].filter(v => v === true).length;
    if (Math.abs(aTrustCount - bTrustCount) >= 2) {
        insights.push({
            category: 'E-E-A-T',
            winner: bTrustCount > aTrustCount ? 'b' : 'a',
            severity: Math.abs(aTrustCount - bTrustCount) >= 3 ? 'high' : 'medium',
            title: `Trust signals: ${Math.max(aTrustCount, bTrustCount)} vs ${Math.min(aTrustCount, bTrustCount)}`,
            description: `One page has significantly more trust signals present (author bio, credentials, contact info, etc.).`,
            recommendation: 'Add missing trust signals: author bio, credentials, contact information, privacy policy, and terms of service.',
        });
    }
    // E-E-A-T tier comparison
    const tierRank = { 'ghost-content': 0, 'standard-web': 1, 'expert-verified': 2 };
    if (a.eeat.tier && b.eeat.tier && a.eeat.tier !== b.eeat.tier) {
        const aRank = tierRank[a.eeat.tier] ?? 0;
        const bRank = tierRank[b.eeat.tier] ?? 0;
        insights.push({
            category: 'E-E-A-T',
            winner: bRank > aRank ? 'b' : 'a',
            severity: Math.abs(aRank - bRank) >= 2 ? 'high' : 'medium',
            title: `E-E-A-T tier: ${a.eeat.tier} vs ${b.eeat.tier}`,
            description: `The pages are classified into different E-E-A-T tiers.`,
            recommendation: 'To reach expert-verified tier, add author credentials, citations, and demonstrate first-hand expertise.',
        });
    }
    // AEO comparison
    const aeoPillars = [
        { key: 'nuggetScore', label: 'AEO Nugget Score' },
        { key: 'factualDensity', label: 'AEO Factual Density' },
        { key: 'sourceAuthority', label: 'AEO Source Authority' },
    ];
    for (const pillar of aeoPillars) {
        const aScore = a.aeo[pillar.key];
        const bScore = b.aeo[pillar.key];
        if (aScore === null && bScore === null)
            continue;
        const delta = Math.abs((bScore ?? 0) - (aScore ?? 0));
        if (delta < 5)
            continue;
        insights.push({
            category: 'AEO',
            winner: winner(aScore, bScore),
            severity: severity(delta),
            title: `${pillar.label} differs by ${delta} points`,
            description: `Significant difference in ${pillar.label.replace('AEO ', '').toLowerCase()}.`,
            recommendation: pillar.key === 'nuggetScore'
                ? 'Add concise, quotable answer nuggets that AI engines can extract directly.'
                : pillar.key === 'factualDensity'
                    ? 'Include more verifiable facts, statistics, and data points.'
                    : 'Cite authoritative sources and establish content credibility.',
        });
    }
    // AEO tier comparison
    const aeoTierRank = { 'ignored': 0, 'general-reference': 1, 'primary-source': 2 };
    if (a.aeo.tier && b.aeo.tier && a.aeo.tier !== b.aeo.tier) {
        const aRank = aeoTierRank[a.aeo.tier] ?? 0;
        const bRank = aeoTierRank[b.aeo.tier] ?? 0;
        insights.push({
            category: 'AEO',
            winner: bRank > aRank ? 'b' : 'a',
            severity: Math.abs(aRank - bRank) >= 2 ? 'high' : 'medium',
            title: `AEO tier: ${a.aeo.tier} vs ${b.aeo.tier}`,
            description: `The pages are classified into different AEO tiers.`,
            recommendation: 'To become a primary source, add concise answer nuggets, verifiable facts, and establish source authority.',
        });
    }
    // Keyword comparison (only if at least one has keyword data)
    if (a.keyword || b.keyword) {
        if (a.keyword && b.keyword) {
            const aPlacementCount = [a.keyword.inTitle, a.keyword.inH1, a.keyword.inFirstParagraph,
                a.keyword.inMetaDescription, a.keyword.inUrl, a.keyword.inAltText, a.keyword.inLastParagraph]
                .filter(Boolean).length;
            const bPlacementCount = [b.keyword.inTitle, b.keyword.inH1, b.keyword.inFirstParagraph,
                b.keyword.inMetaDescription, b.keyword.inUrl, b.keyword.inAltText, b.keyword.inLastParagraph]
                .filter(Boolean).length;
            if (Math.abs(aPlacementCount - bPlacementCount) >= 2) {
                insights.push({
                    category: 'Keywords',
                    winner: bPlacementCount > aPlacementCount ? 'b' : 'a',
                    severity: Math.abs(aPlacementCount - bPlacementCount) >= 3 ? 'high' : 'medium',
                    title: `Keyword placements: ${aPlacementCount} vs ${bPlacementCount}`,
                    description: `One page has the keyword in more strategic locations.`,
                    recommendation: 'Place your target keyword in the title, H1, first paragraph, meta description, and URL for optimal coverage.',
                });
            }
            // Density warnings
            const aOptimal = a.keyword.density >= 1 && a.keyword.density <= 2;
            const bOptimal = b.keyword.density >= 1 && b.keyword.density <= 2;
            if (aOptimal !== bOptimal) {
                insights.push({
                    category: 'Keywords',
                    winner: aOptimal ? 'a' : 'b',
                    severity: 'medium',
                    title: `Keyword density: ${a.keyword.density.toFixed(1)}% vs ${b.keyword.density.toFixed(1)}%`,
                    description: `Optimal keyword density is 1-2%. ${!aOptimal ? 'URL A' : 'URL B'} is outside the optimal range.`,
                    recommendation: a.keyword.isStuffed || b.keyword.isStuffed
                        ? 'Reduce keyword density to avoid keyword stuffing penalties.'
                        : 'Adjust keyword usage to fall within the 1-2% optimal density range.',
                });
            }
        }
        else {
            insights.push({
                category: 'Keywords',
                winner: a.keyword ? 'a' : 'b',
                severity: 'medium',
                title: 'Keyword analysis available for only one URL',
                description: `Only one page has keyword data. The other may not have been analyzed for keyword usage.`,
                recommendation: 'Ensure both pages target specific keywords for comparison.',
            });
        }
    }
    // Readability comparison
    if (a.readability.fleschKincaidGrade !== null && b.readability.fleschKincaidGrade !== null) {
        const aGrade = a.readability.fleschKincaidGrade;
        const bGrade = b.readability.fleschKincaidGrade;
        const aOptimal = aGrade >= 7 && aGrade <= 9;
        const bOptimal = bGrade >= 7 && bGrade <= 9;
        if (aOptimal !== bOptimal && Math.abs(aGrade - bGrade) >= 2) {
            insights.push({
                category: 'Readability',
                winner: aOptimal ? 'a' : 'b',
                severity: Math.abs(aGrade - bGrade) >= 4 ? 'high' : 'medium',
                title: `Reading level: grade ${aGrade.toFixed(1)} vs ${bGrade.toFixed(1)}`,
                description: `Optimal reading level is grade 7-9. ${!aOptimal ? 'URL A' : 'URL B'} is outside the optimal range.`,
                recommendation: aGrade > 9 || bGrade > 9
                    ? 'Simplify sentence structure and use shorter words to lower the reading level.'
                    : 'Add more detailed and varied vocabulary to raise the reading level slightly.',
            });
        }
    }
    // Word count comparison
    if (a.meta.wordCount !== null && b.meta.wordCount !== null) {
        const ratio = Math.max(a.meta.wordCount, b.meta.wordCount) / Math.max(Math.min(a.meta.wordCount, b.meta.wordCount), 1);
        if (ratio > 1.5 && Math.abs(a.meta.wordCount - b.meta.wordCount) > 200) {
            insights.push({
                category: 'Content',
                winner: 'tie',
                severity: ratio > 2 ? 'high' : 'medium',
                title: `Word count: ${a.meta.wordCount} vs ${b.meta.wordCount}`,
                description: `Significant difference in content length (${Math.round((ratio - 1) * 100)}% more on one page).`,
                recommendation: 'Content length should match user intent. Longer content isn\'t always better—focus on comprehensiveness and relevance.',
            });
        }
    }
    // Issue count comparison
    const aTotalIssues = Object.values(a.issueCountByCategory).reduce((s, v) => s + v, 0);
    const bTotalIssues = Object.values(b.issueCountByCategory).reduce((s, v) => s + v, 0);
    if (Math.abs(aTotalIssues - bTotalIssues) > 20) {
        insights.push({
            category: 'Issues',
            winner: bTotalIssues < aTotalIssues ? 'b' : 'a',
            severity: 'high',
            title: `Total issues: ${aTotalIssues} vs ${bTotalIssues}`,
            description: `One page has significantly more issues (${Math.abs(aTotalIssues - bTotalIssues)} more).`,
            recommendation: 'Focus on the page with more issues to reduce overall technical debt.',
        });
    }
    const issueCats = [
        { key: 'seo', label: 'SEO' }, { key: 'accessibility', label: 'Accessibility' },
        { key: 'security', label: 'Security' }, { key: 'performance', label: 'Performance' },
        { key: 'content', label: 'Content' }, { key: 'structuredData', label: 'Structured Data' },
    ];
    for (const cat of issueCats) {
        const aCount = a.issueCountByCategory[cat.key];
        const bCount = b.issueCountByCategory[cat.key];
        if (aCount > 0 && bCount > 0) {
            const ratio = Math.max(aCount, bCount) / Math.max(Math.min(aCount, bCount), 1);
            if (ratio >= 3 && Math.abs(aCount - bCount) >= 3) {
                insights.push({
                    category: 'Issues',
                    winner: bCount < aCount ? 'b' : 'a',
                    severity: 'high',
                    title: `${cat.label} issues: ${aCount} vs ${bCount}`,
                    description: `One page has ${Math.round(ratio)}x more ${cat.label.toLowerCase()} issues.`,
                    recommendation: `Review ${cat.label.toLowerCase()} findings on the page with more issues.`,
                });
            }
        }
    }
    // HTTP Performance insights
    if (a.httpPerformance.responseTimeMs !== null && b.httpPerformance.responseTimeMs !== null) {
        const rtDelta = Math.abs(a.httpPerformance.responseTimeMs - b.httpPerformance.responseTimeMs);
        if (rtDelta > 500) {
            insights.push({
                category: 'Performance',
                winner: a.httpPerformance.responseTimeMs < b.httpPerformance.responseTimeMs ? 'a' : 'b',
                severity: rtDelta > 1500 ? 'high' : 'medium',
                title: `Response time: ${a.httpPerformance.responseTimeMs}ms vs ${b.httpPerformance.responseTimeMs}ms`,
                description: `Response time differs by ${rtDelta}ms.`,
                recommendation: 'Investigate server-side optimizations, caching, and CDN configuration for the slower page.',
            });
        }
    }
    if (a.httpPerformance.pageSizeBytes !== null && b.httpPerformance.pageSizeBytes !== null) {
        const aSize = a.httpPerformance.pageSizeBytes;
        const bSize = b.httpPerformance.pageSizeBytes;
        const sizeRatio = Math.max(aSize, bSize) / Math.max(Math.min(aSize, bSize), 1);
        if (sizeRatio > 2) {
            insights.push({
                category: 'Performance',
                winner: aSize < bSize ? 'a' : 'b',
                severity: 'medium',
                title: `Page size: ${(aSize / 1024).toFixed(0)}KB vs ${(bSize / 1024).toFixed(0)}KB`,
                description: `One page is ${sizeRatio.toFixed(1)}x larger than the other.`,
                recommendation: 'Optimize images, minify CSS/JS, and remove unused resources to reduce page size.',
            });
        }
    }
    // Structured Data insights
    const aHasJsonLd = a.structuredDataDetail.jsonLdCount > 0;
    const bHasJsonLd = b.structuredDataDetail.jsonLdCount > 0;
    if (aHasJsonLd !== bHasJsonLd) {
        insights.push({
            category: 'Structured Data',
            winner: aHasJsonLd ? 'a' : 'b',
            severity: 'high',
            title: 'JSON-LD structured data present on only one page',
            description: `${aHasJsonLd ? 'URL A' : 'URL B'} has JSON-LD markup while the other has none.`,
            recommendation: 'Add JSON-LD structured data to improve search engine understanding and enable rich results.',
        });
    }
    if (a.structuredDataDetail.hasOpenGraph !== b.structuredDataDetail.hasOpenGraph) {
        insights.push({
            category: 'Structured Data',
            winner: a.structuredDataDetail.hasOpenGraph ? 'a' : 'b',
            severity: 'medium',
            title: 'Open Graph tags present on only one page',
            description: `${a.structuredDataDetail.hasOpenGraph ? 'URL A' : 'URL B'} has Open Graph tags for social sharing.`,
            recommendation: 'Add Open Graph meta tags to control how the page appears when shared on social media.',
        });
    }
    if (a.structuredDataDetail.hasTwitterCard !== b.structuredDataDetail.hasTwitterCard) {
        insights.push({
            category: 'Structured Data',
            winner: a.structuredDataDetail.hasTwitterCard ? 'a' : 'b',
            severity: 'low',
            title: 'Twitter Card present on only one page',
            description: `${a.structuredDataDetail.hasTwitterCard ? 'URL A' : 'URL B'} has Twitter Card markup.`,
            recommendation: 'Add Twitter Card meta tags for optimized display on Twitter/X.',
        });
    }
    const aSchemaCount = a.structuredDataDetail.detectedSchemaTypes.length;
    const bSchemaCount = b.structuredDataDetail.detectedSchemaTypes.length;
    if (Math.abs(aSchemaCount - bSchemaCount) > 2) {
        insights.push({
            category: 'Structured Data',
            winner: aSchemaCount > bSchemaCount ? 'a' : 'b',
            severity: 'medium',
            title: `Schema types: ${aSchemaCount} vs ${bSchemaCount}`,
            description: `One page has significantly more schema types detected.`,
            recommendation: 'Add relevant schema types (Article, FAQ, HowTo, etc.) to improve search visibility.',
        });
    }
    // E-E-A-T evidence comparison
    const aEvidenceCount = a.eeat.evidence.length;
    const bEvidenceCount = b.eeat.evidence.length;
    if (Math.abs(aEvidenceCount - bEvidenceCount) > 3) {
        insights.push({
            category: 'E-E-A-T',
            winner: aEvidenceCount > bEvidenceCount ? 'a' : 'b',
            severity: 'medium',
            title: `E-E-A-T evidence items: ${aEvidenceCount} vs ${bEvidenceCount}`,
            description: `One page has more E-E-A-T evidence items detected.`,
            recommendation: 'Add more trust signals, author bios, credentials, and citations to strengthen E-E-A-T.',
        });
    }
    // AEO nugget comparison
    const aNuggetCount = a.aeo.nuggets.length;
    const bNuggetCount = b.aeo.nuggets.length;
    if (Math.abs(aNuggetCount - bNuggetCount) > 3) {
        insights.push({
            category: 'AEO',
            winner: aNuggetCount > bNuggetCount ? 'a' : 'b',
            severity: 'medium',
            title: `AI-extractable nuggets: ${aNuggetCount} vs ${bNuggetCount}`,
            description: `One page has more content nuggets that AI engines can extract.`,
            recommendation: 'Add concise, factual snippets, definitions, and how-to steps that AI can easily extract.',
        });
    }
    // SEO signals
    if (a.meta.title !== null || b.meta.title !== null) {
        const aLen = a.meta.title?.length ?? 0;
        const bLen = b.meta.title?.length ?? 0;
        if ((aLen === 0 || aLen < 30) && bLen >= 30) {
            insights.push({
                category: 'SEO',
                winner: 'b',
                severity: 'high',
                title: aLen === 0 ? 'URL A is missing a title tag' : `URL A title is too short (${aLen} chars)`,
                description: 'A well-crafted title tag of 50-60 characters is essential for SEO.',
                recommendation: 'Write a descriptive title tag between 50-60 characters including the target keyword.',
            });
        }
        else if ((bLen === 0 || bLen < 30) && aLen >= 30) {
            insights.push({
                category: 'SEO',
                winner: 'a',
                severity: 'high',
                title: bLen === 0 ? 'URL B is missing a title tag' : `URL B title is too short (${bLen} chars)`,
                description: 'A well-crafted title tag of 50-60 characters is essential for SEO.',
                recommendation: 'Write a descriptive title tag between 50-60 characters including the target keyword.',
            });
        }
    }
    if (a.meta.metaDescription !== null || b.meta.metaDescription !== null) {
        const aLen = a.meta.metaDescription?.length ?? 0;
        const bLen = b.meta.metaDescription?.length ?? 0;
        if ((aLen === 0 || aLen < 70) && bLen >= 70) {
            insights.push({
                category: 'SEO',
                winner: 'b',
                severity: 'medium',
                title: aLen === 0 ? 'URL A is missing a meta description' : `URL A meta description is too short (${aLen} chars)`,
                description: 'A meta description of 150-160 characters improves click-through rates.',
                recommendation: 'Write a compelling meta description between 150-160 characters.',
            });
        }
        else if ((bLen === 0 || bLen < 70) && aLen >= 70) {
            insights.push({
                category: 'SEO',
                winner: 'a',
                severity: 'medium',
                title: bLen === 0 ? 'URL B is missing a meta description' : `URL B meta description is too short (${bLen} chars)`,
                description: 'A meta description of 150-160 characters improves click-through rates.',
                recommendation: 'Write a compelling meta description between 150-160 characters.',
            });
        }
    }
    // Sort by severity (high first)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((x, y) => severityOrder[x.severity] - severityOrder[y.severity]);
    return insights;
}
async function compareUrls(urlSpecs) {
    const [snapshotA, snapshotB] = await Promise.all([
        getUrlPageSnapshot(urlSpecs[0].siteId, urlSpecs[0].urlId),
        getUrlPageSnapshot(urlSpecs[1].siteId, urlSpecs[1].urlId),
    ]);
    // Compute score deltas (b - a)
    const scoreDeltas = {};
    const scoreKeys = ['seo', 'accessibility', 'security', 'performance', 'content', 'structuredData'];
    for (const key of scoreKeys) {
        const aVal = snapshotA.scores[key];
        const bVal = snapshotB.scores[key];
        scoreDeltas[key] = aVal !== null && bVal !== null ? bVal - aVal : null;
    }
    const insights = generateUrlInsights(snapshotA, snapshotB);
    // Get findings diff for the two audit pages
    const findingsDiff = await getUrlFindingsDiff(snapshotA.pageId, snapshotB.pageId);
    return {
        urls: [snapshotA, snapshotB],
        scoreDeltas,
        insights,
        findingsDiff,
    };
}
// =============================================
// Issue Waterfall (fixed/new/remaining per audit pair)
// =============================================
async function getIssueWaterfall(siteId, userId) {
    const result = await pool.query(`SELECT id, completed_at, total_issues
     FROM audit_jobs
     WHERE site_id = (SELECT id FROM sites WHERE id = $1 AND user_id = $2)
       AND status = 'completed'
     ORDER BY completed_at ASC
     LIMIT 20`, [siteId, userId]);
    const audits = result.rows;
    if (audits.length === 0)
        return { steps: [] };
    const steps = [];
    for (let i = 0; i < audits.length; i++) {
        const audit = audits[i];
        if (i === 0) {
            steps.push({
                auditId: audit.id,
                completedAt: audit.completed_at,
                totalIssues: audit.total_issues || 0,
                fixed: 0,
                introduced: audit.total_issues || 0,
            });
            continue;
        }
        const prev = audits[i - 1];
        // Count findings that were in previous audit but not in current (fixed)
        const fixedResult = await pool.query(`SELECT COUNT(DISTINCT rule_id) as cnt
       FROM audit_findings
       WHERE audit_id = $1
         AND rule_id NOT IN (SELECT DISTINCT rule_id FROM audit_findings WHERE audit_id = $2)`, [prev.id, audit.id]);
        // Count findings that are in current but not in previous (new)
        const newResult = await pool.query(`SELECT COUNT(DISTINCT rule_id) as cnt
       FROM audit_findings
       WHERE audit_id = $1
         AND rule_id NOT IN (SELECT DISTINCT rule_id FROM audit_findings WHERE audit_id = $2)`, [audit.id, prev.id]);
        steps.push({
            auditId: audit.id,
            completedAt: audit.completed_at,
            totalIssues: audit.total_issues || 0,
            fixed: parseInt(fixedResult.rows[0].cnt) || 0,
            introduced: parseInt(newResult.rows[0].cnt) || 0,
        });
    }
    return { steps };
}
// =============================================
// Fix Velocity (cumulative fixed vs new over time)
// =============================================
async function getFixVelocity(siteId, userId) {
    const waterfall = await getIssueWaterfall(siteId, userId);
    let cumulativeFixed = 0;
    let cumulativeNew = 0;
    const points = waterfall.steps.map(step => {
        cumulativeFixed += step.fixed;
        cumulativeNew += step.introduced;
        return {
            auditId: step.auditId,
            completedAt: step.completedAt,
            cumulativeFixed,
            cumulativeNew,
            netChange: cumulativeFixed - cumulativeNew,
        };
    });
    return { points };
}
// =============================================
// Page Finding Heatmap
// =============================================
async function getPageHeatmap(siteId, auditId, userId) {
    // Verify ownership
    const siteCheck = await pool.query(`SELECT 1 FROM sites WHERE id = $1 AND user_id = $2`, [siteId, userId]);
    if (siteCheck.rows.length === 0)
        return { pages: [] };
    const result = await pool.query(`SELECT
       ap.id as page_id,
       ap.url,
       f.category,
       COUNT(*) as issue_count,
       MAX(CASE
         WHEN f.severity = 'critical' THEN 4
         WHEN f.severity = 'serious' THEN 3
         WHEN f.severity = 'moderate' THEN 2
         WHEN f.severity = 'minor' THEN 1
         ELSE 0
       END) as max_severity_num,
       MAX(f.severity) as max_severity
     FROM audit_pages ap
     LEFT JOIN audit_findings f ON f.audit_id = ap.audit_id AND f.page_id = ap.id
     WHERE ap.audit_id = $1
     GROUP BY ap.id, ap.url, f.category
     ORDER BY ap.url`, [auditId]);
    const pageMap = {};
    for (const row of result.rows) {
        if (!pageMap[row.page_id]) {
            pageMap[row.page_id] = { pageId: row.page_id, url: row.url, categories: {} };
        }
        if (row.category) {
            pageMap[row.page_id].categories[row.category] = {
                count: parseInt(row.issue_count),
                maxSeverity: row.max_severity || 'none',
            };
        }
    }
    return { pages: Object.values(pageMap) };
}
// =============================================
// Response Time Distribution
// =============================================
async function getResponseTimeDistribution(auditId, userId) {
    const result = await pool.query(`SELECT ap.response_time_ms
     FROM audit_pages ap
     JOIN audit_jobs aj ON aj.id = ap.audit_id
     JOIN sites s ON s.id = aj.site_id
     WHERE ap.audit_id = $1 AND s.user_id = $2 AND ap.response_time_ms IS NOT NULL
     ORDER BY ap.response_time_ms`, [auditId, userId]);
    const times = result.rows.map(r => r.response_time_ms);
    if (times.length === 0) {
        return { buckets: [], stats: { median: 0, p75: 0, p95: 0, max: 0, total: 0 } };
    }
    // Build histogram buckets
    const ranges = [
        { range: '0-100ms', min: 0, max: 100 },
        { range: '100-200ms', min: 100, max: 200 },
        { range: '200-500ms', min: 200, max: 500 },
        { range: '500ms-1s', min: 500, max: 1000 },
        { range: '1-2s', min: 1000, max: 2000 },
        { range: '2-5s', min: 2000, max: 5000 },
        { range: '5s+', min: 5000, max: Infinity },
    ];
    const buckets = ranges.map(r => ({
        ...r,
        count: times.filter(t => t >= r.min && t < r.max).length,
    }));
    const percentile = (arr, p) => {
        const idx = Math.ceil(arr.length * p / 100) - 1;
        return arr[Math.max(0, idx)];
    };
    return {
        buckets,
        stats: {
            median: percentile(times, 50),
            p75: percentile(times, 75),
            p95: percentile(times, 95),
            max: times[times.length - 1],
            total: times.length,
        },
    };
}
// =============================================
// Page Size Distribution
// =============================================
async function getPageSizeDistribution(auditId, userId) {
    const BUDGET_BYTES = 500 * 1024; // 500KB default budget
    const result = await pool.query(`SELECT ap.url, ap.page_size_bytes
     FROM audit_pages ap
     JOIN audit_jobs aj ON aj.id = ap.audit_id
     JOIN sites s ON s.id = aj.site_id
     WHERE ap.audit_id = $1 AND s.user_id = $2 AND ap.page_size_bytes IS NOT NULL
     ORDER BY ap.page_size_bytes DESC
     LIMIT 50`, [auditId, userId]);
    const pages = result.rows.map(r => ({
        url: r.url,
        sizeBytes: r.page_size_bytes,
        overBudget: r.page_size_bytes > BUDGET_BYTES,
    }));
    const sizes = pages.map(p => p.sizeBytes).sort((a, b) => a - b);
    const median = sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 0;
    return {
        pages,
        stats: {
            median,
            total: pages.length,
            overBudgetCount: pages.filter(p => p.overBudget).length,
        },
        budgetBytes: BUDGET_BYTES,
    };
}
//# sourceMappingURL=analytics.service.js.map