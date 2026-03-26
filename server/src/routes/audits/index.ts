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
import {
  findOrCreateSiteForDomain,
  findOrCreateUrl,
  getUserTierLimits,
  getSiteOwnerTierLimits,
  isSiteVerified,
} from '../../services/site.service.js';
import { getSiteWithAccess } from '../../middleware/site.middleware.js';
import {
  logAuditConsent,
  getUserConsentPreference,
} from '../../services/consent.service.js';
import {
  UNVERIFIED_DOMAIN_LIMITS,
  getConsentTextHash,
  CONSENT_VERSION,
} from '../../constants/consent.constants.js';
import { generateSchemaForPage, generateSchemaForSite } from '../../services/schema-generator.service.js';
import { resolveFixSnippet } from '../../data/fix-templates.js';
import { resolvePdfBranding } from '../../services/pdf-branding.service.js';
import type { ResolvedBranding } from '../../services/pdf-branding.service.js';
import { generateAuditPdf, buildReportHtml, buildReportMarkdown } from '../../services/pdf-report.service.js';
import type { ResolvedFixSnippetForPdf, ComplianceDataForPdf } from '../../services/pdf-report.service.js';
import { enMapping, buildWcagToEnMap } from '../../data/en-301-549-mapping.js';
import { getCqsImpact } from '../../data/cqs-impact-map.js';

// Validation schemas
const startAuditSchema = z.object({
  targetUrl: z.string().url('Invalid URL format'),
  siteId: z.string().uuid().optional(), // Link audit to a site (auto-created if not provided)
  urlId: z.string().uuid().optional(), // Link audit to a URL (auto-created if not provided)
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
    checkFileExtraction: z.boolean().optional(),
    wcagVersion: z.enum(['2.1', '2.2']).optional(),
    wcagLevel: z.enum(['A', 'AA', 'AAA']).optional(),
    targetKeyword: z.string().optional(), // For content analysis keyword optimization
  }).optional(),
  // Consent data for unverified domain scanning
  consent: z.object({
    accepted: z.boolean(),
    dontShowAgain: z.boolean().optional(),
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
 * Start a new audit (user-centric, auto-creates site and URL)
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
        // Ensure HTTPS for security (allow HTTP in development)
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

      // ========================================
      // AUTO-CREATE SITE AND URL (moved before tier resolution)
      // ========================================
      let siteId = input.siteId || null;
      let urlId = input.urlId || null;

      // Auto-create or find site
      const site = await findOrCreateSiteForDomain(userId, targetDomain);
      siteId = site.id;

      // ========================================
      // PERMISSION CHECK — shared users need editor+ to run audits
      // ========================================
      const siteOwnerId = site.owner_id || (site as any).created_by;
      if (siteOwnerId !== userId) {
        const access = await getSiteWithAccess(siteId, userId);
        if (!access || !['owner', 'admin', 'editor'].includes(access.permission)) {
          res.status(403).json({
            error: 'You need editor or higher permissions to run audits on this site.',
            code: 'INSUFFICIENT_PERMISSION',
          });
          return;
        }
      }

      // ========================================
      // TIER LIMITS — use site owner's tier for feature gating
      // ========================================
      const tierLimits = await getSiteOwnerTierLimits(siteId);

      // Concurrent audit limit stays user-based (prevents shared users from monopolizing queue)
      const userTierLimits = await getUserTierLimits(userId);
      const maxConcurrentAudits = (userTierLimits?.concurrent_audits as number) || 3;

      // Page/depth limits come from site owner's tier
      const maxPagesLimit = (tierLimits?.max_pages_per_audit as number) || 1000;
      const maxDepthLimit = (tierLimits?.max_audit_depth as number) || 10;

      // Check concurrent audit limit (user-based)
      const activeAudits = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')`,
        [userId]
      );

      if (parseInt(activeAudits.rows[0].count, 10) >= maxConcurrentAudits) {
        res.status(429).json({
          error: 'Too many active audits. Please wait for existing audits to complete.',
          code: 'CONCURRENT_LIMIT_REACHED',
          maxConcurrent: maxConcurrentAudits,
        });
        return;
      }

      // Apply tier limits to options
      const options = input.options || {};
      let maxPages = Math.min(options.maxPages ?? 100, maxPagesLimit);
      const maxDepth = Math.min(options.maxDepth ?? 5, maxDepthLimit);

      // Check if requested checks are available for this tier (site owner's)
      let checkSeo = options.checkSeo ?? true;
      let checkAccessibility = options.checkAccessibility ?? true;
      let checkSecurity = options.checkSecurity ?? true;
      let checkPerformance = options.checkPerformance ?? true;
      let checkContent = options.checkContent ?? true;
      let checkStructuredData = options.checkStructuredData ?? true;

      const availableChecks = tierLimits?.available_checks as string[] | undefined;
      if (availableChecks) {
        checkSeo = checkSeo && availableChecks.includes('seo');
        checkAccessibility = checkAccessibility && availableChecks.includes('accessibility');
        checkSecurity = checkSecurity && availableChecks.includes('security');
        checkPerformance = checkPerformance && availableChecks.includes('performance');
        checkContent = checkContent && availableChecks.includes('content');
        // Always run structured data engine — it's lightweight HTML parsing
        // and the Schema tab should show data for all users
      }

      // File extraction is opt-in and gated to starter+
      let checkFileExtraction = (options.checkFileExtraction ?? false) && (availableChecks ? availableChecks.includes('file-extraction') : false);

      // Auto-create or find URL
      const siteUrl = await findOrCreateUrl(siteId, targetUrl.toString(), 'audit');
      urlId = siteUrl.id;

      // ========================================
      // VERIFICATION & CONSENT CHECK
      // ========================================
      let isVerifiedDomain = site.verified;
      let unverifiedMode = false;

      // If site is not verified, require consent and enforce limits
      if (!isVerifiedDomain) {
        // Check if multi-URL audit requested (requires verification)
        if ((options.maxPages && options.maxPages > 1) || options.includeSubdomains) {
          const { consent } = input;

          if (!consent || !consent.accepted) {
            res.status(400).json({
              error: 'Consent required for unverified domain',
              code: 'CONSENT_REQUIRED',
              requiresConsent: true,
              domain: targetDomain,
              siteId: site.id,
              isVerified: false,
              scanLimits: {
                maxPages: UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES,
                minDelayMs: UNVERIFIED_DOMAIN_LIMITS.MIN_DELAY_MS,
                robotsTxtRequired: UNVERIFIED_DOMAIN_LIMITS.RESPECT_ROBOTS_TXT,
                sequential: UNVERIFIED_DOMAIN_LIMITS.CONCURRENT_PAGES === 1,
              },
            });
            return;
          }
        }

        // Enforce unverified domain limits
        unverifiedMode = true;
        maxPages = Math.min(maxPages, UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES);
        options.respectRobotsTxt = true; // Force robots.txt respect
      }

      // Create audit job
      const result = await pool.query<AuditJob>(`
        INSERT INTO audit_jobs (
          user_id, site_id, url_id, target_url, target_domain,
          max_pages, max_depth, respect_robots_txt, include_subdomains,
          check_seo, check_accessibility, check_security, check_performance, check_content, check_structured_data,
          check_file_extraction,
          wcag_version, wcag_level, unverified_mode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        userId,
        siteId,
        urlId,
        targetUrl.toString(),
        targetDomain,
        maxPages,
        maxDepth,
        options.respectRobotsTxt ?? true,
        options.includeSubdomains ?? false,
        checkSeo,
        checkAccessibility,
        checkSecurity,
        checkPerformance,
        checkContent,
        checkStructuredData,
        checkFileExtraction,
        options.wcagVersion ?? '2.2',
        options.wcagLevel ?? 'AA',
        unverifiedMode,
      ]);

      const audit = result.rows[0];

      // Log consent for unverified domain scans
      if (unverifiedMode && input.consent?.accepted) {
        await logAuditConsent({
          auditJobId: audit.id,
          userId,
          targetUrl: targetUrl.toString(),
          targetDomain,
          isVerified: false,
          ipAddress: req.ip || '0.0.0.0',
          userAgent: req.get('user-agent'),
          dontShowAgain: input.consent.dontShowAgain,
          consentVersion: CONSENT_VERSION,
        });
      }

      // Log audit creation
      await auditService.logAuditCreated(
        userId,
        audit.id,
        audit.target_url,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        message: 'Audit queued successfully',
        audit: {
          id: audit.id,
          targetUrl: audit.target_url,
          targetDomain: audit.target_domain,
          status: audit.status,
          siteId: audit.site_id,
          urlId: audit.url_id,
          createdAt: audit.created_at,
        },
      });
    } catch (error) {
      console.error('Start audit error:', error);
      res.status(500).json({
        error: 'Failed to start audit',
        code: 'START_AUDIT_FAILED',
      });
    }
  }
);

/**
 * GET /api/audits
 * List user's audits (optionally filtered by site)
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const siteId = req.query.siteId as string | undefined;
    const { status, limit = '20', offset = '0' } = req.query;

    // Build query
    let query = `
      SELECT id, target_url, target_domain, status, site_id, url_id,
             pages_found, pages_crawled, pages_audited,
             total_issues, critical_issues,
             seo_score, accessibility_score, security_score, performance_score, content_score, structured_data_score, cqs_score,
             started_at, completed_at, created_at
      FROM audit_jobs
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];

    // Filter by site if provided
    if (siteId) {
      params.push(siteId);
      query += ` AND site_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1`;
    const countParams: unknown[] = [userId];

    if (siteId) {
      countParams.push(siteId);
      countQuery += ` AND site_id = $${countParams.length}`;
    }

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
    res.status(500).json({
      error: 'Failed to list audits',
      code: 'LIST_AUDITS_FAILED',
    });
  }
});

