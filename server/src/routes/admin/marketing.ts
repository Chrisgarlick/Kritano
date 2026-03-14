/**
 * Admin Marketing Routes
 *
 * CRUD for marketing campaigns and social content.
 * Mounted at /api/admin/marketing
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { logAdminActivity, type AdminRequest } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listContent,
  getContentStats,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  updateContentStatus,
} from '../../services/marketing.service.js';

const router = Router();

// =============================================
// Campaign Endpoints
// =============================================

const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/admin/marketing/campaigns
 */
router.get('/campaigns', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await listCampaigns();
    res.json(result);
  } catch (error) {
    console.error('Admin list marketing campaigns error:', error);
    res.status(500).json({ error: 'Failed to list campaigns', code: 'LIST_CAMPAIGNS_ERROR' });
  }
});

/**
 * POST /api/admin/marketing/campaigns
 */
router.post(
  '/campaigns',
  validateBody(campaignSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const campaign = await createCampaign(req.body, req.admin!.id);

      await logAdminActivity(
        req.admin!.id,
        'create_marketing_campaign',
        'marketing_campaign',
        campaign.id,
        { name: campaign.name },
        req
      );

      res.status(201).json({ campaign });
    } catch (error) {
      console.error('Admin create marketing campaign error:', error);
      res.status(500).json({ error: 'Failed to create campaign', code: 'CREATE_CAMPAIGN_ERROR' });
    }
  }
);

/**
 * PATCH /api/admin/marketing/campaigns/:id
 */
router.patch(
  '/campaigns/:id',
  validateBody(campaignSchema.partial()),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const campaign = await updateCampaign(req.params.id, req.body);

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'update_marketing_campaign',
        'marketing_campaign',
        req.params.id,
        req.body,
        req
      );

      res.json({ campaign });
    } catch (error) {
      console.error('Admin update marketing campaign error:', error);
      res.status(500).json({ error: 'Failed to update campaign', code: 'UPDATE_CAMPAIGN_ERROR' });
    }
  }
);

/**
 * DELETE /api/admin/marketing/campaigns/:id
 */
router.delete('/campaigns/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await deleteCampaign(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'delete_marketing_campaign',
      'marketing_campaign',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete marketing campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign', code: 'DELETE_CAMPAIGN_ERROR' });
  }
});

// =============================================
// Content Endpoints
// =============================================

const VALID_PLATFORMS = ['twitter', 'linkedin', 'instagram', 'facebook', 'threads', 'other'] as const;
const VALID_STATUSES = ['draft', 'ready', 'posted', 'archived'] as const;

const contentSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  title: z.string().max(200).optional(),
  body: z.string().min(1),
  media: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  week_number: z.number().int().min(1).max(52).nullable().optional(),
  day_of_week: z.number().int().min(1).max(7).nullable().optional(),
});

/**
 * GET /api/admin/marketing/content
 */
router.get('/content', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const platform = req.query.platform as string | undefined;
    const campaign_id = req.query.campaign_id as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const week_number = req.query.week_number ? parseInt(req.query.week_number as string) : undefined;
    const day_of_week = req.query.day_of_week ? parseInt(req.query.day_of_week as string) : undefined;

    const result = await listContent({ platform, campaign_id, status, search, week_number, day_of_week, page, limit });

    res.json({
      content: result.content,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list marketing content error:', error);
    res.status(500).json({ error: 'Failed to list content', code: 'LIST_CONTENT_ERROR' });
  }
});

/**
 * GET /api/admin/marketing/content/stats
 */
router.get('/content/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getContentStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin marketing content stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'CONTENT_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/marketing/content/:id
 */
router.get('/content/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const item = await getContent(req.params.id);

    if (!item) {
      res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
      return;
    }

    res.json({ content: item });
  } catch (error) {
    console.error('Admin get marketing content error:', error);
    res.status(500).json({ error: 'Failed to get content', code: 'GET_CONTENT_ERROR' });
  }
});

/**
 * POST /api/admin/marketing/content
 */
router.post(
  '/content',
  validateBody(contentSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const item = await createContent(req.body, req.admin!.id);

      await logAdminActivity(
        req.admin!.id,
        'create_marketing_content',
        'marketing_content',
        item.id,
        { platform: item.platform, title: item.title },
        req
      );

      res.status(201).json({ content: item });
    } catch (error) {
      console.error('Admin create marketing content error:', error);
      res.status(500).json({ error: 'Failed to create content', code: 'CREATE_CONTENT_ERROR' });
    }
  }
);

/**
 * PATCH /api/admin/marketing/content/:id
 */
router.patch(
  '/content/:id',
  validateBody(contentSchema.partial()),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const item = await updateContent(req.params.id, req.body);

      if (!item) {
        res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'update_marketing_content',
        'marketing_content',
        req.params.id,
        { platform: item.platform },
        req
      );

      res.json({ content: item });
    } catch (error) {
      console.error('Admin update marketing content error:', error);
      res.status(500).json({ error: 'Failed to update content', code: 'UPDATE_CONTENT_ERROR' });
    }
  }
);

/**
 * DELETE /api/admin/marketing/content/:id
 */
router.delete('/content/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await deleteContent(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'delete_marketing_content',
      'marketing_content',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete marketing content error:', error);
    res.status(500).json({ error: 'Failed to delete content', code: 'DELETE_CONTENT_ERROR' });
  }
});

/**
 * PATCH /api/admin/marketing/content/:id/status
 */
const statusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

router.patch(
  '/content/:id/status',
  validateBody(statusSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const item = await updateContentStatus(req.params.id, req.body.status);

      if (!item) {
        res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'update_marketing_content_status',
        'marketing_content',
        req.params.id,
        { status: req.body.status },
        req
      );

      res.json({ content: item });
    } catch (error) {
      console.error('Admin update marketing content status error:', error);
      res.status(500).json({ error: 'Failed to update status', code: 'UPDATE_STATUS_ERROR' });
    }
  }
);

export { router as adminMarketingRouter };
