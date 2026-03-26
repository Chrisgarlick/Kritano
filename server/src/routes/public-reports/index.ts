import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { authenticate } from '../../middleware/auth.middleware.js';
import { pool } from '../../db/index.js';
import { getUserTierLimits } from '../../services/site.service.js';

const router = Router();

/**
 * POST /api/audits/:id/share
 * Generate a shareable public link for an audit report.
 * Requires authentication. Tier-gated: pro, agency, or enterprise.
 */
router.post('/audits/:id/share', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditId = req.params.id;
    const userId = req.user!.id;

    // Tier check: only pro, agency, enterprise
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits?.tier as string) || 'free';
    if (!['pro', 'agency', 'enterprise'].includes(tier)) {
      res.status(403).json({ error: 'Sharing audit reports requires a Pro plan or higher.' });
      return;
    }

    // Verify audit exists and user has access (owner or site member)
    const auditResult = await pool.query(
      `SELECT aj.id, aj.site_id, aj.user_id, aj.share_token, aj.share_expires_at
       FROM audit_jobs aj
       WHERE aj.id = $1`,
      [auditId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    const audit = auditResult.rows[0];

    // Check ownership or site membership
    let hasAccess = audit.user_id === userId;
    if (!hasAccess && audit.site_id) {
      const memberResult = await pool.query(
        `SELECT 1 FROM site_members WHERE site_id = $1 AND user_id = $2`,
        [audit.site_id, userId]
      );
      hasAccess = memberResult.rows.length > 0;
    }

    if (!hasAccess) {
      res.status(403).json({ error: 'You do not have access to this audit.' });
      return;
    }

    // Generate a 32-byte (64 hex char) crypto random token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await pool.query(
      `UPDATE audit_jobs SET share_token = $1, share_expires_at = $2 WHERE id = $3`,
      [shareToken, expiresAt.toISOString(), auditId]
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.json({
      shareUrl: `${appUrl}/public/reports/${shareToken}`,
      token: shareToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Share audit error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

/**
 * DELETE /api/audits/:id/share
 * Revoke a shareable link for an audit report.
 * Requires authentication. Only the audit owner or site member can revoke.
 */
router.delete('/audits/:id/share', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditId = req.params.id;
    const userId = req.user!.id;

    // Verify audit exists and user has access
    const auditResult = await pool.query(
      `SELECT aj.id, aj.site_id, aj.user_id
       FROM audit_jobs aj
       WHERE aj.id = $1`,
      [auditId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    const audit = auditResult.rows[0];

    // Check ownership or site membership
    let hasAccess = audit.user_id === userId;
    if (!hasAccess && audit.site_id) {
      const memberResult = await pool.query(
        `SELECT 1 FROM site_members WHERE site_id = $1 AND user_id = $2`,
        [audit.site_id, userId]
      );
      hasAccess = memberResult.rows.length > 0;
    }

    if (!hasAccess) {
      res.status(403).json({ error: 'You do not have access to this audit.' });
      return;
    }

    await pool.query(
      `UPDATE audit_jobs SET share_token = NULL, share_expires_at = NULL WHERE id = $1`,
      [auditId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke share link error:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

/**
 * GET /api/public/reports/:token
 * Public (unauthenticated) endpoint to view a shared audit report.
 * Returns audit scores and findings summary (not raw findings).
 */
router.get('/public/reports/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    // Validate token format (must be 64 hex chars)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    // Look up audit by share_token, check expiry
    const result = await pool.query(
      `SELECT
        aj.id,
        aj.target_url,
        aj.target_domain,
        aj.status,
        aj.created_at,
        aj.completed_at,
        aj.pages_found,
        aj.pages_crawled,
        aj.pages_audited,
        aj.seo_score,
        aj.accessibility_score,
        aj.security_score,
        aj.performance_score,
        aj.content_score,
        aj.cqs_score,
        aj.total_issues,
        aj.critical_issues,
        aj.share_expires_at
       FROM audit_jobs aj
       WHERE aj.share_token = $1
         AND aj.share_expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Report not found or link has expired' });
      return;
    }

    const audit = result.rows[0];

    // Get findings summary by severity (unique issues only)
    const findingsSummary = await pool.query(
      `SELECT severity, COUNT(DISTINCT rule_id) as count
       FROM audit_findings
       WHERE audit_job_id = $1 AND status != 'dismissed'
       GROUP BY severity
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 0
           WHEN 'serious' THEN 1
           WHEN 'moderate' THEN 2
           WHEN 'minor' THEN 3
           WHEN 'info' THEN 4
         END`,
      [audit.id]
    );

    // Get findings summary by category (unique issues only)
    const categorySummary = await pool.query(
      `SELECT category, COUNT(DISTINCT rule_id) as count
       FROM audit_findings
       WHERE audit_job_id = $1 AND status != 'dismissed'
       GROUP BY category`,
      [audit.id]
    );

    res.json({
      audit: {
        targetUrl: audit.target_url,
        targetDomain: audit.target_domain,
        status: audit.status,
        createdAt: audit.created_at,
        completedAt: audit.completed_at,
        pagesFound: audit.pages_found,
        pagesCrawled: audit.pages_crawled,
        pagesAudited: audit.pages_audited,
        scores: {
          seo: audit.seo_score,
          accessibility: audit.accessibility_score,
          security: audit.security_score,
          performance: audit.performance_score,
          content: audit.content_score,
          cqs: audit.cqs_score,
        },
        totalIssues: audit.total_issues,
        criticalIssues: audit.critical_issues,
      },
      findingsSummary: findingsSummary.rows.reduce((acc: Record<string, number>, row) => {
        acc[row.severity] = parseInt(row.count, 10);
        return acc;
      }, {}),
      categorySummary: categorySummary.rows.reduce((acc: Record<string, number>, row) => {
        acc[row.category] = parseInt(row.count, 10);
        return acc;
      }, {}),
      expiresAt: audit.share_expires_at,
    });
  } catch (error) {
    console.error('Public report error:', error);
    res.status(500).json({ error: 'Failed to load report' });
  }
});

export { router as publicReportsRouter };
