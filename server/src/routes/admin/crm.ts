/**
 * Admin CRM Routes
 *
 * Lead management: scoring, board, profiles, triggers, outreach.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import type { AdminRequest } from '../../middleware/admin.middleware.js';
import { logAdminActivity } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  getLeadBoard,
  getLeadProfile,
  getLeadTimeline,
  getLeadMemberships,
  getLeadStats,
  recalculateScore,
} from '../../services/lead-scoring.service.js';
import type { LeadStatus } from '../../services/lead-scoring.service.js';
import {
  getPendingTriggers,
  actionTrigger,
  getTriggerStats,
} from '../../services/crm-trigger.service.js';
import type { TriggerStatus, TriggerType } from '../../services/crm-trigger.service.js';
import { sendTemplate } from '../../services/email-template.service.js';
import { pool } from '../../db/index.js';

const router = Router();

// =============================================
// Lead Board
// =============================================

/**
 * GET /api/admin/crm/leads
 * Paginated lead board with filtering and sorting.
 */
router.get('/leads', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await getLeadBoard({
      status: req.query.status as LeadStatus | undefined,
      search: req.query.search as string | undefined,
      sort: (req.query.sort as 'lead_score' | 'created_at' | 'last_login_at') || 'lead_score',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    res.json({
      leads: result.leads,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get leads error:', error);
    res.status(500).json({ error: 'Failed to get leads', code: 'GET_LEADS_ERROR' });
  }
});

/**
 * GET /api/admin/crm/leads/:userId
 * Full lead profile.
 */
router.get('/leads/:userId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const profile = await getLeadProfile(req.params.userId);
    if (!profile) {
      res.status(404).json({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' });
      return;
    }

    const [timeline, memberships] = await Promise.all([
      getLeadTimeline(req.params.userId),
      getLeadMemberships(req.params.userId),
    ]);

    // Get outreach history
    const outreach = await pool.query(
      `SELECT es.id, es.template_id, es.subject, es.status, es.created_at,
              et.name as template_name, et.slug as template_slug,
              admin.email as sent_by_email
       FROM email_sends es
       LEFT JOIN email_templates et ON es.template_id = et.id
       LEFT JOIN users admin ON es.sent_by = admin.id
       WHERE es.user_id = $1
       ORDER BY es.created_at DESC
       LIMIT 50`,
      [req.params.userId]
    );

    res.json({
      lead: profile,
      timeline,
      memberships,
      outreach: outreach.rows,
    });
  } catch (error) {
    console.error('Admin get lead profile error:', error);
    res.status(500).json({ error: 'Failed to get lead profile', code: 'GET_LEAD_ERROR' });
  }
});

/**
 * POST /api/admin/crm/leads/:userId/recalc
 * Force recalculate lead score.
 */
router.post('/leads/:userId/recalc', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await recalculateScore(req.params.userId);

    await logAdminActivity(
      req.admin!.id,
      'recalculate_lead_score',
      'user',
      req.params.userId,
      { newScore: result.score, newStatus: result.status },
      req
    );

    res.json({ score: result.score, status: result.status });
  } catch (error) {
    console.error('Admin recalc score error:', error);
    res.status(500).json({ error: 'Failed to recalculate score', code: 'RECALC_ERROR' });
  }
});

/**
 * GET /api/admin/crm/stats
 * Lead funnel stats by status.
 */
router.get('/stats', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getLeadStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin get CRM stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'GET_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/crm/leads/:userId/memberships
 * Get sites & roles for a lead.
 */
router.get('/leads/:userId/memberships', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const memberships = await getLeadMemberships(req.params.userId);
    res.json({ memberships });
  } catch (error) {
    console.error('Admin get memberships error:', error);
    res.status(500).json({ error: 'Failed to get memberships', code: 'GET_MEMBERSHIPS_ERROR' });
  }
});

// =============================================
// Triggers
// =============================================

/**
 * GET /api/admin/crm/triggers
 * Paginated trigger list.
 */
