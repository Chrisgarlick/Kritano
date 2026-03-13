import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loadSite, type SiteRequest } from '../../middleware/site.middleware.js';
import {
  getSiteScoreHistory,
  getIssueTrends,
  compareAudits,
  compareSites,
  getUserOverview,
  getUrlScoreHistory,
  getUrlAnalytics,
  getUserAuditedUrls,
  compareUrls,
  setPool as setAnalyticsPool,
} from '../../services/analytics.service.js';
import { Pool } from 'pg';
import type { TimeRange, GroupBy } from '../../types/analytics.types.js';

const router = Router();
let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
  setAnalyticsPool(dbPool);
}

// All routes require authentication
router.use(authenticate);

// =============================================
// USER OVERVIEW
// =============================================

/**
 * GET /api/analytics/overview
 * Get user-centric analytics overview
 */
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const overview = await getUserOverview(userId);
    res.json(overview);
  } catch (error: any) {
    console.error('Get user overview error:', error);
    res.status(500).json({ error: 'Failed to get analytics overview' });
  }
});

// =============================================
// SITE ANALYTICS
// =============================================

/**
 * GET /api/analytics/sites/:siteId/scores
 * Get score history for a specific site
 */
router.get('/sites/:siteId/scores', loadSite, async (req: Request, res: Response): Promise<void> => {
  try {
    const siteReq = req as SiteRequest;
    const siteId = siteReq.siteId!;
    const { range, from, to } = req.query;

    const options: Parameters<typeof getSiteScoreHistory>[0] = {
      siteId,
      range: (range as TimeRange) || '30d',
    };

    if (from && to) {
      options.from = new Date(from as string);
      options.to = new Date(to as string);
    }

    const history = await getSiteScoreHistory(options);
    res.json(history);
  } catch (error: any) {
    console.error('Get site scores error:', error);
    res.status(500).json({ error: 'Failed to get score history' });
  }
});

/**
 * GET /api/analytics/sites/:siteId/issues
 * Get issue trends for a specific site
 */
router.get('/sites/:siteId/issues', loadSite, async (req: Request, res: Response): Promise<void> => {
  try {
    const siteReq = req as SiteRequest;
    const siteId = siteReq.siteId!;
    const { range, groupBy } = req.query;

    const trends = await getIssueTrends({
      siteId,
      range: (range as TimeRange) || '30d',
      groupBy: (groupBy as GroupBy) || 'week',
    });

    res.json(trends);
  } catch (error: any) {
    console.error('Get issue trends error:', error);
    res.status(500).json({ error: 'Failed to get issue trends' });
  }
});

// =============================================
// URL ANALYTICS
// =============================================

/**
 * GET /api/analytics/sites/:siteId/urls/:urlId
 * Get full analytics for a specific URL
 */
router.get('/sites/:siteId/urls/:urlId', loadSite, async (req: Request, res: Response): Promise<void> => {
  try {
    const siteReq = req as SiteRequest;
    const siteId = siteReq.siteId!;
    const { urlId } = req.params;

    // Verify URL belongs to site
    const urlCheck = await pool.query(
      'SELECT id FROM site_urls WHERE id = $1 AND site_id = $2',
      [urlId, siteId]
    );

    if (urlCheck.rows.length === 0) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    const analytics = await getUrlAnalytics(urlId, siteId);
    res.json(analytics);
  } catch (error: any) {
    console.error('Get URL analytics error:', error);
    if (error.message === 'URL not found') {
      res.status(404).json({ error: 'URL not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to get URL analytics' });
  }
});

/**
 * GET /api/analytics/sites/:siteId/urls/:urlId/scores
 * Get score history for a specific URL
 */
router.get('/sites/:siteId/urls/:urlId/scores', loadSite, async (req: Request, res: Response): Promise<void> => {
  try {
    const siteReq = req as SiteRequest;
    const siteId = siteReq.siteId!;
    const { urlId } = req.params;
    const { range, from, to } = req.query;

    // Verify URL belongs to site
    const urlCheck = await pool.query(
      'SELECT id FROM site_urls WHERE id = $1 AND site_id = $2',
      [urlId, siteId]
    );

    if (urlCheck.rows.length === 0) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    const options: Parameters<typeof getUrlScoreHistory>[0] = {
      urlId,
      range: (range as TimeRange) || '30d',
    };

    if (from && to) {
      options.from = new Date(from as string);
      options.to = new Date(to as string);
    }

    const history = await getUrlScoreHistory(options);
    res.json(history);
  } catch (error: any) {
    console.error('Get URL scores error:', error);
    res.status(500).json({ error: 'Failed to get URL score history' });
  }
});

// =============================================
// AUDIT COMPARISON
// =============================================

/**
 * GET /api/analytics/compare
 * Compare multiple audits
 */
router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { audits } = req.query;

    if (!audits || typeof audits !== 'string') {
      res.status(400).json({ error: 'audits parameter is required (comma-separated audit IDs)' });
      return;
    }

    const auditIds = audits.split(',').map(id => id.trim());

    if (auditIds.length < 2 || auditIds.length > 4) {
      res.status(400).json({ error: 'Comparison requires 2-4 audits' });
      return;
    }

    // Verify all audits belong to sites the user has access to
    const verifyResult = await pool.query(
      `SELECT aj.id
       FROM audit_jobs aj
       JOIN sites s ON s.id = aj.site_id
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE aj.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`,
      [auditIds, userId]
    );

    if (verifyResult.rows.length !== auditIds.length) {
      res.status(403).json({ error: 'One or more audits not found or not accessible' });
      return;
    }

    const comparison = await compareAudits(auditIds);
    res.json(comparison);
  } catch (error: any) {
    console.error('Compare audits error:', error);
    if (error.message.includes('requires')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to compare audits' });
  }
});

