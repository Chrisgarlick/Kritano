import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { type AdminRequest, logAdminActivity } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  adminGetStats,
  adminListReferrals,
  adminVoidReferral,
  getConfig,
  updateConfig,
} from '../../services/referral.service.js';

const router = Router();

/**
 * GET /api/admin/referrals/stats
 * Program-wide referral statistics
 */
router.get('/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminGetStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats', code: 'ADMIN_REFERRAL_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/referrals
 * List all referrals with filters
 */
router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await adminListReferrals(page, limit, status, search);
    res.json({
      referrals: result.referrals,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list referrals error:', error);
    res.status(500).json({ error: 'Failed to list referrals', code: 'ADMIN_REFERRAL_LIST_ERROR' });
  }
});

const voidSchema = z.object({
  reason: z.string().min(1).max(500),
});

/**
 * POST /api/admin/referrals/:id/void
 * Void a referral and reverse rewards
 */
router.post(
  '/:id/void',
  validateBody(voidSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { reason } = req.body;
      const referral = await adminVoidReferral(req.params.id, reason, req.admin!.id);

      await logAdminActivity(
        req.admin!.id,
        'void_referral',
        'referral',
        req.params.id,
        { reason },
        req
      );

      res.json({ referral });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      console.error('Admin void referral error:', error);
      res.status(statusCode).json({ error: error.message || 'Failed to void referral', code: 'ADMIN_VOID_REFERRAL_ERROR' });
    }
  }
);

/**
 * GET /api/admin/referrals/config
 * Get referral config
 */
router.get('/config', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const config = await getConfig();
    res.json({ config });
  } catch (error) {
    console.error('Admin referral config error:', error);
    res.status(500).json({ error: 'Failed to get config', code: 'ADMIN_REFERRAL_CONFIG_ERROR' });
  }
});

const configSchema = z.object({
  key: z.enum(['enabled', 'max_referrals_per_month', 'rewards']),
  value: z.unknown(),
});

/**
 * PATCH /api/admin/referrals/config
 * Update referral config
 */
router.patch(
  '/config',
  validateBody(configSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { key, value } = req.body;
      await updateConfig(key, value);

      await logAdminActivity(
        req.admin!.id,
        'update_referral_config',
        'referral_config',
        key,
        { value },
        req
      );

      const config = await getConfig();
      res.json({ config });
    } catch (error) {
      console.error('Admin update referral config error:', error);
      res.status(500).json({ error: 'Failed to update config', code: 'ADMIN_REFERRAL_CONFIG_UPDATE_ERROR' });
    }
  }
);

export const adminReferralsRouter = router;
