import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getUserTierLimits } from '../../services/site.service.js';
import { pool } from '../../db/index.js';
import {
  generateGscAuthUrl,
  handleGscCallback,
  getConnection,
  getConnectionsByUser,
  disconnectGsc,
  getTopQueries,
  getTopPages,
  getQueryTrend,
  getOverviewStats,
  getOverviewTrend,
  getCtrOpportunities,
  getCannibalisation,
  getPageKeywords,
  syncQueryData,
} from '../../services/gsc.service.js';

const router = Router();

// All GSC routes require authentication
router.use(authenticate);

// ========== Verified Domains ==========

// Get user's verified sites (for the connect dropdown)
router.get('/domains', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.domain, s.verified
       FROM sites s
       WHERE s.owner_id = $1 AND s.verified = TRUE
       ORDER BY s.domain ASC`,
      [req.user!.id]
    );
    res.json({ domains: result.rows });
  } catch (error) {
    console.error('GSC domains list error:', error);
    res.status(500).json({ error: 'Failed to list domains' });
  }
});

// ========== Connection Management ==========

// Get all GSC connections for the current user
router.get('/connections', async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await getConnectionsByUser(req.user!.id);
    res.json({ connections });
  } catch (error) {
    console.error('GSC connections list error:', error);
    res.status(500).json({ error: 'Failed to list connections' });
  }
});

// Get GSC connection for a specific domain
router.get('/connections/:siteId', async (req: Request, res: Response): Promise<void> => {
  try {
    const connection = await getConnection(req.params.siteId);
    res.json({ connection });
  } catch (error) {
    console.error('GSC connection error:', error);
    res.status(500).json({ error: 'Failed to get connection' });
  }
});

// Generate OAuth URL to connect GSC
router.post('/connect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteId } = z.object({ siteId: z.string().uuid() }).parse(req.body);

    // Check tier limits (NULL = unlimited for enterprise)
    const limits = await getUserTierLimits(req.user!.id);
    const gscProperties = limits?.gsc_properties as number | null;

    if (gscProperties === 0) {
      res.status(403).json({ error: 'Search Console integration is not available on your current plan.' });
      return;
    }

    // Check current connection count (skip if NULL = unlimited)
    if (gscProperties !== null) {
      const connections = await getConnectionsByUser(req.user!.id);
      if (connections.length >= gscProperties) {
        res.status(403).json({
          error: `Your plan allows ${gscProperties} Search Console connection${gscProperties === 1 ? '' : 's'}. Please disconnect one first.`,
        });
        return;
      }
    }

    const { url, state } = generateGscAuthUrl(siteId);
    res.json({ url, state });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid domain ID' });
      return;
    }
    console.error('GSC connect error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle OAuth callback
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, siteId } = z.object({
      code: z.string().min(1),
      siteId: z.string().uuid(),
    }).parse(req.body);

    const result = await handleGscCallback(code, siteId, req.user!.id);
    res.json({
      success: true,
      connectionId: result.connectionId,
      property: result.property,
    });
  } catch (error: any) {
    console.error('GSC callback error:', error);
    res.status(400).json({ error: error.message || 'Failed to connect Search Console' });
  }
});

// Disconnect GSC
router.delete('/connections/:siteId', async (req: Request, res: Response): Promise<void> => {
  try {
    await disconnectGsc(req.params.siteId, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('GSC disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Trigger manual sync
router.post('/connections/:connectionId/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionId = req.params.connectionId;

    // Check if this connection has any data - if not, do a full 90-day backfill
    const dataCheck = await pool.query(
      `SELECT COUNT(*) as cnt FROM gsc_query_data WHERE connection_id = $1 LIMIT 1`,
      [connectionId]
    );
    const hasData = parseInt(dataCheck.rows[0].cnt, 10) > 0;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (hasData ? 7 : 90));

    const format = (d: Date) => d.toISOString().split('T')[0];
    console.log(`GSC manual sync: ${format(startDate)} to ${format(endDate)}${!hasData ? ' (backfill)' : ''}`);
    const rows = await syncQueryData(connectionId, format(startDate), format(endDate));
    res.json({ success: true, rowsSynced: rows });
  } catch (error: any) {
    console.error('GSC manual sync error:', error);
    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

// ========== Analytics Endpoints ==========

// Overview stats
router.get('/data/:connectionId/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 28, 365);
    const [stats, trend] = await Promise.all([
      getOverviewStats(req.params.connectionId, days),
      getOverviewTrend(req.params.connectionId, days),
    ]);
    res.json({ stats, trend });
  } catch (error) {
    console.error('GSC overview error:', error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// Top queries
router.get('/data/:connectionId/queries', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getTopQueries({
      connectionId: req.params.connectionId,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      device: req.query.device as string,
      country: req.query.country as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as any,
      sortDir: req.query.sortDir as any,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json(result);
  } catch (error) {
    console.error('GSC queries error:', error);
    res.status(500).json({ error: 'Failed to get queries' });
  }
});

// Top pages
router.get('/data/:connectionId/pages', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getTopPages({
      connectionId: req.params.connectionId,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      device: req.query.device as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as any,
      sortDir: req.query.sortDir as any,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
      offset: parseInt(req.query.offset as string) || 0,
    });
    res.json(result);
  } catch (error) {
    console.error('GSC pages error:', error);
    res.status(500).json({ error: 'Failed to get pages' });
  }
});

// Query trend
router.get('/data/:connectionId/queries/:query/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 28, 365);
    const trend = await getQueryTrend(req.params.connectionId, decodeURIComponent(req.params.query), days);
    res.json({ trend });
  } catch (error) {
    console.error('GSC query trend error:', error);
    res.status(500).json({ error: 'Failed to get trend' });
  }
});

// CTR opportunities
router.get('/data/:connectionId/opportunities', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 28, 365);
    const opportunities = await getCtrOpportunities(req.params.connectionId, days);
    res.json({ opportunities });
  } catch (error) {
    console.error('GSC opportunities error:', error);
    res.status(500).json({ error: 'Failed to get opportunities' });
  }
});

// Cannibalisation detection
router.get('/data/:connectionId/cannibalisation', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 28, 365);
    const results = await getCannibalisation(req.params.connectionId, days);
    res.json({ cannibalisation: results });
  } catch (error) {
    console.error('GSC cannibalisation error:', error);
    res.status(500).json({ error: 'Failed to detect cannibalisation' });
  }
});

// Page keywords (for a specific URL)
router.get('/data/:connectionId/page-keywords', async (req: Request, res: Response): Promise<void> => {
  try {
    const pageUrl = req.query.url as string;
    if (!pageUrl) {
      res.status(400).json({ error: 'url parameter is required' });
      return;
    }
    const days = Math.min(parseInt(req.query.days as string) || 28, 365);
    const keywords = await getPageKeywords(req.params.connectionId, pageUrl, days);
    res.json({ keywords });
  } catch (error) {
    console.error('GSC page keywords error:', error);
    res.status(500).json({ error: 'Failed to get page keywords' });
  }
});

export const gscRouter = router;
