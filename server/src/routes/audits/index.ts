import { Router } from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateUrlForSsrf } from '../../utils/ip.utils.js';
import { auditService } from '../../services/audit.service.js';
import type { AuditJob } from '../../types/audit.types.js';
import type { AuditFinding } from '../../types/finding.types.js';

// Validation schemas
const startAuditSchema = z.object({
  targetUrl: z.string().url('Invalid URL format'),
  options: z.object({
    maxPages: z.number().int().min(1).max(1000).optional(),
    maxDepth: z.number().int().min(1).max(10).optional(),
    respectRobotsTxt: z.boolean().optional(),
    includeSubdomains: z.boolean().optional(),
    checkSeo: z.boolean().optional(),
    checkAccessibility: z.boolean().optional(),
    checkSecurity: z.boolean().optional(),
    checkPerformance: z.boolean().optional(),
    checkContent: z.boolean().optional(),
    checkStructuredData: z.boolean().optional(),
    wcagVersion: z.enum(['2.1', '2.2']).optional(),
    wcagLevel: z.enum(['A', 'AA', 'AAA']).optional(),
    targetKeyword: z.string().optional(),
  }).optional(),
});

type StartAuditInput = z.infer<typeof startAuditSchema>;

// Database pool - will be injected
let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

const router = Router();

/**
 * POST /api/audits
 * Start a new audit
 */
router.post(
  '/',
  authenticate,
  validateBody(startAuditSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as StartAuditInput;
      const userId = req.user!.id;

      // Parse and validate URL
      let targetUrl: URL;
      try {
        targetUrl = new URL(input.targetUrl);
        if (process.env.NODE_ENV === 'production' && targetUrl.protocol !== 'https:') {
          targetUrl.protocol = 'https:';
        }
      } catch {
        res.status(400).json({ error: 'Invalid URL format', code: 'INVALID_URL' });
        return;
      }

      const targetDomain = targetUrl.hostname.replace(/^www\./, '');

      // SSRF check
      const ssrfError = validateUrlForSsrf(targetUrl.toString());
      if (ssrfError) {
        res.status(400).json({ error: ssrfError, code: 'SSRF_BLOCKED' });
        return;
      }

      // Check concurrent audit limit
      const activeAudits = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'processing')`,
        [userId]
      );
      if (parseInt(activeAudits.rows[0].count, 10) >= 3) {
        res.status(429).json({ error: 'Too many active audits. Please wait for current audits to finish.', code: 'AUDIT_LIMIT_REACHED' });
        return;
      }

      const options = input.options || {};

      // Create audit job
      const result = await pool.query<AuditJob>(`
        INSERT INTO audit_jobs (
          user_id, target_url, target_domain,
          max_pages, max_depth, respect_robots_txt, include_subdomains,
          check_seo, check_accessibility, check_security, check_performance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        userId,
        targetUrl.toString(),
        targetDomain,
        options.maxPages || 100,
        options.maxDepth || 5,
        options.respectRobotsTxt !== false,
        options.includeSubdomains || false,
        options.checkSeo !== false,
        options.checkAccessibility !== false,
        options.checkSecurity !== false,
        options.checkPerformance !== false,
      ]);

      // Log audit creation
      await auditService.logAuditCreated(
        userId, result.rows[0].id, targetUrl.toString(),
        req.ip, req.get('user-agent')
      );

      res.status(201).json({ audit: result.rows[0] });
    } catch (error) {
      console.error('Start audit error:', error);
      res.status(500).json({ error: 'Failed to start audit', code: 'START_AUDIT_FAILED' });
    }
  }
);

