import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  getReferralStats,
  getUserReferrals,
  getOrCreateReferralCode,
  sendInviteEmails,
} from '../../services/referral.service.js';

const router = Router();

// All referral routes require authentication
router.use(authenticate);

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * GET /api/referrals/code
 * Get or generate referral code and link
 */
router.get('/code', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = await getOrCreateReferralCode(req.user!.id);
    res.json({
      code,
      link: `${APP_URL}/register?ref=${code}`,
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: 'Failed to get referral code', code: 'REFERRAL_CODE_ERROR' });
  }
});

/**
 * GET /api/referrals/stats
 * Get user's referral stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getReferralStats(req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats', code: 'REFERRAL_STATS_ERROR' });
  }
});

/**
 * GET /api/referrals/list
 * Get paginated referral list
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await getUserReferrals(req.user!.id, page, limit);
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
    console.error('List referrals error:', error);
    res.status(500).json({ error: 'Failed to list referrals', code: 'REFERRAL_LIST_ERROR' });
  }
});

const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(5),
});

/**
 * POST /api/referrals/invite
 * Send invite emails (max 5 per request)
 */
router.post(
  '/invite',
  validateBody(inviteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { emails } = req.body;
      const result = await sendInviteEmails(req.user!.id, emails);
      res.json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      console.error('Send invite error:', error);
      res.status(statusCode).json({ error: error.message || 'Failed to send invites', code: 'INVITE_ERROR' });
    }
  }
);

export const referralsRouter = router;
