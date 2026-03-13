/**
 * Admin Analytics Routes — Phase 6
 *
 * Funnel analytics, global trends, and revenue dashboard.
 */

import { Router } from 'express';
import type { Response } from 'express';
import type { AdminRequest } from '../../middleware/admin.middleware.js';
import {
  getFunnelAnalytics,
  getGlobalTrends,
  getRevenueAnalytics,
} from '../../services/admin-analytics.service.js';

const router = Router();

/**
 * GET /api/admin/analytics/funnel?range=30d
 * Conversion funnel: Registered → Verified → First Audit → Domain Verified → Paid
 */
router.get('/funnel', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const range = (req.query.range as string) || '30d';
    const data = await getFunnelAnalytics(range);
    res.json(data);
  } catch (error) {
    console.error('Admin funnel analytics error:', error);
    res.status(500).json({ error: 'Failed to load funnel analytics', code: 'FUNNEL_ERROR' });
  }
});

/**
 * GET /api/admin/analytics/trends?range=30d
 * Global audit trends: top issues, score distribution, tier breakdown
 */
router.get('/trends', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const range = (req.query.range as string) || '30d';
    const data = await getGlobalTrends(range);
    res.json(data);
  } catch (error) {
    console.error('Admin trends analytics error:', error);
    res.status(500).json({ error: 'Failed to load trends analytics', code: 'TRENDS_ERROR' });
  }
});

/**
 * GET /api/admin/analytics/revenue
 * Revenue dashboard: MRR/ARR by tier, churn, new subscribers
 */
router.get('/revenue', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = await getRevenueAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Admin revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to load revenue analytics', code: 'REVENUE_ERROR' });
  }
});

export { router as adminAnalyticsRouter };