/**
 * GET /api/audits
 * List audits for current user
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, limit = '20', offset = '0' } = req.query;

    let query = `
      SELECT id, target_url, target_domain, status,
             pages_found, pages_crawled, pages_audited,
             total_issues, critical_issues,
             seo_score, accessibility_score, security_score, performance_score,
             started_at, completed_at, created_at
      FROM audit_jobs
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1`;
    const countParams: unknown[] = [userId];
    if (status) {
      countParams.push(status);
      countQuery += ` AND status = $${countParams.length}`;
    }
    const countResult = await pool.query<{ count: string }>(countQuery, countParams);

    res.json({
      audits: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('List audits error:', error);
    res.status(500).json({ error: 'Failed to list audits', code: 'LIST_AUDITS_FAILED' });
  }
});

/**
 * GET /api/audits/:id
 * Get audit details
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const auditResult = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    // Get findings summary
    const findingsResult = await pool.query<{ category: string; severity: string; count: string }>(`
      SELECT category, severity, COUNT(*) as count
      FROM audit_findings WHERE audit_job_id = $1
      GROUP BY category, severity
    `, [auditId]);

    const findingsSummary = { total: 0, bySeverity: {} as Record<string, number>, byCategory: {} as Record<string, number> };
    for (const row of findingsResult.rows) {
      const count = parseInt(row.count, 10);
      findingsSummary.total += count;
      findingsSummary.bySeverity[row.severity] = (findingsSummary.bySeverity[row.severity] || 0) + count;
      findingsSummary.byCategory[row.category] = (findingsSummary.byCategory[row.category] || 0) + count;
    }

    // Get pages summary
    const pagesResult = await pool.query<{ crawl_status: string; count: string }>(`
      SELECT crawl_status, COUNT(*) as count FROM audit_pages WHERE audit_job_id = $1 GROUP BY crawl_status
    `, [auditId]);

    const pagesSummary = { total: 0, byStatus: {} as Record<string, number> };
    for (const row of pagesResult.rows) {
      const count = parseInt(row.count, 10);
      pagesSummary.total += count;
      pagesSummary.byStatus[row.crawl_status] = count;
    }

    res.json({ audit: auditResult.rows[0], findings: findingsSummary, pages: pagesSummary });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({ error: 'Failed to get audit', code: 'GET_AUDIT_FAILED' });
  }
});

/**
 * GET /api/audits/:id/findings
 * Get audit findings with pagination and filtering
 */