/**
 * GET /api/audits/check-url
 * Check if a URL is reachable (#44)
 * NOTE: Must be before /:id route to avoid being caught by wildcard
 */
router.get('/check-url', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL required', code: 'URL_REQUIRED' });
      return;
    }

    // SSRF protection: validate URL before making any requests
    const ssrfError = validateUrlForSsrf(url);
    if (ssrfError) {
      res.json({ reachable: false, error: ssrfError });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      res.json({ reachable: false, error: 'Invalid URL format' });
      return;
    }

    const checkWithMethod = async (method: 'HEAD' | 'GET'): Promise<{ ok: boolean; status: number; url: string }> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(parsedUrl.toString(), {
          method,
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'pagepulser/1.0 (URL Check)',
          },
        });
        clearTimeout(timeout);
        return { ok: response.ok, status: response.status, url: response.url };
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    };

    try {
      // Try HEAD first (faster, less bandwidth)
      const result = await checkWithMethod('HEAD');
      res.json({ reachable: result.ok, status: result.status, finalUrl: result.url });
    } catch {
      // HEAD failed, try GET as fallback (some servers reject HEAD)
      try {
        const result = await checkWithMethod('GET');
        res.json({ reachable: result.ok, status: result.status, finalUrl: result.url });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        res.json({ reachable: false, error: errorMessage.includes('abort') ? 'Connection timed out' : errorMessage });
      }
    }
  } catch (error) {
    console.error('Check URL error:', error);
    res.status(500).json({ error: 'Failed to check URL', code: 'CHECK_URL_FAILED' });
  }
});

/**
 * GET /api/audits/recent-urls
 * Get user's recent audit URLs for autocomplete (#45)
 * NOTE: Must be before /:id route to avoid being caught by wildcard
 */