// =============================================
// SITE COMPARISON
// =============================================

/**
 * GET /api/analytics/compare-sites
 * Compare multiple sites
 */
router.get('/compare-sites', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sites } = req.query;

    if (!sites || typeof sites !== 'string') {
      res.status(400).json({ error: 'sites parameter is required (comma-separated site IDs)' });
      return;
    }

    const siteIds = sites.split(',').map(id => id.trim());

    if (siteIds.length < 2 || siteIds.length > 6) {
      res.status(400).json({ error: 'Comparison requires 2-6 sites' });
      return;
    }

    // Verify all sites belong to the user (owned or shared)
    const verifyResult = await pool.query(
      `SELECT s.id
       FROM sites s
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE s.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`,
      [siteIds, userId]
    );

    if (verifyResult.rows.length !== siteIds.length) {
      res.status(403).json({ error: 'One or more sites not found or not accessible' });
      return;
    }

    const comparison = await compareSites(siteIds);
    res.json(comparison);
  } catch (error: any) {
    console.error('Compare sites error:', error);
    if (error.message.includes('requires')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to compare sites' });
  }
});

// =============================================
// USER AUDITED URLS (for URL comparison picker)
// =============================================

/**
 * GET /api/analytics/user-urls
 * Get all audited URLs across user's sites
 */
router.get('/user-urls', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, limit } = req.query;

    const urls = await getUserAuditedUrls(
      userId,
      search as string | undefined,
      limit ? parseInt(limit as string, 10) : undefined
    );
    res.json(urls);
  } catch (error: any) {
    console.error('Get user URLs error:', error);
    res.status(500).json({ error: 'Failed to get user URLs' });
  }
});

// =============================================
// URL COMPARISON
// =============================================

/**
 * GET /api/analytics/compare-urls
 * Compare two URLs side-by-side
 * Query: urls=siteId1:urlId1,siteId2:urlId2
 */
router.get('/compare-urls', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { urls } = req.query;

    if (!urls || typeof urls !== 'string') {
      res.status(400).json({ error: 'urls parameter is required (format: siteId1:urlId1,siteId2:urlId2)' });
      return;
    }

    const parts = urls.split(',').map(p => p.trim());
    if (parts.length !== 2) {
      res.status(400).json({ error: 'Exactly 2 URL specs are required' });
      return;
    }

    const urlSpecs = parts.map(part => {
      const [siteId, urlId] = part.split(':');
      return { siteId, urlId };
    });

    if (urlSpecs.some(s => !s.siteId || !s.urlId)) {
      res.status(400).json({ error: 'Invalid URL spec format. Use siteId:urlId' });
      return;
    }

    // Verify user has access to both sites
    const siteIds = urlSpecs.map(s => s.siteId);
    const verifyResult = await pool.query(
      `SELECT s.id
       FROM sites s
       LEFT JOIN site_shares ss ON ss.site_id = s.id AND ss.user_id = $2 AND ss.accepted_at IS NOT NULL
       WHERE s.id = ANY($1)
         AND (s.owner_id = $2 OR ss.id IS NOT NULL)`,
      [siteIds, userId]
    );

    const accessibleSiteIds = new Set(verifyResult.rows.map((r: any) => r.id));
    if (!siteIds.every(id => accessibleSiteIds.has(id))) {
      res.status(403).json({ error: 'One or more sites not found or not accessible' });
      return;
    }

    const comparison = await compareUrls(urlSpecs as [{ siteId: string; urlId: string }, { siteId: string; urlId: string }]);
    res.json(comparison);
  } catch (error: any) {
    console.error('Compare URLs error:', error);
    if (error.message?.includes('not found') || error.message?.includes('No audit data')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to compare URLs' });
  }
});

export default router;