router.get('/:id/findings', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const { category, severity, page = '1', limit = '50' } = req.query;

    const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]);
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    let query = `
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
    `;
    const params: any[] = [auditId];

    if (category) { params.push(category); query += ` AND f.category = $${params.length}`; }
    if (severity) { params.push(severity); query += ` AND f.severity = $${params.length}`; }

    query += ` ORDER BY CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END, f.created_at DESC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query<AuditFinding & { page_url: string }>(query, params);

    let countQuery = `SELECT COUNT(*) as count FROM audit_findings WHERE audit_job_id = $1`;
    const countParams: any[] = [auditId];
    if (category) { countParams.push(category); countQuery += ` AND category = $${countParams.length}`; }
    if (severity) { countParams.push(severity); countQuery += ` AND severity = $${countParams.length}`; }
    const countResult = await pool.query<{ count: string }>(countQuery, countParams);

    res.json({
      findings: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].count, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limitNum),
      },
    });
  } catch (error) {
    console.error('Get findings error:', error);
    res.status(500).json({ error: 'Failed to get findings', code: 'GET_FINDINGS_FAILED' });
  }
});

/**
 * GET /api/audits/:id/pages
 * Get audit pages with pagination
 */
router.get('/:id/pages', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const { status, page = '1', limit = '50' } = req.query;

    const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]);
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    let query = `
      SELECT id, url, depth, status_code, content_type, response_time_ms, page_size_bytes,
             title, meta_description, canonical_url, h1_text, word_count,
             crawl_status, error_message, error_type, error_category, error_suggestion, retry_count,
             seo_score, accessibility_score, security_score, performance_score,
             seo_issues, accessibility_issues, security_issues, performance_issues,
             crawled_at, created_at
      FROM audit_pages WHERE audit_job_id = $1
    `;
    const params: any[] = [auditId];

    if (status) { params.push(status); query += ` AND crawl_status = $${params.length}`; }
    query += ` ORDER BY depth ASC, created_at ASC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as count FROM audit_pages WHERE audit_job_id = $1`;
    const countParams: any[] = [auditId];
    if (status) { countParams.push(status); countQuery += ` AND crawl_status = $${countParams.length}`; }
    const countResult = await pool.query<{ count: string }>(countQuery, countParams);

    res.json({
      pages: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].count, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limitNum),
      },
    });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Failed to get pages', code: 'GET_PAGES_FAILED' });
  }
});

/**
 * GET /api/audits/:id/pages/:pageId
 * Get a single page with full details and findings
 */
router.get('/:id/pages/:pageId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const pageId = req.params.pageId;

    const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]);
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const pageResult = await pool.query(`SELECT * FROM audit_pages WHERE id = $1 AND audit_job_id = $2`, [pageId, auditId]);
    if (pageResult.rows.length === 0) {
      res.status(404).json({ error: 'Page not found', code: 'PAGE_NOT_FOUND' });
      return;
    }

    const findingsResult = await pool.query<AuditFinding>(`
      SELECT id, category, rule_id, rule_name, severity, message, description,
             recommendation, selector, snippet, impact, wcag_criteria, help_url, created_at
      FROM audit_findings WHERE audit_page_id = $1
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 WHEN 'info' THEN 5 END, category
    `, [pageId]);

    const findingsByCategory: Record<string, AuditFinding[]> = {};
    for (const finding of findingsResult.rows) {
      if (!findingsByCategory[finding.category]) findingsByCategory[finding.category] = [];
      findingsByCategory[finding.category].push(finding);
    }

    res.json({
      page: pageResult.rows[0],
      findings: findingsResult.rows,
      findingsByCategory,
      summary: {
        total: findingsResult.rows.length,
        bySeverity: findingsResult.rows.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {} as Record<string, number>),
        byCategory: findingsResult.rows.reduce((acc, f) => { acc[f.category] = (acc[f.category] || 0) + 1; return acc; }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Failed to get page', code: 'GET_PAGE_FAILED' });
  }
});

/**
 * GET /api/audits/:id/stream
 * Server-Sent Events for real-time audit progress
 */
router.get('/:id/stream', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const auditCheck = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]
    );
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendProgress = async (): Promise<string> => {
      const result = await pool.query(
        `SELECT status, pages_found, pages_crawled, pages_audited, current_url,
                total_issues, critical_issues,
                seo_score, accessibility_score, security_score, performance_score,
                activity_log, created_at
         FROM audit_jobs WHERE id = $1`, [auditId]
      );

      if (result.rows.length === 0) return 'cancelled';
      const progress = result.rows[0];

      let queuePosition: number | null = null;
      let estimatedWaitSeconds: number | null = null;

      if (progress.status === 'pending') {
        const posResult = await pool.query(
          `SELECT COUNT(*) as position FROM audit_jobs WHERE status = 'pending' AND created_at < $1`,
          [progress.created_at]
        );
        queuePosition = parseInt(posResult.rows[0].position, 10) + 1;
        estimatedWaitSeconds = queuePosition * 120;
      }

      const message = {
        type: 'progress',
        data: {
          status: progress.status,
          pagesFound: progress.pages_found,
          pagesCrawled: progress.pages_crawled,
          pagesAudited: progress.pages_audited,
          currentUrl: progress.current_url,
          totalIssues: progress.total_issues,
          criticalIssues: progress.critical_issues,
          seoScore: progress.seo_score,
          accessibilityScore: progress.accessibility_score,
          securityScore: progress.security_score,
          performanceScore: progress.performance_score,
          activityLog: progress.activity_log || [],
          queuePosition,
          estimatedWaitSeconds,
        },
      };

      res.write(`data: ${JSON.stringify(message)}\n\n`);
      return progress.status;
    };

    let status = await sendProgress();

    const interval = setInterval(async () => {
      try {
        status = await sendProgress();
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({ type: status, data: {} })}\n\n`);
          res.end();
        }
      } catch {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => { clearInterval(interval); });
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to start stream', code: 'STREAM_FAILED' });
  }
});

/**
 * PATCH /api/audits/:id/findings/:findingId/dismiss
 */