router.get('/triggers', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await getPendingTriggers({
      status: (req.query.status as TriggerStatus) || undefined,
      type: req.query.type as TriggerType | undefined,
      userId: req.query.userId as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    res.json({
      triggers: result.triggers,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get triggers error:', error);
    res.status(500).json({ error: 'Failed to get triggers', code: 'GET_TRIGGERS_ERROR' });
  }
});

const actionTriggerSchema = z.object({
  status: z.enum(['sent', 'dismissed', 'actioned']),
});

/**
 * PATCH /api/admin/crm/triggers/:id
 * Action a trigger (sent, dismissed, actioned).
 */
router.patch(
  '/triggers/:id',
  validateBody(actionTriggerSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const trigger = await actionTrigger(req.params.id, req.admin!.id, req.body.status);
      if (!trigger) {
        res.status(404).json({ error: 'Trigger not found', code: 'TRIGGER_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'action_crm_trigger',
        'crm_trigger',
        req.params.id,
        { action: req.body.status, triggerType: trigger.trigger_type },
        req
      );

      res.json({ trigger });
    } catch (error) {
      console.error('Admin action trigger error:', error);
      res.status(500).json({ error: 'Failed to action trigger', code: 'ACTION_TRIGGER_ERROR' });
    }
  }
);

/**
 * GET /api/admin/crm/triggers/stats
 * Trigger counts by type and status.
 */
router.get('/triggers/stats', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getTriggerStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin get trigger stats error:', error);
    res.status(500).json({ error: 'Failed to get trigger stats', code: 'GET_TRIGGER_STATS_ERROR' });
  }
});

// =============================================
// Outreach
// =============================================

const outreachSchema = z.object({
  templateSlug: z.string().min(1),
  variables: z.record(z.string()).optional(),
});

/**
 * POST /api/admin/crm/outreach/:userId
 * Send an outreach email to a user using a template.
 */
router.post(
  '/outreach/:userId',
  validateBody(outreachSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      // Check daily outreach limit (max 50 per admin per day)
      const dailySends = await pool.query(
        `SELECT COUNT(*) as count FROM email_sends
         WHERE sent_by = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
        [req.admin!.id]
      );
      if (parseInt(dailySends.rows[0].count) >= 50) {
        res.status(429).json({ error: 'Daily outreach limit reached (50 per day)', code: 'OUTREACH_LIMIT' });
        return;
      }

      // Get user info
      const userResult = await pool.query(
        `SELECT id, email, first_name FROM users WHERE id = $1`,
        [req.params.userId]
      );
      if (userResult.rows.length === 0) {
        res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        return;
      }

      const user = userResult.rows[0];

      await sendTemplate({
        templateSlug: req.body.templateSlug,
        to: {
          userId: user.id,
          email: user.email,
          firstName: user.first_name || 'there',
        },
        variables: req.body.variables || {},
        sentBy: req.admin!.id,
      });

      await logAdminActivity(
        req.admin!.id,
        'send_outreach',
        'user',
        req.params.userId,
        { templateSlug: req.body.templateSlug },
        req
      );

      res.json({ success: true, sentTo: user.email });
    } catch (error) {
      console.error('Admin outreach send error:', error);
      res.status(500).json({ error: 'Failed to send outreach email', code: 'OUTREACH_ERROR' });
    }
  }
);

/**
 * GET /api/admin/crm/outreach
 * Outreach history (optionally filtered by userId).
 */
router.get('/outreach', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (userId) {
      conditions.push(`es.user_id = $${paramIdx++}`);
      params.push(userId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT es.id, es.template_id, es.user_id, es.subject, es.status, es.created_at,
                et.name as template_name, et.slug as template_slug,
                u.email as user_email, u.first_name as user_first_name,
                admin.email as sent_by_email
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         LEFT JOIN users u ON es.user_id = u.id
         LEFT JOIN users admin ON es.sent_by = admin.id
         ${where}
         ORDER BY es.created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM email_sends es ${where}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0].count) || 0;

    res.json({
      sends: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get outreach history error:', error);
    res.status(500).json({ error: 'Failed to get outreach history', code: 'GET_OUTREACH_ERROR' });
  }
});

export { router as adminCrmRouter };
