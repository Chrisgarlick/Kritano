"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceRouter = void 0;
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const site_service_js_1 = require("../../services/site.service.js");
const index_js_1 = require("../../db/index.js");
const en_301_549_mapping_js_1 = require("../../data/en-301-549-mapping.js");
const router = (0, express_1.Router)();
/** Tiers that receive the full clauses breakdown */
const FULL_ACCESS_TIERS = ['pro', 'agency', 'enterprise'];
/**
 * GET /api/audits/:id/compliance
 * EAA Compliance Passport — maps audit accessibility findings to EN 301 549 clauses
 */
router.get('/:id/compliance', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const auditId = req.params.id;
        // 1. Verify audit ownership
        const auditResult = await index_js_1.pool.query(`SELECT id, target_domain, completed_at, created_at, check_accessibility,
              pages_found, pages_crawled, pages_audited, wcag_level, wcag_version
       FROM audit_jobs
       WHERE id = $1 AND user_id = $2`, [auditId, userId]);
        if (auditResult.rows.length === 0) {
            res.status(404).json({
                error: 'Audit not found',
                code: 'AUDIT_NOT_FOUND',
            });
            return;
        }
        const audit = auditResult.rows[0];
        // 2. Check if accessibility was tested
        if (!audit.check_accessibility) {
            res.json({
                status: 'not_assessed',
                standard: 'EN 301 549 (WCAG 2.2 Level AA)',
                summary: {
                    totalClauses: en_301_549_mapping_js_1.enMapping.length,
                    passing: 0,
                    failing: 0,
                    manualReview: 0,
                    notTested: en_301_549_mapping_js_1.enMapping.length,
                },
                clauses: [],
                auditDate: audit.completed_at || audit.created_at,
                domain: audit.target_domain,
                pagesAudited: parseInt(audit.pages_audited, 10) || 0,
            });
            return;
        }
        // 3. Get user tier for gating
        const tierLimits = await (0, site_service_js_1.getUserTierLimits)(userId);
        const tier = tierLimits?.tier || 'free';
        // 4. Fetch accessibility findings grouped by rule_id + wcag_criteria + severity
        //    Use COUNT(DISTINCT rule_id) approach per CLAUDE.md (unique issues)
        const findingsResult = await index_js_1.pool.query(`
      SELECT
        f.rule_id,
        f.severity,
        COALESCE(array_to_string(f.wcag_criteria, ','), '') as wcag_criteria,
        COUNT(DISTINCT CONCAT(f.rule_id, '|', COALESCE(p.url, ''))) as issue_count
      FROM audit_findings f
      LEFT JOIN audit_pages p ON p.id = f.audit_page_id
      WHERE f.audit_job_id = $1 AND f.category = 'accessibility'
      GROUP BY f.rule_id, f.severity, array_to_string(f.wcag_criteria, ',')
      ORDER BY f.rule_id
    `, [auditId]);
        // 5. Build WCAG → EN clause lookup
        const wcagToEn = (0, en_301_549_mapping_js_1.buildWcagToEnMap)();
        // 6. Map findings to EN 301 549 clauses
        //    A finding may reference one or more WCAG criteria (comma-separated or single)
        const clauseMap = new Map();
        // Initialise all clauses
        for (const en of en_301_549_mapping_js_1.enMapping) {
            clauseMap.set(en.clause, {
                clause: en.clause,
                title: en.title,
                wcagCriteria: en.wcagCriteria,
                status: en.manualOnly ? 'manual_review' : 'pass',
                issueCount: 0,
                findings: [],
            });
        }
        // Process each finding row
        for (const row of findingsResult.rows) {
            const criteria = row.wcag_criteria
                .split(/[,;]\s*/)
                .map((c) => c.trim())
                .filter(Boolean);
            for (const criterion of criteria) {
                const enClauses = wcagToEn.get(criterion);
                if (!enClauses)
                    continue;
                for (const en of enClauses) {
                    const entry = clauseMap.get(en.clause);
                    const count = parseInt(row.issue_count, 10);
                    entry.issueCount += count;
                    entry.status = 'fail';
                    entry.findings.push({
                        ruleId: row.rule_id,
                        severity: row.severity,
                        count,
                    });
                }
            }
        }
        // 7. Calculate summary counts
        const clauseResults = Array.from(clauseMap.values());
        const passing = clauseResults.filter(c => c.status === 'pass').length;
        const failing = clauseResults.filter(c => c.status === 'fail').length;
        const manualReview = clauseResults.filter(c => c.status === 'manual_review').length;
        const notTested = clauseResults.filter(c => c.status === 'not_tested').length;
        // 8. Determine overall compliance status
        //    Count severity totals across all failing clauses
        let criticalCount = 0;
        let seriousCount = 0;
        for (const clause of clauseResults) {
            for (const f of clause.findings) {
                if (f.severity === 'critical')
                    criticalCount += f.count;
                if (f.severity === 'serious')
                    seriousCount += f.count;
            }
        }
        let status;
        if (failing === 0 && criticalCount === 0 && seriousCount === 0) {
            status = 'compliant';
        }
        else if (criticalCount > 0 || seriousCount > 5) {
            status = 'non_compliant';
        }
        else {
            status = 'partially_compliant';
        }
        // 9. Calculate AAA compliance separately when audit targets AAA
        //    The EN 301 549 status is always based on WCAG AA criteria.
        //    AAA compliance considers all accessibility findings (AA + AAA).
        const wcagLevel = audit.wcag_level || 'AA';
        let aaaStatus;
        if (wcagLevel === 'AAA') {
            // Count ALL accessibility findings (AA + AAA) for overall AAA compliance
            const allFindingsResult = await index_js_1.pool.query(`
        SELECT f.severity, COUNT(DISTINCT f.rule_id) as cnt
        FROM audit_findings f
        WHERE f.audit_job_id = $1 AND f.category = 'accessibility' AND f.status != 'dismissed'
        GROUP BY f.severity
      `, [auditId]);
            let aaaCritical = 0;
            let aaaSerious = 0;
            let aaaTotal = 0;
            for (const row of allFindingsResult.rows) {
                const cnt = parseInt(row.cnt, 10);
                aaaTotal += cnt;
                if (row.severity === 'critical')
                    aaaCritical += cnt;
                if (row.severity === 'serious')
                    aaaSerious += cnt;
            }
            if (aaaTotal === 0) {
                aaaStatus = 'compliant';
            }
            else if (aaaCritical > 0 || aaaSerious > 5) {
                aaaStatus = 'non_compliant';
            }
            else {
                aaaStatus = 'partially_compliant';
            }
        }
        // 10. Build response — tier-gate the clauses array
        const response = {
            status: wcagLevel === 'AAA' ? aaaStatus : status,
            wcagLevel,
            aaStatus: status,
            aaaStatus: aaaStatus || undefined,
            standard: 'EN 301 549 (WCAG 2.2 Level AA)',
            summary: {
                totalClauses: en_301_549_mapping_js_1.enMapping.length,
                passing,
                failing,
                manualReview,
                notTested,
            },
            auditDate: audit.completed_at || audit.created_at,
            domain: audit.target_domain,
            pagesAudited: parseInt(audit.pages_audited, 10) || 0,
        };
        // Full clauses only for Pro+
        if (FULL_ACCESS_TIERS.includes(tier)) {
            response.clauses = clauseResults;
        }
        else {
            response.clauses = [];
            response.tierLocked = true;
            response.requiredTier = 'pro';
        }
        res.json(response);
    }
    catch (error) {
        console.error('Compliance report error:', error);
        res.status(500).json({
            error: 'Failed to generate compliance report',
            code: 'COMPLIANCE_REPORT_FAILED',
        });
    }
});
exports.complianceRouter = router;
//# sourceMappingURL=index.js.map