router.patch('/:id/findings/:findingId/dismiss', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const findingId = req.params.findingId;
    const { status } = req.body as { status: 'dismissed' | 'active' };

    if (!['dismissed', 'active'].includes(status)) {
      res.status(400).json({ error: 'Status must be "dismissed" or "active"', code: 'INVALID_STATUS' });
      return;
    }

    const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]);
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `UPDATE audit_findings SET status = $1 WHERE id = $2 AND audit_job_id = $3 RETURNING id, status, rule_id, message`,
      [status, findingId, auditId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Finding not found', code: 'FINDING_NOT_FOUND' });
      return;
    }

    res.json({ finding: result.rows[0] });
  } catch (error) {
    console.error('Dismiss finding error:', error);
    res.status(500).json({ error: 'Failed to update finding', code: 'DISMISS_FAILED' });
  }
});

/**
 * PATCH /api/audits/:id/findings/bulk-dismiss
 */
router.patch('/:id/findings/bulk-dismiss', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const { ruleId, message, status } = req.body as { ruleId: string; message: string; status: 'dismissed' | 'active' };

    const auditCheck = await pool.query(`SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`, [auditId, userId]);
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `UPDATE audit_findings SET status = $1 WHERE audit_job_id = $2 AND rule_id = $3 AND message = $4 RETURNING id`,
      [status || 'dismissed', auditId, ruleId, message]
    );

    res.json({ updated: result.rowCount });
  } catch (error) {
    console.error('Bulk dismiss error:', error);
    res.status(500).json({ error: 'Failed to bulk dismiss', code: 'BULK_DISMISS_FAILED' });
  }
});

/**
 * POST /api/audits/:id/rerun
 */
router.post('/:id/rerun', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const original = await pool.query<AuditJob>(
      `SELECT target_url, target_domain, max_pages, max_depth, respect_robots_txt, include_subdomains,
              check_seo, check_accessibility, check_security, check_performance
       FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (original.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const activeAudits = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'processing')`,
      [userId]
    );
    if (parseInt(activeAudits.rows[0].count, 10) >= 3) {
      res.status(429).json({ error: 'Too many active audits', code: 'AUDIT_LIMIT_REACHED' });
      return;
    }

    const orig = original.rows[0];
    const result = await pool.query<AuditJob>(`
      INSERT INTO audit_jobs (
        user_id, target_url, target_domain,
        max_pages, max_depth, respect_robots_txt, include_subdomains,
        check_seo, check_accessibility, check_security, check_performance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      userId, orig.target_url, orig.target_domain,
      orig.max_pages, orig.max_depth, orig.respect_robots_txt, orig.include_subdomains,
      orig.check_seo, orig.check_accessibility, orig.check_security, orig.check_performance,
    ]);

    res.status(201).json({ audit: result.rows[0] });
  } catch (error) {
    console.error('Re-run audit error:', error);
    res.status(500).json({ error: 'Failed to re-run audit', code: 'RERUN_FAILED' });
  }
});

/**
 * POST /api/audits/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const result = await pool.query<AuditJob>(`
      UPDATE audit_jobs SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'processing')
      RETURNING *
    `, [auditId, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found or cannot be cancelled', code: 'CANCEL_FAILED' });
      return;
    }

    res.json({ message: 'Audit cancelled', audit: result.rows[0] });
  } catch (error) {
    console.error('Cancel audit error:', error);
    res.status(500).json({ error: 'Failed to cancel audit', code: 'CANCEL_FAILED' });
  }
});

/**
 * DELETE /api/audits/:id
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const result = await pool.query(`
      DELETE FROM audit_jobs WHERE id = $1 AND user_id = $2 AND status IN ('completed', 'failed', 'cancelled')
      RETURNING id
    `, [auditId, userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Audit not found or cannot be deleted', code: 'DELETE_FAILED' });
      return;
    }

    res.json({ message: 'Audit deleted' });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ error: 'Failed to delete audit', code: 'DELETE_FAILED' });
  }
});

export const auditsRouter = router;
export { router };
