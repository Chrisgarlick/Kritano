import { Router } from 'express';
import type { Response } from 'express';
import { type AdminRequest, logAdminActivity } from '../../middleware/admin.middleware.js';
import {
  getEarlyAccessStatus,
  getChannelBreakdown,
  getEarlyAccessUsers,
  activateAll,
} from '../../services/early-access.service.js';

const router = Router();

/**
 * GET /api/admin/early-access/stats
 * Get early access campaign statistics
 */
router.get('/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const [status, channels] = await Promise.all([
      getEarlyAccessStatus(),
      getChannelBreakdown(),
    ]);

    res.json({
      ...status,
      channels,
    });
  } catch (error) {
    console.error('Admin early access stats error:', error);
    res.status(500).json({ error: 'Failed to get early access stats', code: 'EA_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/early-access/users
 * Get paginated list of early access users
 */
router.get('/users', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = req.query.search as string | undefined;

    const result = await getEarlyAccessUsers(page, limit, search);

    res.json({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin early access users error:', error);
    res.status(500).json({ error: 'Failed to get early access users', code: 'EA_USERS_ERROR' });
  }
});

/**
 * POST /api/admin/early-access/activate
 * Activate all early access users (start their 30-day Agency trial)
 */
router.post('/activate', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await activateAll(req.admin!.id);

    await logAdminActivity(
      req.admin!.id,
      'activate_early_access',
      'system',
      'early_access',
      { activated: result.activated, skipped: result.skipped },
      req
    );

    res.json({
      success: true,
      activated: result.activated,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Admin early access activate error:', error);
    res.status(500).json({ error: 'Failed to activate early access users', code: 'EA_ACTIVATE_ERROR' });
  }
});

/**
 * GET /api/admin/early-access/users/export
 * Export early access users as CSV
 */
router.get('/users/export', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await getEarlyAccessUsers(1, 10000);

    const csvRows = [
      'Email,First Name,Last Name,Channel,Email Verified,Activated At,Registered At',
      ...result.users.map((u) =>
        [
          u.email,
          u.firstName,
          u.lastName,
          u.channel,
          u.emailVerified ? 'Yes' : 'No',
          u.activatedAt || '',
          u.createdAt,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];

    await logAdminActivity(
      req.admin!.id,
      'export_early_access_users',
      'system',
      'early_access',
      { count: result.users.length },
      req
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="early-access-users.csv"');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Admin early access export error:', error);
    res.status(500).json({ error: 'Failed to export early access users', code: 'EA_EXPORT_ERROR' });
  }
});

export const adminEarlyAccessRouter = router;
