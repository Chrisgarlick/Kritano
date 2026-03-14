import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateApiKey, requireScope, type ApiAuthenticatedRequest } from '../../middleware/apiAuth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { RATE_LIMIT_TIERS } from '../../services/apiKey.service.js';
import type { AuditJob } from '../../types/audit.types.js';
import type { AuditFinding } from '../../types/finding.types.js';

// Database pool - will be injected
let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

const router = Router();

// All v1 routes require API key authentication
router.use(authenticateApiKey);

// Validation schemas
const createAuditSchema = z.object({
  url: z.string().url('Invalid URL format'),
  options: z.object({
    maxPages: z.number().int().min(1).max(1000).optional(),
    maxDepth: z.number().int().min(1).max(10).optional(),
    checks: z.array(z.enum(['seo', 'accessibility', 'security', 'performance', 'content', 'file-extraction'])).optional(),
    respectRobotsTxt: z.boolean().optional(),
    includeSubdomains: z.boolean().optional(),
  }).optional(),
});

// ===========================================
// Audits Endpoints
// ===========================================

/**
 * POST /api/v1/audits
 * Create a new audit
 */
router.post(
  '/audits',
  requireScope('audits:write'),
  validateBody(createAuditSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const input = req.body as z.infer<typeof createAuditSchema>;

      // Parse and validate URL
      let targetUrl: URL;
      try {
        targetUrl = new URL(input.url);
        if (process.env.NODE_ENV === 'production' && targetUrl.protocol !== 'https:') {
          targetUrl.protocol = 'https:';
        }
      } catch {
        res.status(400).json({
          error: 'Invalid URL format',
          code: 'INVALID_URL',
        });
        return;
      }

      const targetDomain = targetUrl.hostname.replace(/^www\./, '');

      // Check concurrent audit limit based on tier
      const tier = apiReq.apiKey.rate_limit_tier;
      const limits = RATE_LIMIT_TIERS[tier];

      const activeAudits = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')`,
        [userId]
      );

      if (parseInt(activeAudits.rows[0].count, 10) >= limits.concurrentAudits) {
        res.status(429).json({
          error: 'Concurrent audit limit reached',
          code: 'AUDIT_LIMIT_REACHED',
          limit: limits.concurrentAudits,
          message: `Your plan allows ${limits.concurrentAudits} concurrent audits. Wait for existing audits to complete.`,
        });
        return;
      }

      // Determine which checks to run
      const options = input.options || {};
      const checks = options.checks || ['seo', 'accessibility', 'security', 'performance', 'content'];

      // Create audit job
      const result = await pool.query<AuditJob>(`
        INSERT INTO audit_jobs (
          user_id, target_url, target_domain,
          max_pages, max_depth, respect_robots_txt, include_subdomains,
          check_seo, check_accessibility, check_security, check_performance, check_content,
          check_file_extraction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        userId,
        targetUrl.toString(),
        targetDomain,
        options.maxPages ?? 100,
        options.maxDepth ?? 5,
        options.respectRobotsTxt ?? true,
        options.includeSubdomains ?? false,
        checks.includes('seo'),
        checks.includes('accessibility'),
        checks.includes('security'),
        checks.includes('performance'),
        checks.includes('content'),
        checks.includes('file-extraction'),
      ]);

      const audit = result.rows[0];

      res.status(201).json({
        id: audit.id,
        url: audit.target_url,
        domain: audit.target_domain,
        status: audit.status,
        createdAt: audit.created_at,
        _links: {
          self: `/api/v1/audits/${audit.id}`,
          findings: `/api/v1/audits/${audit.id}/findings`,
          pages: `/api/v1/audits/${audit.id}/pages`,
        },
      });
    } catch (error) {
      console.error('API: Create audit error:', error);
      res.status(500).json({
        error: 'Failed to create audit',
        code: 'CREATE_AUDIT_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/audits
 * List audits
 */
router.get(
  '/audits',
  requireScope('audits:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const { status, domain, page = '1', limit = '20' } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      let query = `
        SELECT id, target_url, target_domain, status,
               pages_found, pages_crawled, pages_audited,
               total_issues, critical_issues,
               seo_score, accessibility_score, security_score, performance_score,
               started_at, completed_at, created_at
        FROM audit_jobs
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      if (domain) {
        params.push(domain);
        query += ` AND target_domain = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1`;
      const countParams: any[] = [userId];
      if (status) {
        countParams.push(status);
        countQuery += ` AND status = $${countParams.length}`;
      }
      if (domain) {
        countParams.push(domain);
        countQuery += ` AND target_domain = $${countParams.length}`;
      }

      const countResult = await pool.query<{ count: string }>(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      res.json({
        audits: result.rows.map((audit) => ({
          id: audit.id,
          url: audit.target_url,
          domain: audit.target_domain,
          status: audit.status,
          progress: {
            pagesFound: audit.pages_found,
            pagesCrawled: audit.pages_crawled,
            pagesAudited: audit.pages_audited,
          },
          issues: {
            total: audit.total_issues,
            critical: audit.critical_issues,
          },
          scores: {
            seo: audit.seo_score,
            accessibility: audit.accessibility_score,
            security: audit.security_score,
            performance: audit.performance_score,
          },
          startedAt: audit.started_at,
          completedAt: audit.completed_at,
          createdAt: audit.created_at,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('API: List audits error:', error);
      res.status(500).json({
        error: 'Failed to list audits',
        code: 'LIST_AUDITS_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/audits/:id
 * Get audit details
 */
router.get(
  '/audits/:id',
  requireScope('audits:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const auditId = req.params.id;

      const result = await pool.query<AuditJob>(
        `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
        [auditId, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Audit not found',
          code: 'AUDIT_NOT_FOUND',
        });
        return;
      }

      const audit = result.rows[0];

      res.json({
        id: audit.id,
        url: audit.target_url,
        domain: audit.target_domain,
        status: audit.status,
        progress: {
          pagesFound: audit.pages_found,
          pagesCrawled: audit.pages_crawled,
          pagesAudited: audit.pages_audited,
          currentUrl: audit.current_url,
        },
        issues: {
          total: audit.total_issues,
          critical: audit.critical_issues,
        },
        scores: {
          seo: audit.seo_score,
          accessibility: audit.accessibility_score,
          security: audit.security_score,
          performance: audit.performance_score,
        },
        config: {
          maxPages: audit.max_pages,
          maxDepth: audit.max_depth,
          respectRobotsTxt: audit.respect_robots_txt,
          includeSubdomains: audit.include_subdomains,
          checks: {
            seo: audit.check_seo,
            accessibility: audit.check_accessibility,
            security: audit.check_security,
            performance: audit.check_performance,
          },
        },
        startedAt: audit.started_at,
        completedAt: audit.completed_at,
        createdAt: audit.created_at,
        _links: {
          self: `/api/v1/audits/${audit.id}`,
          findings: `/api/v1/audits/${audit.id}/findings`,
          pages: `/api/v1/audits/${audit.id}/pages`,
        },
      });
    } catch (error) {
      console.error('API: Get audit error:', error);
      res.status(500).json({
        error: 'Failed to get audit',
        code: 'GET_AUDIT_FAILED',
      });
    }
  }
);

/**
 * GET /api/v1/audits/:id/findings
 * Get audit findings
 */
router.get(
  '/audits/:id/findings',
  requireScope('findings:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const auditId = req.params.id;
      const { category, severity, page = '1', limit = '50' } = req.query;

      // Verify ownership
      const auditCheck = await pool.query(
        `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
        [auditId, userId]
      );

      if (auditCheck.rows.length === 0) {
        res.status(404).json({
          error: 'Audit not found',
          code: 'AUDIT_NOT_FOUND',
        });
        return;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      let query = `
        SELECT f.*, p.url as page_url
        FROM audit_findings f
        LEFT JOIN audit_pages p ON f.audit_page_id = p.id
        WHERE f.audit_job_id = $1
      `;
      const params: any[] = [auditId];

      if (category) {
        params.push(category);
        query += ` AND f.category = $${params.length}`;
      }

      if (severity) {
        params.push(severity);
        query += ` AND f.severity = $${params.length}`;
      }

      query += `
        ORDER BY
          CASE f.severity
            WHEN 'critical' THEN 1
            WHEN 'serious' THEN 2
            WHEN 'moderate' THEN 3
            WHEN 'minor' THEN 4
            ELSE 5
          END,
          f.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(limitNum, offset);

      const result = await pool.query<AuditFinding & { page_url: string }>(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM audit_findings WHERE audit_job_id = $1`;
      const countParams: any[] = [auditId];
      if (category) {
        countParams.push(category);
        countQuery += ` AND category = $${countParams.length}`;
      }
      if (severity) {
        countParams.push(severity);
        countQuery += ` AND severity = $${countParams.length}`;
      }

      const countResult = await pool.query<{ count: string }>(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      res.json({
        findings: result.rows.map((f) => ({
          id: f.id,
          category: f.category,
          severity: f.severity,
          ruleId: f.rule_id,
          ruleName: f.rule_name,
          message: f.message,
          description: f.description,
          recommendation: f.recommendation,
          pageUrl: f.page_url,
          selector: f.selector,
          snippet: f.snippet,
          wcagCriteria: f.wcag_criteria,
          helpUrl: f.help_url,
          status: f.status,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('API: Get findings error:', error);
      res.status(500).json({
        error: 'Failed to get findings',
        code: 'GET_FINDINGS_FAILED',
      });
    }
  }
);

/**
 * POST /api/v1/audits/:id/cancel
 * Cancel an audit
 */
router.post(
  '/audits/:id/cancel',
  requireScope('audits:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const auditId = req.params.id;

      const result = await pool.query<AuditJob>(`
        UPDATE audit_jobs
        SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'discovering', 'ready', 'processing')
        RETURNING *
      `, [auditId, userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Audit not found or cannot be cancelled',
          code: 'CANCEL_FAILED',
        });
        return;
      }

      res.json({
        message: 'Audit cancelled',
        status: 'cancelled',
      });
    } catch (error) {
      console.error('API: Cancel audit error:', error);
      res.status(500).json({
        error: 'Failed to cancel audit',
        code: 'CANCEL_FAILED',
      });
    }
  }
);

/**
 * DELETE /api/v1/audits/:id
 * Delete an audit
 */
router.delete(
  '/audits/:id',
  requireScope('audits:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiReq = req as ApiAuthenticatedRequest;
      const userId = apiReq.apiUserId;
      const auditId = req.params.id;

      const result = await pool.query(`
        DELETE FROM audit_jobs
        WHERE id = $1 AND user_id = $2 AND status IN ('completed', 'failed', 'cancelled')
        RETURNING id
      `, [auditId, userId]);

      if (result.rowCount === 0) {
        res.status(404).json({
          error: 'Audit not found or cannot be deleted',
          code: 'DELETE_FAILED',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('API: Delete audit error:', error);
      res.status(500).json({
        error: 'Failed to delete audit',
        code: 'DELETE_FAILED',
      });
    }
  }
);

// ===========================================
// Info Endpoint
// ===========================================

/**
 * GET /api/v1/info
 * Get API information and current user's limits
 */
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  const apiReq = req as ApiAuthenticatedRequest;
  const tier = apiReq.apiKey.rate_limit_tier;
  const limits = RATE_LIMIT_TIERS[tier];

  res.json({
    version: '1.0.0',
    tier,
    limits: {
      requestsPerMinute: limits.requestsPerMinute,
      requestsPerDay: limits.requestsPerDay === -1 ? 'unlimited' : limits.requestsPerDay,
      concurrentAudits: limits.concurrentAudits,
    },
    scopes: apiReq.apiKey.scopes,
    documentation: '/docs',
  });
});

export const v1Router = router;
