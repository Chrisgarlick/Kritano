import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getUserTierLimits } from '../../services/site.service.js';
import { pool } from '../../db/index.js';
import { enMapping, buildWcagToEnMap } from '../../data/en-301-549-mapping.js';
import type { ENClause } from '../../data/en-301-549-mapping.js';

const router = Router();

/** Tiers that receive the full clauses breakdown */
const FULL_ACCESS_TIERS = ['pro', 'agency', 'enterprise'];

type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';

interface ClauseFinding {
  ruleId: string;
  severity: string;
  count: number;
}

interface ClauseResult {
  clause: string;
  title: string;
  wcagCriteria: string;
  status: 'pass' | 'fail' | 'manual_review' | 'not_tested';
  issueCount: number;
  findings: ClauseFinding[];
}

/**
 * GET /api/audits/:id/compliance
 * EAA Compliance Passport — maps audit accessibility findings to EN 301 549 clauses
 */
router.get('/:id/compliance', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // 1. Verify audit ownership
    const auditResult = await pool.query(
      `SELECT id, target_domain, completed_at, created_at, check_accessibility,
              pages_found, pages_crawled, pages_audited
       FROM audit_jobs
       WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

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
        status: 'not_assessed' as ComplianceStatus,
        standard: 'EN 301 549 (WCAG 2.2 Level AA)',
        summary: {
          totalClauses: enMapping.length,
          passing: 0,
          failing: 0,
          manualReview: 0,
          notTested: enMapping.length,
        },
        clauses: [],
        auditDate: audit.completed_at || audit.created_at,
        domain: audit.target_domain,
        pagesAudited: parseInt(audit.pages_audited, 10) || 0,
      });
      return;
    }

    // 3. Get user tier for gating
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';

    // 4. Fetch accessibility findings grouped by rule_id + wcag_criteria + severity
    //    Use COUNT(DISTINCT rule_id) approach per CLAUDE.md (unique issues)
    const findingsResult = await pool.query<{
      rule_id: string;
      severity: string;
      wcag_criteria: string;
      issue_count: string;
    }>(`
      SELECT
        rule_id,
        severity,
        COALESCE(wcag_criteria, '') as wcag_criteria,
        COUNT(DISTINCT CONCAT(rule_id, '|', COALESCE(page_url, ''))) as issue_count
      FROM audit_findings
      WHERE audit_job_id = $1 AND category = 'accessibility'
      GROUP BY rule_id, severity, wcag_criteria
      ORDER BY rule_id
    `, [auditId]);

    // 5. Build WCAG → EN clause lookup
    const wcagToEn = buildWcagToEnMap();

    // 6. Map findings to EN 301 549 clauses
    //    A finding may reference one or more WCAG criteria (comma-separated or single)
    const clauseMap = new Map<string, ClauseResult>();

    // Initialise all clauses
    for (const en of enMapping) {
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
        .map((c: string) => c.trim())
        .filter(Boolean);

      for (const criterion of criteria) {
        const enClauses = wcagToEn.get(criterion);
        if (!enClauses) continue;

        for (const en of enClauses) {
          const entry = clauseMap.get(en.clause)!;
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
        if (f.severity === 'critical') criticalCount += f.count;
        if (f.severity === 'serious') seriousCount += f.count;
      }
    }

    let status: ComplianceStatus;
    if (failing === 0 && criticalCount === 0 && seriousCount === 0) {
      status = 'compliant';
    } else if (criticalCount > 0 || seriousCount > 5) {
      status = 'non_compliant';
    } else {
      status = 'partially_compliant';
    }

    // 9. Build response — tier-gate the clauses array
    const response: Record<string, unknown> = {
      status,
      standard: 'EN 301 549 (WCAG 2.2 Level AA)',
      summary: {
        totalClauses: enMapping.length,
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
    } else {
      response.clauses = [];
      response.tierLocked = true;
      response.requiredTier = 'pro';
    }

    res.json(response);
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({
      error: 'Failed to generate compliance report',
      code: 'COMPLIANCE_REPORT_FAILED',
    });
  }
});

export const complianceRouter = router;