router.get('/recent-urls', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await pool.query<{ target_url: string; target_domain: string }>(
      `SELECT target_url, target_domain FROM (
         SELECT DISTINCT ON (target_url) target_url, target_domain, created_at
         FROM audit_jobs WHERE user_id = $1
         ORDER BY target_url, created_at DESC
       ) sub ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    res.json({ urls: result.rows });
  } catch (error) {
    console.error('Recent URLs error:', error);
    res.status(500).json({ error: 'Failed to get recent URLs', code: 'RECENT_URLS_FAILED' });
  }
});

/**
 * GET /api/audits/domain-status
 * Check if a domain is verified and get scan limits
 * Used by frontend to determine if consent modal should be shown
 * NOTE: Must be before /:id route to avoid being caught by wildcard
 */
router.get('/domain-status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL required', code: 'URL_REQUIRED' });
      return;
    }

    // Parse URL to get domain
    let targetDomain: string;
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      targetDomain = parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      res.status(400).json({ error: 'Invalid URL format', code: 'INVALID_URL' });
      return;
    }

    // Check if user has a verified site for this domain
    const siteResult = await pool.query<{ id: string; verified: boolean }>(
      `SELECT id, verified FROM sites WHERE owner_id = $1 AND domain = $2
       UNION
       SELECT s.id, s.verified FROM sites s
       JOIN site_shares ss ON ss.site_id = s.id
       WHERE ss.user_id = $1 AND s.domain = $2 AND ss.accepted_at IS NOT NULL
       LIMIT 1`,
      [userId, targetDomain]
    );

    const site = siteResult.rows[0];
    const isVerified = site?.verified ?? false;

    // Get user's consent preference
    const userPreference = await getUserConsentPreference(userId);

    res.json({
      domain: targetDomain,
      siteId: site?.id || null,
      isVerified,
      requiresConsent: !isVerified,
      userSkipsWarning: userPreference.skipUnverifiedDomainWarning,
      scanLimits: isVerified ? null : {
        maxPages: UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES,
        minDelayMs: UNVERIFIED_DOMAIN_LIMITS.MIN_DELAY_MS,
        robotsTxtRequired: UNVERIFIED_DOMAIN_LIMITS.RESPECT_ROBOTS_TXT,
        sequential: UNVERIFIED_DOMAIN_LIMITS.CONCURRENT_PAGES === 1,
      },
    });
  } catch (error) {
    console.error('Domain status error:', error);
    res.status(500).json({ error: 'Failed to check domain status', code: 'DOMAIN_STATUS_FAILED' });
  }
});

/**
 * GET /api/audits/:id/schema-summary
 * Get structured data summary across all audited pages
 */
router.get('/:id/schema-summary', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    // Get structured data info from all pages
    const pagesResult = await pool.query(`
      SELECT id, url, title, meta_description, json_ld_count, has_open_graph, has_twitter_card,
             detected_schema_types, detected_page_type, structured_data_score,
             open_graph_data, twitter_card_data, json_ld_items
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled'
      ORDER BY depth ASC, created_at ASC
    `, [auditId]);

    const pages = pagesResult.rows;
    const totalPages = pages.length;
    let pagesWithSchema = 0;
    let pagesWithoutSchema = 0;
    let totalJsonLdCount = 0;
    let hasOpenGraph = false;
    let hasTwitterCard = false;
    const allDetectedTypes = new Set<string>();

    const pageBreakdown = pages.map((p: any) => {
      const pageHasSchema = (p.json_ld_count > 0) || p.has_open_graph || p.has_twitter_card
        || (p.detected_schema_types && p.detected_schema_types.length > 0)
        || (p.structured_data_score !== null && p.structured_data_score > 0);
      if (pageHasSchema) {
        pagesWithSchema++;
      } else {
        pagesWithoutSchema++;
      }

      totalJsonLdCount += p.json_ld_count || 0;
      if (p.has_open_graph) hasOpenGraph = true;
      if (p.has_twitter_card) hasTwitterCard = true;
      if (p.detected_schema_types) {
        for (const t of p.detected_schema_types) {
          allDetectedTypes.add(t);
        }
      }

      return {
        id: p.id,
        url: p.url,
        title: p.title,
        metaDescription: p.meta_description || null,
        jsonLdCount: p.json_ld_count || 0,
        hasOg: p.has_open_graph || false,
        hasTc: p.has_twitter_card || false,
        detectedTypes: p.detected_schema_types || [],
        detectedPageType: p.detected_page_type || null,
        ogData: p.open_graph_data || null,
        tcData: p.twitter_card_data || null,
        jsonLdItems: p.json_ld_items || null,
      };
    });

    res.json({
      hasStructuredData: pagesWithSchema > 0,
      jsonLdCount: totalJsonLdCount,
      hasOpenGraph,
      hasTwitterCard,
      detectedTypes: Array.from(allDetectedTypes),
      pagesWithSchema,
      pagesWithoutSchema,
      totalPages,
      pages: pageBreakdown,
    });
  } catch (error) {
    console.error('Schema summary error:', error);
    res.status(500).json({ error: 'Failed to get schema summary', code: 'SCHEMA_SUMMARY_FAILED' });
  }
});

/**
 * GET /api/audits/:id/index-exposure
 * Get Google Index Exposure (dorking) findings for an audit
 */
router.get('/:id/index-exposure', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id, status FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    // Query index exposure findings
    const findingsResult = await pool.query<{
      id: string;
      rule_id: string;
      rule_name: string;
      severity: string;
      message: string;
      description: string | null;
      recommendation: string | null;
      selector: string | null;
      snippet: string | null;
      help_url: string | null;
      created_at: Date;
    }>(`
      SELECT id, rule_id, rule_name, severity, message, description,
             recommendation, selector, snippet, help_url, created_at
      FROM audit_findings
      WHERE audit_job_id = $1 AND rule_id LIKE 'google-indexed-%'
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 0
          WHEN 'serious' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'minor' THEN 3
          WHEN 'info' THEN 4
        END ASC,
        created_at ASC
    `, [auditId]);

    const findings = findingsResult.rows;

    // Build summary
    const bySeverity = { critical: 0, serious: 0, moderate: 0, minor: 0, info: 0 };
    const byCategory: Record<string, number> = {};

    for (const f of findings) {
      const sev = f.severity as keyof typeof bySeverity;
      if (sev in bySeverity) bySeverity[sev]++;

      const category = f.rule_id.replace('google-indexed-', '');
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    // Check if the scan was actually performed (API keys configured + tier allows)
    const scanPerformed = auditCheck.rows[0].status === 'completed' || auditCheck.rows[0].status === 'failed';

    res.json({
      total: findings.length,
      bySeverity,
      byCategory,
      findings,
      scanPerformed,
    });
  } catch (error) {
    console.error('Index exposure error:', error);
    res.status(500).json({ error: 'Failed to get index exposure data', code: 'INDEX_EXPOSURE_FAILED' });
  }
});

/**
 * POST /api/audits/:id/pages/:pageId/generate-schema
 * Generate JSON-LD structured data for a page (Starter+ tiers)
 */
router.post('/:id/pages/:pageId/generate-schema', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const pageId = req.params.pageId;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    // Tier gate: require non-free tier
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    if (tier === 'free') {
      res.status(403).json({
        error: 'Schema generation requires Starter tier or above',
        code: 'TIER_REQUIRED',
        requiredTier: 'starter',
      });
      return;
    }

    // Get page data + homepage for site context
    const [pageResult, homepageResult] = await Promise.all([
      pool.query(`
        SELECT url, title, meta_description, detected_page_type
        FROM audit_pages
        WHERE id = $1 AND audit_job_id = $2
      `, [pageId, auditId]),
      pool.query(`
        SELECT url, title FROM audit_pages
        WHERE audit_job_id = $1 AND crawl_status = 'crawled'
        ORDER BY depth ASC, created_at ASC
        LIMIT 1
      `, [auditId]),
    ]);

    if (pageResult.rows.length === 0) {
      res.status(404).json({ error: 'Page not found', code: 'PAGE_NOT_FOUND' });
      return;
    }

    const page = pageResult.rows[0];
    const homepage = homepageResult.rows[0];
    const siteCtx = homepage ? {
      siteUrl: new URL(homepage.url).origin,
      siteName: homepage.title,
    } : undefined;

    const result = generateSchemaForPage({
      url: page.url,
      title: page.title,
      metaDescription: page.meta_description,
      detectedPageType: page.detected_page_type,
    }, siteCtx);

    res.json(result);
  } catch (error) {
    console.error('Generate schema error:', error);
    res.status(500).json({ error: 'Failed to generate schema', code: 'GENERATE_SCHEMA_FAILED' });
  }
});

/**
 * POST /api/audits/:id/generate-schema-all
 * Generate JSON-LD structured data for all pages in an audit (Starter+ tiers)
 */
router.post('/:id/generate-schema-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    // Tier gate
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    if (tier === 'free') {
      res.status(403).json({
        error: 'Schema generation requires Starter tier or above',
        code: 'TIER_REQUIRED',
        requiredTier: 'starter',
      });
      return;
    }

    // Get all crawled pages
    const pagesResult = await pool.query(`
      SELECT id, url, title, meta_description, detected_page_type
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled'
      ORDER BY depth ASC, created_at ASC
    `, [auditId]);

    if (pagesResult.rows.length === 0) {
      res.status(404).json({ error: 'No crawled pages found', code: 'NO_PAGES' });
      return;
    }

    const pages = pagesResult.rows.map((p: any) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      metaDescription: p.meta_description,
      detectedPageType: p.detected_page_type,
    }));

    const result = generateSchemaForSite(pages);
    res.json(result);
  } catch (error) {
    console.error('Generate schema all error:', error);
    res.status(500).json({ error: 'Failed to generate schema', code: 'GENERATE_SCHEMA_FAILED' });
  }
});

// ============================================================
// SCHEDULE ENDPOINTS (must be before /:id catch-all)
// ============================================================

import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById,
  getSchedulesByUser,
  toggleSchedule,
  getScheduleRunHistory,
} from '../../services/schedule.service.js';

const createScheduleSchema = z.object({
  targetUrl: z.string().url(),
  name: z.string().max(255).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  cronExpression: z.string().max(100).optional(),
  config: z.record(z.unknown()).optional(),
  notifyOnCompletion: z.boolean().optional(),
  notifyOnFailure: z.boolean().optional(),
  timezone: z.string().max(100).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  hourOfDay: z.number().int().min(0).max(23).optional(),
});

const updateScheduleSchema = z.object({
  name: z.string().max(255).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']).optional(),
  cronExpression: z.string().max(100).optional(),
  config: z.record(z.unknown()).optional(),
  notifyOnCompletion: z.boolean().optional(),
  notifyOnFailure: z.boolean().optional(),
  timezone: z.string().max(100).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  hourOfDay: z.number().int().min(0).max(23).optional(),
});

/**
 * POST /api/audits/schedules
 * Create an audit schedule (tier-gated: starter+)
 */
router.post('/schedules', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten(), code: 'VALIDATION_ERROR' });
      return;
    }

    const schedule = await createSchedule(userId, parsed.data);
    res.status(201).json({ schedule });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to create schedule', code: 'SCHEDULE_FAILED' });
  }
});

/**
 * GET /api/audits/schedules
 * List user's audit schedules (optional ?siteId= filter)
 */
router.get('/schedules', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const siteId = req.query.siteId as string | undefined;
    const schedules = await getSchedulesByUser(userId, siteId);
    res.json({ schedules });
  } catch (error) {
    console.error('List schedules error:', error);
    res.status(500).json({ error: 'Failed to list schedules', code: 'LIST_SCHEDULES_FAILED' });
  }
});

/**
 * GET /api/audits/schedules/:scheduleId
 * Get schedule detail with site info
 */
router.get('/schedules/:scheduleId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schedule = await getScheduleById(userId, req.params.scheduleId);
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
      return;
    }

    // Include last 10 runs
    const { runs } = await getScheduleRunHistory(schedule.id, userId, 10, 0);
    res.json({ schedule, recentRuns: runs });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule', code: 'GET_SCHEDULE_FAILED' });
  }
});

/**
 * PATCH /api/audits/schedules/:scheduleId
 * Update schedule settings
 */
router.patch('/schedules/:scheduleId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten(), code: 'VALIDATION_ERROR' });
      return;
    }

    const schedule = await updateSchedule(userId, req.params.scheduleId, parsed.data);
    res.json({ schedule });
  } catch (error: any) {
    console.error('Update schedule error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to update schedule', code: 'UPDATE_SCHEDULE_FAILED' });
  }
});

/**
 * DELETE /api/audits/schedules/:scheduleId
 * Delete an audit schedule
 */
router.delete('/schedules/:scheduleId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await deleteSchedule(userId, req.params.scheduleId);
    res.json({ message: 'Schedule deleted' });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to delete schedule', code: 'DELETE_SCHEDULE_FAILED' });
  }
});

/**
 * POST /api/audits/schedules/:scheduleId/toggle
 * Enable or disable a schedule
 */
router.post('/schedules/:scheduleId/toggle', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body as { enabled: boolean };
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled (boolean) is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const schedule = await toggleSchedule(userId, req.params.scheduleId, enabled);
    res.json({ schedule });
  } catch (error: any) {
    console.error('Toggle schedule error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to toggle schedule', code: 'TOGGLE_SCHEDULE_FAILED' });
  }
});

/**
 * GET /api/audits/schedules/:scheduleId/runs
 * Paginated run history for a schedule
 */
router.get('/schedules/:scheduleId/runs', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { runs, total } = await getScheduleRunHistory(req.params.scheduleId, userId, limit, offset);
    res.json({ runs, total, limit, offset });
  } catch (error: any) {
    console.error('Schedule runs error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to get runs', code: 'SCHEDULE_RUNS_FAILED' });
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

    // Get audit
    const auditResult = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
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

    // Get findings summary
    const findingsResult = await pool.query<{ category: string; severity: string; count: string }>(`
      SELECT category, severity, COUNT(*) as count
      FROM audit_findings
      WHERE audit_job_id = $1
      GROUP BY category, severity
    `, [auditId]);

    const findingsSummary = {
      total: 0,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    for (const row of findingsResult.rows) {
      const count = parseInt(row.count, 10);
      findingsSummary.total += count;
      findingsSummary.bySeverity[row.severity] = (findingsSummary.bySeverity[row.severity] || 0) + count;
      findingsSummary.byCategory[row.category] = (findingsSummary.byCategory[row.category] || 0) + count;
    }

    // Get pages summary
    const pagesResult = await pool.query<{ crawl_status: string; count: string }>(`
      SELECT crawl_status, COUNT(*) as count
      FROM audit_pages
      WHERE audit_job_id = $1
      GROUP BY crawl_status
    `, [auditId]);

    const pagesSummary = {
      total: 0,
      byStatus: {} as Record<string, number>,
    };

    for (const row of pagesResult.rows) {
      const count = parseInt(row.count, 10);
      pagesSummary.total += count;
      pagesSummary.byStatus[row.crawl_status] = count;
    }

    res.json({
      audit,
      findings: findingsSummary,
      pages: pagesSummary,
    });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({
      error: 'Failed to get audit',
      code: 'GET_AUDIT_FAILED',
    });
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
    const { category, severity, page = '1', limit = '50', sort } = req.query;

    // Verify audit ownership
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

    // Build query
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

    // Order by severity (critical first)
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
    `;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

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

    // Resolve fix snippets and apply tier gating
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    const isFree = tier === 'free';

    const findingsWithSnippets = result.rows.map((finding) => {
      const snippet = resolveFixSnippet(finding.rule_id, {
        selector: finding.selector || undefined,
        snippet: finding.snippet || undefined,
        pageUrl: (finding as any).page_url || undefined,
        message: finding.message || undefined,
      });

      // CQS sub-score impact tagging
      const cqsImpact = getCqsImpact(finding.rule_id);

      const enriched: Record<string, unknown> = { ...finding };

      if (cqsImpact) {
        enriched.cqsImpact = cqsImpact;
      }

      if (snippet) {
        // Free tier: explanation only (no code)
        enriched.fixSnippet = isFree
          ? {
              fixType: snippet.fixType,
              language: snippet.language,
              explanation: snippet.explanation,
              effort: snippet.effort,
              learnMoreUrl: snippet.learnMoreUrl,
            }
          : {
              fixType: snippet.fixType,
              language: snippet.language,
              code: snippet.code,
              explanation: snippet.explanation,
              effort: snippet.effort,
              learnMoreUrl: snippet.learnMoreUrl,
            };
      }

      return enriched;
    });

    // Optional: sort by CQS impact weight (highest impact first)
    if (sort === 'cqs_impact') {
      findingsWithSnippets.sort((a, b) => {
        const aWeight = (a.cqsImpact as any)?.weight ?? 0;
        const bWeight = (b.cqsImpact as any)?.weight ?? 0;
        return bWeight - aWeight;
      });
    }

    res.json({
      findings: findingsWithSnippets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].count, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limitNum),
      },
    });
  } catch (error) {
    console.error('Get findings error:', error);
    res.status(500).json({
      error: 'Failed to get findings',
      code: 'GET_FINDINGS_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/broken-links
 * Get broken link findings for an audit
 */
router.get('/:id/broken-links', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
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

    const result = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1 AND f.rule_id LIKE 'broken-link%'
      ORDER BY
        CASE f.severity
          WHEN 'critical' THEN 1
          WHEN 'serious' THEN 2
          WHEN 'moderate' THEN 3
          WHEN 'minor' THEN 4
          ELSE 5
        END,
        f.created_at DESC
    `, [auditId]);

    res.json({
      brokenLinks: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get broken links error:', error);
    res.status(500).json({
      error: 'Failed to get broken links',
      code: 'GET_BROKEN_LINKS_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/pages
 * Get crawled pages
 */
router.get('/:id/pages', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const { status, page = '1', limit = '50' } = req.query;

    // Verify audit ownership
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

    // Build query
    let query = `
      SELECT id, url, depth, status_code, content_type, response_time_ms, page_size_bytes,
             title, meta_description, canonical_url, h1_text, word_count,
             crawl_status, error_message, error_type, error_category, error_suggestion, retry_count,
             seo_score, accessibility_score, security_score, performance_score, content_score, structured_data_score, cqs_score,
             seo_issues, accessibility_issues, security_issues, performance_issues, content_issues, structured_data_issues,
             content_quality_score, content_readability_score, content_structure_score, content_engagement_score,
             flesch_kincaid_grade, flesch_reading_ease, reading_time_minutes, keyword_data,
             eeat_score, eeat_experience_score, eeat_expertise_score, eeat_authoritativeness_score, eeat_trustworthiness_score,
             has_author_bio, has_author_credentials, citation_count, has_contact_info, has_privacy_policy, has_terms_of_service, eeat_tier, eeat_evidence,
             aeo_score, aeo_nugget_score, aeo_factual_density_score, aeo_source_authority_score, aeo_tier, aeo_nuggets, aeo_content_frontloaded, aeo_content_frontloading_ratio,
             json_ld_count, has_open_graph, has_twitter_card, detected_schema_types, detected_page_type,
             crawled_at, created_at
      FROM audit_pages
      WHERE audit_job_id = $1
    `;
    const params: any[] = [auditId];

    if (status) {
      params.push(status);
      query += ` AND crawl_status = $${params.length}`;
    }

    query += ` ORDER BY depth ASC, created_at ASC`;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM audit_pages WHERE audit_job_id = $1`;
    const countParams: any[] = [auditId];

    if (status) {
      countParams.push(status);
      countQuery += ` AND crawl_status = $${countParams.length}`;
    }

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
    res.status(500).json({
      error: 'Failed to get pages',
      code: 'GET_PAGES_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/pages/:pageId
 * Get a single page with full details
 */
router.get('/:id/pages/:pageId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const pageId = req.params.pageId;

    // Verify audit ownership
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

    // Get page with all details
    const pageResult = await pool.query(`
      SELECT id, url, url_hash, depth, status_code, content_type, response_time_ms, page_size_bytes,
             title, meta_description, canonical_url, h1_text, word_count,
             crawl_status, error_message, error_type, error_category, error_suggestion, retry_count,
             seo_score, accessibility_score, security_score, performance_score, content_score, structured_data_score, cqs_score,
             seo_issues, accessibility_issues, security_issues, performance_issues, content_issues, structured_data_issues,
             content_quality_score, content_readability_score, content_structure_score, content_engagement_score,
             flesch_kincaid_grade, flesch_reading_ease, reading_time_minutes, keyword_data,
             eeat_score, eeat_experience_score, eeat_expertise_score, eeat_authoritativeness_score, eeat_trustworthiness_score,
             has_author_bio, has_author_credentials, citation_count, has_contact_info, has_privacy_policy, has_terms_of_service, eeat_tier, eeat_evidence,
             aeo_score, aeo_nugget_score, aeo_factual_density_score, aeo_source_authority_score, aeo_tier, aeo_nuggets, aeo_content_frontloaded, aeo_content_frontloading_ratio,
             json_ld_count, has_open_graph, has_twitter_card, detected_schema_types, detected_page_type,
             crawled_at, created_at
      FROM audit_pages
      WHERE id = $1 AND audit_job_id = $2
    `, [pageId, auditId]);

    if (pageResult.rows.length === 0) {
      res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND',
      });
      return;
    }

    // Get findings for this page
    const findingsResult = await pool.query<AuditFinding>(`
      SELECT id, category, rule_id, rule_name, severity, message, description,
             recommendation, selector, snippet, impact, wcag_criteria, help_url, created_at
      FROM audit_findings
      WHERE audit_page_id = $1
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'serious' THEN 2
          WHEN 'moderate' THEN 3
          WHEN 'minor' THEN 4
          WHEN 'info' THEN 5
        END,
        category
    `, [pageId]);

    // Resolve fix snippets for page findings
    const pageTierLimits = await getUserTierLimits(userId);
    const pageTier = (pageTierLimits as any)?.tier || 'free';
    const pageIsFree = pageTier === 'free';
    const resolvedPageUrl = pageResult.rows[0].url;

    const findingsWithSnippets = findingsResult.rows.map((finding) => {
      const fixResult = resolveFixSnippet(finding.rule_id, {
        selector: finding.selector || undefined,
        snippet: finding.snippet || undefined,
        pageUrl: resolvedPageUrl || undefined,
        message: finding.message || undefined,
      });

      if (!fixResult) return finding;

      const fixSnippet = pageIsFree
        ? {
            fixType: fixResult.fixType,
            language: fixResult.language,
            explanation: fixResult.explanation,
            effort: fixResult.effort,
            learnMoreUrl: fixResult.learnMoreUrl,
          }
        : {
            fixType: fixResult.fixType,
            language: fixResult.language,
            code: fixResult.code,
            explanation: fixResult.explanation,
            effort: fixResult.effort,
            learnMoreUrl: fixResult.learnMoreUrl,
          };

      return { ...finding, fixSnippet };
    });

    // Group findings by category
    const findingsByCategory: Record<string, any[]> = {};
    for (const finding of findingsWithSnippets) {
      if (!findingsByCategory[finding.category]) {
        findingsByCategory[finding.category] = [];
      }
      findingsByCategory[finding.category].push(finding);
    }

    res.json({
      page: pageResult.rows[0],
      findings: findingsWithSnippets,
      findingsByCategory,
      summary: {
        total: findingsResult.rows.length,
        bySeverity: findingsResult.rows.reduce((acc, f) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCategory: findingsResult.rows.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({
      error: 'Failed to get page',
      code: 'GET_PAGE_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/stream
 * Server-Sent Events for real-time progress
 */
router.get('/:id/stream', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditCheck = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({
        error: 'Audit not found',
        code: 'AUDIT_NOT_FOUND',
      });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial state
    const sendProgress = async (): Promise<string> => {
      const result = await pool.query<AuditJob & { activity_log: unknown }>(
        `SELECT status, pages_found, pages_crawled, pages_audited, current_url,
                total_issues, critical_issues,
                seo_score, accessibility_score, security_score, performance_score, content_score, structured_data_score, cqs_score,
                activity_log, created_at
         FROM audit_jobs WHERE id = $1`,
        [auditId]
      );

      if (result.rows.length === 0) {
        return 'cancelled';
      }

      const progress = result.rows[0];

      // Queue position + estimated wait (only when pending)
      let queuePosition: number | null = null;
      let estimatedWaitSeconds: number | null = null;

      if (progress.status === 'pending' || progress.status === 'ready') {
        // Count jobs ahead in queue (pending + ready jobs created before this one)
        const posResult = await pool.query(
          `SELECT COUNT(*) as position FROM audit_jobs
           WHERE status IN ('pending', 'discovering', 'ready') AND created_at < $1`,
          [(progress as any).created_at]
        );
        queuePosition = parseInt(posResult.rows[0].position, 10) + 1;

        // Estimate wait from recent audit durations
        const avgResult = await pool.query(
          `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
           FROM audit_jobs
           WHERE status = 'completed'
           AND completed_at > NOW() - INTERVAL '7 days'
           AND started_at IS NOT NULL`
        );
        const avgSeconds = parseFloat(avgResult.rows[0].avg_seconds) || 120; // default 2min
        // Count currently processing jobs to estimate concurrency slots
        const procResult = await pool.query(
          `SELECT COUNT(*) as processing FROM audit_jobs WHERE status = 'processing'`
        );
        const processing = parseInt(procResult.rows[0].processing, 10);
        const maxConcurrent = parseInt(process.env.WORKER_MAX_CONCURRENT_JOBS || '1', 10);
        const freeSlots = Math.max(0, maxConcurrent - processing);
        // If there are free slots, this job should start soon
        if (freeSlots > 0 && queuePosition <= freeSlots) {
          estimatedWaitSeconds = 10; // Starting shortly
        } else {
          estimatedWaitSeconds = Math.round((queuePosition / maxConcurrent) * avgSeconds);
        }
      }

      const progressData = {
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
        contentScore: progress.content_score,
        structuredDataScore: progress.structured_data_score,
        activityLog: progress.activity_log || [],
        queuePosition,
        estimatedWaitSeconds,
      };

      // Wrap in type/data structure for client
      const message = {
        type: 'progress',
        data: progressData,
      };

      res.write(`data: ${JSON.stringify(message)}\n\n`);

      return progress.status;
    };

    // Send initial progress
    let status = await sendProgress();

    // Poll for updates
    const interval = setInterval(async () => {
      try {
        status = await sendProgress();

        // Stop polling when audit is done
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

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({
      error: 'Failed to start stream',
      code: 'STREAM_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/export/csv
 * Export findings as CSV
 */
router.get('/:id/export/csv', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const auditCheck = await pool.query(
      `SELECT id, target_domain FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const result = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.category, f.rule_id, f.rule_name, f.severity, f.message,
             f.description, f.recommendation, f.selector, f.snippet,
             f.wcag_criteria, f.help_url, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
      ORDER BY
        CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
        f.category, f.rule_id
    `, [auditId]);

    // Resolve tier for fix snippet gating
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    const isFree = tier === 'free';

    const domain = auditCheck.rows[0].target_domain;
    const headers = ['Category', 'Severity', 'Rule ID', 'Rule Name', 'Message', 'Page URL', 'Recommendation', 'Selector', 'WCAG Criteria', 'Help URL', 'Fix Explanation', 'Fix Code', 'Fix Effort'];
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      const escape = (val: string | null | undefined) => {
        if (!val) return '';
        return `"${val.replace(/"/g, '""')}"`;
      };

      const snippet = resolveFixSnippet(row.rule_id, {
        selector: row.selector || undefined,
        snippet: row.snippet || undefined,
        pageUrl: row.page_url || undefined,
        message: row.message || undefined,
      });

      csvRows.push([
        escape(row.category),
        escape(row.severity),
        escape(row.rule_id),
        escape(row.rule_name),
        escape(row.message),
        escape(row.page_url),
        escape(row.recommendation),
        escape(row.selector),
        escape(Array.isArray(row.wcag_criteria) ? row.wcag_criteria.join('; ') : null),
        escape(row.help_url),
        escape(snippet?.explanation || null),
        escape(isFree ? null : snippet?.code || null),
        escape(snippet?.effort || null),
      ].join(','));
    }

    // Log CSV export
    await auditService.logExportCsv(
      userId, auditId, result.rows.length,
      req.ip, req.get('user-agent')
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${domain}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV', code: 'EXPORT_CSV_FAILED' });
  }
});

/**
 * GET /api/audits/:id/export/json
 * Export full audit data as JSON
 */
router.get('/:id/export/json', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const auditResult = await pool.query(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const findingsResult = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
      ORDER BY f.category, f.severity
    `, [auditId]);

    const pagesResult = await pool.query(`
      SELECT * FROM audit_pages WHERE audit_job_id = $1 ORDER BY depth, created_at
    `, [auditId]);

    // Resolve fix snippets with tier gating
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    const isFree = tier === 'free';

    const findingsWithSnippets = findingsResult.rows.map((finding) => {
      const snippet = resolveFixSnippet(finding.rule_id, {
        selector: finding.selector || undefined,
        snippet: finding.snippet || undefined,
        pageUrl: finding.page_url || undefined,
        message: finding.message || undefined,
      });

      if (!snippet) return finding;

      const fixSnippet = isFree
        ? { fixType: snippet.fixType, language: snippet.language, explanation: snippet.explanation, effort: snippet.effort, learnMoreUrl: snippet.learnMoreUrl }
        : { fixType: snippet.fixType, language: snippet.language, code: snippet.code, explanation: snippet.explanation, effort: snippet.effort, learnMoreUrl: snippet.learnMoreUrl };

      return { ...finding, fixSnippet };
    });

    const domain = auditResult.rows[0].target_domain;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${domain}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      audit: auditResult.rows[0],
      findings: findingsWithSnippets,
      pages: pagesResult.rows,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to export', code: 'EXPORT_FAILED' });
  }
});

/**
 * GET /api/audits/:id/export/markdown
 * Export audit report as Markdown — no tier-gating
 */
router.get('/:id/export/markdown', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const audit = auditResult.rows[0];

    const findingsResult = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
      ORDER BY
        CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
        f.category
    `, [auditId]);

    let brokenLinksResult: { rows: any[] } = { rows: [] };
    try {
      brokenLinksResult = await pool.query(`
        SELECT bl.*, p.url as source_url
        FROM broken_links bl
        LEFT JOIN audit_pages p ON bl.audit_page_id = p.id
        WHERE bl.audit_job_id = $1
        ORDER BY bl.status_code DESC NULLS LAST
      `, [auditId]);
    } catch {
      // broken_links table doesn't exist yet - skip
    }

    const defaultBranding: ResolvedBranding = {
      companyName: 'PagePulser',
      logoUrl: null,
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#f59e0b',
      footerText: 'Generated by PagePulser',
      canExportPdf: false,
      canWhiteLabel: false,
    };

    const markdown = buildReportMarkdown({
      audit,
      findings: findingsResult.rows,
      brokenLinks: brokenLinksResult.rows,
      branding: defaultBranding,
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.target_domain}-${new Date().toISOString().split('T')[0]}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Export Markdown error:', error);
    res.status(500).json({ error: 'Failed to export Markdown', code: 'EXPORT_MARKDOWN_FAILED' });
  }
});

/**
 * GET /api/audits/:id/export/html
 * Export audit report as HTML — no tier-gating
 */
router.get('/:id/export/html', authenticate, async (req: Request, res: Response): Promise<void> => {
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

    const audit = auditResult.rows[0];

    const findingsResult = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
      ORDER BY
        CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
        f.category
    `, [auditId]);

    let brokenLinksResult: { rows: any[] } = { rows: [] };
    try {
      brokenLinksResult = await pool.query(`
        SELECT bl.*, p.url as source_url
        FROM broken_links bl
        LEFT JOIN audit_pages p ON bl.audit_page_id = p.id
        WHERE bl.audit_job_id = $1
        ORDER BY bl.status_code DESC NULLS LAST
      `, [auditId]);
    } catch {
      // broken_links table doesn't exist yet - skip
    }

    const defaultBranding: ResolvedBranding = {
      companyName: 'PagePulser',
      logoUrl: null,
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#f59e0b',
      footerText: 'Generated by PagePulser',
      canExportPdf: false,
      canWhiteLabel: false,
    };

    const html = buildReportHtml({
      audit,
      findings: findingsResult.rows,
      brokenLinks: brokenLinksResult.rows,
      branding: defaultBranding,
    }, null);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.target_domain}-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Export HTML error:', error);
    res.status(500).json({ error: 'Failed to export HTML', code: 'EXPORT_HTML_FAILED' });
  }
});

/**
 * GET /api/audits/:id/export/pdf
 * Export audit report as PDF (#47) - Professional branded report
 */
router.get('/:id/export/pdf', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Get audit with details
    const auditResult = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const audit = auditResult.rows[0];

    // Resolve PDF branding based on tier
    const branding = await resolvePdfBranding(audit.site_id || null, userId);

    if (!branding.canExportPdf) {
      res.status(403).json({
        error: 'PDF export requires Starter plan or higher',
        code: 'TIER_EXPORT_PDF_DENIED',
      });
      return;
    }

    // Get findings
    const findingsResult = await pool.query<AuditFinding & { page_url: string }>(`
      SELECT f.*, p.url as page_url
      FROM audit_findings f
      LEFT JOIN audit_pages p ON f.audit_page_id = p.id
      WHERE f.audit_job_id = $1
      ORDER BY
        CASE f.severity WHEN 'critical' THEN 1 WHEN 'serious' THEN 2 WHEN 'moderate' THEN 3 WHEN 'minor' THEN 4 ELSE 5 END,
        f.category
    `, [auditId]);

    // Get broken links (table may not exist in all deployments)
    let brokenLinksResult: { rows: any[] } = { rows: [] };
    try {
      brokenLinksResult = await pool.query(`
        SELECT bl.*, p.url as source_url
        FROM broken_links bl
        LEFT JOIN audit_pages p ON bl.audit_page_id = p.id
        WHERE bl.audit_job_id = $1
        ORDER BY bl.status_code DESC NULLS LAST
      `, [auditId]);
    } catch {
      // broken_links table doesn't exist yet - skip
    }

    // Resolve fix snippets for PDF (tier-gated: Starter+ gets code)
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    const isFree = tier === 'free';

    const fixSnippetMap: Record<string, ResolvedFixSnippetForPdf> = {};
    const seenRules = new Set<string>();
    for (const f of findingsResult.rows) {
      if (seenRules.has(f.rule_id)) continue;
      seenRules.add(f.rule_id);
      const snippet = resolveFixSnippet(f.rule_id, {
        selector: f.selector || undefined,
        snippet: f.snippet || undefined,
        pageUrl: f.page_url || undefined,
        message: f.message || undefined,
      });
      if (snippet) {
        fixSnippetMap[f.rule_id] = isFree
          ? { ...snippet, code: '' }
          : snippet;
      }
    }

    // Resolve compliance data for PDF (Pro+ only)
    let complianceData: ComplianceDataForPdf | undefined;
    const COMPLIANCE_TIERS = ['pro', 'agency', 'enterprise'];
    if (COMPLIANCE_TIERS.includes(tier) && audit.check_accessibility) {
      try {
        const compFindingsResult = await pool.query<{
          rule_id: string;
          severity: string;
          wcag_criteria: string;
          issue_count: string;
        }>(`
          SELECT rule_id, severity, COALESCE(wcag_criteria, '') as wcag_criteria,
                 COUNT(DISTINCT CONCAT(rule_id, '|', COALESCE(page_url, ''))) as issue_count
          FROM audit_findings
          WHERE audit_job_id = $1 AND category = 'accessibility'
          GROUP BY rule_id, severity, wcag_criteria
          ORDER BY rule_id
        `, [auditId]);

        const wcagToEn = buildWcagToEnMap();
        const clauseMap = new Map<string, { clause: string; title: string; wcagCriteria: string; status: 'pass' | 'fail' | 'manual_review' | 'not_tested'; issueCount: number }>();

        for (const en of enMapping) {
          clauseMap.set(en.clause, {
            clause: en.clause,
            title: en.title,
            wcagCriteria: en.wcagCriteria,
            status: en.manualOnly ? 'manual_review' : 'pass',
            issueCount: 0,
          });
        }

        let criticalCount = 0;
        let seriousCount = 0;
        for (const row of compFindingsResult.rows) {
          const criteria = row.wcag_criteria.split(/[,;]\s*/).map((c: string) => c.trim()).filter(Boolean);
          const count = parseInt(row.issue_count, 10);
          if (row.severity === 'critical') criticalCount += count;
          if (row.severity === 'serious') seriousCount += count;
          for (const criterion of criteria) {
            const enClauses = wcagToEn.get(criterion);
            if (!enClauses) continue;
            for (const en of enClauses) {
              const entry = clauseMap.get(en.clause)!;
              entry.issueCount += count;
              entry.status = 'fail';
            }
          }
        }

        const clauseResults = Array.from(clauseMap.values());
        const passing = clauseResults.filter(c => c.status === 'pass').length;
        const failing = clauseResults.filter(c => c.status === 'fail').length;
        const manualReview = clauseResults.filter(c => c.status === 'manual_review').length;
        const notTested = clauseResults.filter(c => c.status === 'not_tested').length;

        let compStatus: 'compliant' | 'partially_compliant' | 'non_compliant' = 'partially_compliant';
        if (failing === 0 && criticalCount === 0 && seriousCount === 0) {
          compStatus = 'compliant';
        } else if (criticalCount > 0 || seriousCount > 5) {
          compStatus = 'non_compliant';
        }

        complianceData = {
          status: compStatus,
          standard: 'EN 301 549 (WCAG 2.2 Level AA)',
          summary: { totalClauses: enMapping.length, passing, failing, manualReview, notTested },
          clauses: clauseResults,
          domain: audit.target_domain,
          pagesAudited: audit.pages_audited || 0,
        };
      } catch (compErr) {
        console.error('Compliance data for PDF failed (non-fatal):', compErr);
      }
    }

    // Generate PDF via Playwright HTML-to-PDF
    const pdfBuffer = await generateAuditPdf({
      audit,
      findings: findingsResult.rows,
      brokenLinks: brokenLinksResult.rows,
      branding,
      fixSnippets: Object.keys(fixSnippetMap).length > 0 ? fixSnippetMap : undefined,
      compliance: complianceData,
    });

    // Log PDF export
    await auditService.logExportPdf(
      userId, auditId,
      req.ip, req.get('user-agent')
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.target_domain}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF', code: 'EXPORT_PDF_FAILED' });
  }
});

/**
 * GET /api/audits/:id/score-history
 * Get score history for the same target domain
 */
router.get('/:id/score-history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    const auditResult = await pool.query(
      `SELECT target_domain FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const domain = auditResult.rows[0].target_domain;

    const history = await pool.query(`
      SELECT id, created_at, seo_score, accessibility_score, security_score, performance_score, content_score, cqs_score
      FROM audit_jobs
      WHERE user_id = $1 AND target_domain = $2 AND status = 'completed'
      ORDER BY created_at ASC
      LIMIT 20
    `, [userId, domain]);

    res.json({ history: history.rows });
  } catch (error) {
    console.error('Score history error:', error);
    res.status(500).json({ error: 'Failed to get score history', code: 'SCORE_HISTORY_FAILED' });
  }
});

/**
 * PATCH /api/audits/:id/findings/:findingId/dismiss
 * Dismiss or reactivate a finding
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

    // Verify ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );
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

    // Log finding status change
    const finding = result.rows[0];
    if (status === 'dismissed') {
      await auditService.logFindingDismissed(
        userId, auditId, finding.rule_id, finding.message, 1,
        req.ip, req.get('user-agent')
      );
    } else {
      await auditService.logFindingRestored(
        userId, auditId, finding.rule_id, finding.message, 1,
        req.ip, req.get('user-agent')
      );
    }

    res.json({ finding: result.rows[0] });
  } catch (error) {
    console.error('Dismiss finding error:', error);
    res.status(500).json({ error: 'Failed to update finding', code: 'DISMISS_FAILED' });
  }
});

/**
 * PATCH /api/audits/:id/findings/bulk-dismiss
 * Bulk dismiss findings by rule_id
 */
router.patch('/:id/findings/bulk-dismiss', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const { ruleId, message, status } = req.body as { ruleId: string; message: string; status: 'dismissed' | 'active' };

    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );
    if (auditCheck.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `UPDATE audit_findings SET status = $1 WHERE audit_job_id = $2 AND rule_id = $3 AND message = $4 RETURNING id`,
      [status || 'dismissed', auditId, ruleId, message]
    );

    // Log bulk dismiss/restore
    const effectiveStatus = status || 'dismissed';
    if (effectiveStatus === 'dismissed') {
      await auditService.logFindingDismissed(
        userId, auditId, ruleId, message, result.rowCount || 0,
        req.ip, req.get('user-agent')
      );
    } else {
      await auditService.logFindingRestored(
        userId, auditId, ruleId, message, result.rowCount || 0,
        req.ip, req.get('user-agent')
      );
    }

    res.json({ updated: result.rowCount });
  } catch (error) {
    console.error('Bulk dismiss error:', error);
    res.status(500).json({ error: 'Failed to bulk dismiss', code: 'BULK_DISMISS_FAILED' });
  }
});

/**
 * POST /api/audits/:id/rerun
 * Create a new audit with the same configuration as an existing one (#41)
 */
router.post('/:id/rerun', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Get original audit config
    const original = await pool.query<AuditJob>(
      `SELECT target_url, target_domain, organization_id, site_id, max_pages, max_depth, respect_robots_txt, include_subdomains,
              check_seo, check_accessibility, check_security, check_performance, check_content, wcag_version, wcag_level
       FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (original.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const orig = original.rows[0];

    // Check concurrent audit limit
    const activeAudits = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')`,
      [userId]
    );
    if (parseInt(activeAudits.rows[0].count, 10) >= 3) {
      res.status(429).json({ error: 'Too many active audits', code: 'AUDIT_LIMIT_REACHED' });
      return;
    }

    // Create new audit with same config
    const result = await pool.query<AuditJob>(`
      INSERT INTO audit_jobs (
        user_id, organization_id, site_id, target_url, target_domain,
        max_pages, max_depth, respect_robots_txt, include_subdomains,
        check_seo, check_accessibility, check_security, check_performance, check_content,
        wcag_version, wcag_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      userId, orig.organization_id, orig.site_id, orig.target_url, orig.target_domain,
      orig.max_pages, orig.max_depth, orig.respect_robots_txt, orig.include_subdomains,
      orig.check_seo, orig.check_accessibility, orig.check_security, orig.check_performance,
      orig.check_content ?? true,
      orig.wcag_version, orig.wcag_level,
    ]);

    res.status(201).json({ audit: result.rows[0] });
  } catch (error) {
    console.error('Re-run audit error:', error);
    res.status(500).json({ error: 'Failed to re-run audit', code: 'RERUN_FAILED' });
  }
});

/**
 * POST /api/audits/:id/cancel
 * Cancel a running audit
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
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

    // Log audit cancellation
    await auditService.logAuditCancelled(
      userId,
      auditId,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      message: 'Audit cancelled',
      audit: result.rows[0],
    });
  } catch (error) {
    console.error('Cancel audit error:', error);
    res.status(500).json({
      error: 'Failed to cancel audit',
      code: 'CANCEL_FAILED',
    });
  }
});

/**
 * DELETE /api/audits/:id
 * Delete an audit
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Only allow deleting completed, failed, or cancelled audits
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

    // Log audit deletion
    await auditService.logAuditDeleted(
      userId,
      auditId,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      message: 'Audit deleted',
    });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({
      error: 'Failed to delete audit',
      code: 'DELETE_FAILED',
    });
  }
});

/**
 * DELETE /api/audits/archive
 * Archive (delete) old completed audits (#68)
 */
router.delete('/archive/old', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { olderThanDays = '90' } = req.query;
    const days = parseInt(olderThanDays as string, 10);

    if (isNaN(days) || days < 7) {
      res.status(400).json({ error: 'olderThanDays must be >= 7', code: 'INVALID_DAYS' });
      return;
    }

    const result = await pool.query(`
      DELETE FROM audit_jobs
      WHERE user_id = $1
        AND status IN ('completed', 'failed', 'cancelled')
        AND created_at < NOW() - INTERVAL '1 day' * $2
      RETURNING id
    `, [userId, days]);

    res.json({
      message: `Archived ${result.rowCount} audit(s) older than ${days} days`,
      archived: result.rowCount,
    });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: 'Failed to archive', code: 'ARCHIVE_FAILED' });
  }
});

// ============================================================
// SCHEDULED AUDITS ENDPOINTS
// ============================================================

// ============================================================
// FILE EXTRACTION / ASSETS ENDPOINTS
// ============================================================

/**
 * GET /api/audits/:id/assets
 * List all assets for an audit (paginated, filterable, searchable)
 */
router.get('/:id/assets', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;
    const {
      type,
      search,
      sort = 'page_count',
      order = 'desc',
      limit = '50',
      offset = '0',
    } = req.query;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );
    if (auditCheck.rows.length === 0) {
      // Also check shared site access
      const sharedCheck = await pool.query(
        `SELECT aj.id FROM audit_jobs aj
         JOIN sites s ON s.id = aj.site_id
         JOIN site_shares ss ON ss.site_id = s.id
         WHERE aj.id = $1 AND ss.shared_with_user_id = $2`,
        [auditId, userId]
      );
      if (sharedCheck.rows.length === 0) {
        res.status(404).json({ error: 'Audit not found' });
        return;
      }
    }

    // Build query
    let query = `
      SELECT id, url, url_hash, asset_type, mime_type, file_extension, file_name,
             file_size_bytes, source, http_status, page_count, created_at
      FROM audit_assets
      WHERE audit_job_id = $1
    `;
    const params: unknown[] = [auditId];
    let paramIdx = 2;

    if (type && typeof type === 'string' && type !== 'all') {
      query += ` AND asset_type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    if (search && typeof search === 'string') {
      query += ` AND (file_name ILIKE $${paramIdx} OR url ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Sort
    const allowedSorts: Record<string, string> = {
      page_count: 'page_count',
      file_size: 'file_size_bytes',
      name: 'file_name',
      type: 'asset_type',
    };
    const sortCol = allowedSorts[sort as string] || 'page_count';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortOrder} NULLS LAST`;

    // Pagination
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
    const offsetNum = parseInt(offset as string, 10) || 0;
    query += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limitNum, offsetNum);

    const [assetsResult, countResult, summaryResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) as total FROM audit_assets WHERE audit_job_id = $1${
          type && type !== 'all' ? ` AND asset_type = $2` : ''
        }${search ? ` AND (file_name ILIKE $${type && type !== 'all' ? '3' : '2'} OR url ILIKE $${type && type !== 'all' ? '3' : '2'})` : ''}`,
        [auditId, ...(type && type !== 'all' ? [type] : []), ...(search ? [`%${search}%`] : [])]
      ),
      pool.query<{ asset_type: string; count: string; total_size: string }>(
        `SELECT asset_type, COUNT(*) as count, COALESCE(SUM(file_size_bytes), 0) as total_size
         FROM audit_assets WHERE audit_job_id = $1 GROUP BY asset_type ORDER BY count DESC`,
        [auditId]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const summary = summaryResult.rows.map(r => ({
      type: r.asset_type,
      count: parseInt(r.count, 10),
      totalSize: parseInt(r.total_size, 10),
    }));

    res.json({
      assets: assetsResult.rows,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        pages: Math.ceil(total / limitNum),
      },
      summary,
      totalAssets: summary.reduce((sum, s) => sum + s.count, 0),
    });
  } catch (error) {
    console.error('Get audit assets error:', error);
    res.status(500).json({ error: 'Failed to get assets', code: 'GET_ASSETS_FAILED' });
  }
});

/**
 * GET /api/audits/:id/assets/:assetId/pages
 * List pages that reference a specific asset
 */
router.get('/:id/assets/:assetId/pages', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: auditId, assetId } = req.params;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );
    if (auditCheck.rows.length === 0) {
      const sharedCheck = await pool.query(
        `SELECT aj.id FROM audit_jobs aj
         JOIN sites s ON s.id = aj.site_id
         JOIN site_shares ss ON ss.site_id = s.id
         WHERE aj.id = $1 AND ss.shared_with_user_id = $2`,
        [auditId, userId]
      );
      if (sharedCheck.rows.length === 0) {
        res.status(404).json({ error: 'Audit not found' });
        return;
      }
    }

    const result = await pool.query(
      `SELECT ap.id, ap.url, ap.title, aap.html_element, aap.html_attribute
       FROM audit_asset_pages aap
       JOIN audit_pages ap ON ap.id = aap.audit_page_id
       WHERE aap.audit_asset_id = $1
       ORDER BY ap.url`,
      [assetId]
    );

    res.json({ pages: result.rows });
  } catch (error) {
    console.error('Get asset pages error:', error);
    res.status(500).json({ error: 'Failed to get asset pages', code: 'GET_ASSET_PAGES_FAILED' });
  }
});

/**
 * GET /api/audits/:id/pages/:pageId/assets
 * List assets found on a specific page
 */
router.get('/:id/pages/:pageId/assets', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: auditId, pageId } = req.params;

    // Verify audit ownership
    const auditCheck = await pool.query(
      `SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );
    if (auditCheck.rows.length === 0) {
      const sharedCheck = await pool.query(
        `SELECT aj.id FROM audit_jobs aj
         JOIN sites s ON s.id = aj.site_id
         JOIN site_shares ss ON ss.site_id = s.id
         WHERE aj.id = $1 AND ss.shared_with_user_id = $2`,
        [auditId, userId]
      );
      if (sharedCheck.rows.length === 0) {
        res.status(404).json({ error: 'Audit not found' });
        return;
      }
    }

    const result = await pool.query(
      `SELECT aa.id, aa.url, aa.asset_type, aa.mime_type, aa.file_extension, aa.file_name,
              aa.file_size_bytes, aa.source, aa.http_status, aa.page_count,
              aap.html_element, aap.html_attribute
       FROM audit_asset_pages aap
       JOIN audit_assets aa ON aa.id = aap.audit_asset_id
       WHERE aap.audit_page_id = $1 AND aa.audit_job_id = $2
       ORDER BY aa.asset_type, aa.file_name`,
      [pageId, auditId]
    );

    res.json({ assets: result.rows });
  } catch (error) {
    console.error('Get page assets error:', error);
    res.status(500).json({ error: 'Failed to get page assets', code: 'GET_PAGE_ASSETS_FAILED' });
  }
});

/**
 * GET /api/audits/:id/statement-data
 * Generate accessibility statement data from audit results (Pro+ tier)
 */
router.get('/:id/statement-data', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditResult = await pool.query<AuditJob>(
      `SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2`,
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

    // Tier gate: require Pro or above
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';
    if (!['pro', 'agency', 'enterprise'].includes(tier)) {
      res.status(403).json({
        error: 'Accessibility statement generation requires Pro tier or above',
        code: 'TIER_REQUIRED',
        requiredTier: 'pro',
      });
      return;
    }

    // Get accessibility-only findings, grouped by rule (unique issues)
    const findingsResult = await pool.query<{
      rule_id: string;
      rule_name: string;
      severity: string;
      description: string | null;
      issue_count: string;
    }>(`
      SELECT rule_id, rule_name, severity, description, COUNT(DISTINCT rule_id || COALESCE(message, '')) as issue_count
      FROM audit_findings
      WHERE audit_job_id = $1 AND category = 'accessibility'
      GROUP BY rule_id, rule_name, severity, description
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'serious' THEN 2
          WHEN 'moderate' THEN 3
          WHEN 'minor' THEN 4
          ELSE 5
        END,
        rule_name
    `, [auditId]);

    // Group by severity
    const issuesByCategory: Record<string, Array<{ ruleName: string; count: number; description: string }>> = {
      critical: [],
      serious: [],
      moderate: [],
      minor: [],
    };

    for (const row of findingsResult.rows) {
      const sev = row.severity;
      if (issuesByCategory[sev]) {
        issuesByCategory[sev].push({
          ruleName: row.rule_name,
          count: parseInt(row.issue_count, 10),
          description: row.description || '',
        });
      }
    }

    // Get unique accessibility issue count
    const uniqueIssuesResult = await pool.query<{ count: string }>(`
      SELECT COUNT(DISTINCT rule_id) as count
      FROM audit_findings
      WHERE audit_job_id = $1 AND category = 'accessibility'
    `, [auditId]);

    const totalIssues = parseInt(uniqueIssuesResult.rows[0].count, 10);

    // Get pages audited count
    const pagesResult = await pool.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled'
    `, [auditId]);

    const pagesAudited = parseInt(pagesResult.rows[0].count, 10);

    // Determine categories checked
    const categoriesChecked: string[] = [];
    if (audit.check_seo) categoriesChecked.push('seo');
    if (audit.check_accessibility) categoriesChecked.push('accessibility');
    if (audit.check_security) categoriesChecked.push('security');
    if (audit.check_performance) categoriesChecked.push('performance');
    if (audit.check_content) categoriesChecked.push('content');

    // Determine conformance level from accessibility score
    const accessibilityScore = audit.accessibility_score ?? 0;
    let conformanceLevel: 'Full' | 'Partial' | 'Non-conformant';
    if (accessibilityScore >= 95) {
      conformanceLevel = 'Full';
    } else if (accessibilityScore >= 70) {
      conformanceLevel = 'Partial';
    } else {
      conformanceLevel = 'Non-conformant';
    }

    res.json({
      domain: audit.target_domain,
      auditDate: audit.completed_at || audit.created_at,
      overallScore: accessibilityScore,
      conformanceLevel,
      standard: `WCAG ${audit.wcag_version || '2.2'} Level ${audit.wcag_level || 'AA'}`,
      issuesByCategory,
      totalIssues,
      pagesAudited,
      categoriesChecked,
    });
  } catch (error) {
    console.error('Get statement data error:', error);
    res.status(500).json({
      error: 'Failed to generate statement data',
      code: 'GET_STATEMENT_DATA_FAILED',
    });
  }
});

/**
 * GET /api/audits/:id/content-quality
 * Get Content Quality Score (CQS) breakdown for an audit
 * Tier-gated: free sees cqsScore only, starter sees breakdown, pro+ sees all
 */
router.get('/:id/content-quality', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const auditId = req.params.id;

    // Verify audit ownership
    const auditResult = await pool.query<AuditJob>(
      `SELECT id, cqs_score, user_id FROM audit_jobs WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({ error: 'Audit not found', code: 'AUDIT_NOT_FOUND' });
      return;
    }

    const audit = auditResult.rows[0];

    // Determine user tier
    const tierLimits = await getUserTierLimits(userId);
    const tier = (tierLimits as any)?.tier || 'free';

    // Free tier: CQS score only
    if (tier === 'free') {
      res.json({ cqsScore: audit.cqs_score });
      return;
    }

    // Fetch page-level data for breakdown calculation
    const pagesResult = await pool.query<{
      url: string;
      depth: number;
      cqs_score: number | null;
      content_quality_score: number | null;
      content_readability_score: number | null;
      content_structure_score: number | null;
      content_engagement_score: number | null;
      eeat_score: number | null;
      word_count: number | null;
    }>(`
      SELECT url, depth, cqs_score,
        content_quality_score, content_readability_score,
        content_structure_score, content_engagement_score,
        eeat_score, word_count
      FROM audit_pages
      WHERE audit_job_id = $1 AND crawl_status = 'crawled' AND cqs_score IS NOT NULL
      ORDER BY depth ASC, cqs_score DESC
    `, [auditId]);

    // Calculate overall breakdown averages
    const pages = pagesResult.rows;
    const avg = (key: string) => {
      const vals = pages.map((p: any) => p[key]).filter((v: any) => v !== null);
      if (vals.length === 0) return null;
      return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
    };

    const breakdown = {
      quality: avg('content_quality_score'),
      eeat: avg('eeat_score'),
      readability: avg('content_readability_score'),
      engagement: avg('content_engagement_score'),
      structure: avg('content_structure_score'),
    };

    // Generate summary text
    const cqs = audit.cqs_score ?? 0;
    const lowest = Object.entries(breakdown)
      .filter(([, v]) => v !== null)
      .sort(([, a], [, b]) => (a as number) - (b as number));
    const weakAreas = lowest.slice(0, 2).map(([k]) => {
      const labels: Record<string, string> = {
        quality: 'content quality',
        eeat: 'E-E-A-T',
        readability: 'readability',
        engagement: 'engagement',
        structure: 'content structure',
      };
      return labels[k] || k;
    });

    let summary: string;
    if (cqs >= 80) {
      summary = `Your content quality is strong.${weakAreas.length > 0 ? ` ${weakAreas.join(' and ')} are the main areas for further improvement.` : ''}`;
    } else if (cqs >= 60) {
      summary = `Your content quality is good.${weakAreas.length > 0 ? ` ${weakAreas.join(' and ')} are the main areas for improvement.` : ''}`;
    } else if (cqs >= 40) {
      summary = `Your content quality needs attention.${weakAreas.length > 0 ? ` Focus on improving ${weakAreas.join(' and ')}.` : ''}`;
    } else {
      summary = `Your content quality is poor.${weakAreas.length > 0 ? ` Prioritise ${weakAreas.join(' and ')} for the biggest gains.` : ''}`;
    }

    // Starter tier: breakdown only (no pages)
    if (tier === 'starter') {
      res.json({
        cqsScore: audit.cqs_score,
        breakdown,
        summary,
      });
      return;
    }

    // Pro+ tiers: full response with pages
    res.json({
      cqsScore: audit.cqs_score,
      breakdown,
      pages: pages.map(p => ({
        url: p.url,
        cqs: p.cqs_score,
        depth: p.depth,
        quality: p.content_quality_score,
        eeat: p.eeat_score,
        readability: p.content_readability_score,
        engagement: p.content_engagement_score,
        structure: p.content_structure_score,
        wordCount: p.word_count,
      })),
      summary,
    });
  } catch (error) {
    console.error('Get content quality error:', error);
    res.status(500).json({
      error: 'Failed to get content quality data',
      code: 'GET_CONTENT_QUALITY_FAILED',
    });
  }
});

export const auditsRouter = router;
