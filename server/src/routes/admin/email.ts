/**
 * Admin Email Routes
 *
 * Template management: CRUD, preview, test send, duplicate.
 * Campaign management: CRUD, lifecycle, audience preview, sends.
 * Analytics: aggregate delivery stats, per-template performance.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import type { AdminRequest } from '../../middleware/admin.middleware.js';
import { logAdminActivity } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  renderPreview,
  sendTemplate,
} from '../../services/email-template.service.js';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  launchCampaign,
  scheduleCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getAudienceCount,
  getCampaignSends,
  getEmailSends,
  getEmailAnalytics,
  getTemplatePerformance,
} from '../../services/email-campaign.service.js';
import type { TemplateCategory, BrandingMode } from '../../types/email-template.types.js';
import type { CampaignStatus } from '../../types/email-campaign.types.js';

const router = Router();

// =============================================
// Template Management
// =============================================

/**
 * GET /api/admin/email/templates
 * List all email templates.
 */
router.get('/templates', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const category = req.query.category as TemplateCategory | undefined;
    const is_system = req.query.is_system === 'true' ? true : req.query.is_system === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await listTemplates({ category, is_system, search, page, limit });

    res.json({
      templates: result.templates,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list templates error:', error);
    res.status(500).json({ error: 'Failed to list templates', code: 'LIST_TEMPLATES_ERROR' });
  }
});

/**
 * GET /api/admin/email/templates/:id
 * Get a single template with blocks and preview.
 */
router.get('/templates/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const template = await getTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
      return;
    }
    res.json({ template });
  } catch (error) {
    console.error('Admin get template error:', error);
    res.status(500).json({ error: 'Failed to get template', code: 'GET_TEMPLATE_ERROR' });
  }
});

const createTemplateSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(200),
  preview_text: z.string().max(200).optional(),
  blocks: z.array(z.any()).min(1),
  category: z.enum([
    'transactional', 'onboarding', 'engagement', 'upgrade',
    'security', 'win_back', 'educational', 'announcement', 'digest',
  ]),
  variables: z.array(z.string()).optional(),
  branding_mode: z.enum(['platform', 'site', 'org']).optional(),
});

/**
 * POST /api/admin/email/templates
 * Create a new email template.
 */
router.post(
  '/templates',
  validateBody(createTemplateSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const template = await createTemplate({
        ...req.body,
        created_by: req.admin!.id,
      });

      await logAdminActivity(
        req.admin!.id,
        'create_email_template',
        'email_template',
        template.id,
        { slug: template.slug, name: template.name },
        req
      );

      res.status(201).json({ template });
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(409).json({ error: 'A template with this slug already exists', code: 'DUPLICATE_SLUG' });
        return;
      }
      console.error('Admin create template error:', error);
      res.status(500).json({ error: 'Failed to create template', code: 'CREATE_TEMPLATE_ERROR' });
    }
  }
);

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(200).optional(),
  preview_text: z.string().max(200).optional(),
  blocks: z.array(z.any()).optional(),
  category: z.enum([
    'transactional', 'onboarding', 'engagement', 'upgrade',
    'security', 'win_back', 'educational', 'announcement', 'digest',
  ]).optional(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  branding_mode: z.enum(['platform', 'site', 'org']).optional(),
});

/**
 * PUT /api/admin/email/templates/:id
 * Update an existing email template.
 */
router.put(
  '/templates/:id',
  validateBody(updateTemplateSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const template = await updateTemplate(req.params.id, req.body);
      if (!template) {
        res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'update_email_template',
        'email_template',
        template.id,
        { slug: template.slug, changes: Object.keys(req.body) },
        req
      );

      res.json({ template });
    } catch (error) {
      console.error('Admin update template error:', error);
      res.status(500).json({ error: 'Failed to update template', code: 'UPDATE_TEMPLATE_ERROR' });
    }
  }
);

/**
 * DELETE /api/admin/email/templates/:id
 * Delete a non-system template.
 */
router.delete('/templates/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const deleted = await deleteTemplate(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'delete_email_template',
      'email_template',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('system templates')) {
      res.status(403).json({ error: 'Cannot delete system templates', code: 'SYSTEM_TEMPLATE' });
      return;
    }
    console.error('Admin delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template', code: 'DELETE_TEMPLATE_ERROR' });
  }
});

/**
 * POST /api/admin/email/templates/:id/preview
 * Compile and return rendered HTML with sample variables.
 */
router.post('/templates/:id/preview', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const html = await renderPreview(req.params.id, req.body.variables);
    if (!html) {
      res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
      return;
    }
    res.json({ html });
  } catch (error) {
    console.error('Admin preview template error:', error);
    res.status(500).json({ error: 'Failed to preview template', code: 'PREVIEW_ERROR' });
  }
});

/**
 * POST /api/admin/email/templates/:id/test
 * Send a test email to the admin's own inbox.
 */
router.post('/templates/:id/test', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const template = await getTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
      return;
    }

    await sendTemplate({
      templateSlug: template.slug,
      to: {
        userId: req.admin!.id,
        email: req.admin!.email,
        firstName: 'Admin',
      },
      variables: req.body.variables || {},
      sentBy: req.admin!.id,
    });

    res.json({ success: true, sentTo: req.admin!.email });
  } catch (error) {
    console.error('Admin test send error:', error);
    res.status(500).json({ error: 'Failed to send test email', code: 'TEST_SEND_ERROR' });
  }
});

const duplicateTemplateSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores'),
  name: z.string().min(1).max(100),
});

/**
 * POST /api/admin/email/templates/:id/duplicate
 * Clone a template with a new slug and name.
 */
router.post(
  '/templates/:id/duplicate',
  validateBody(duplicateTemplateSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const template = await duplicateTemplate(req.params.id, req.body.slug, req.body.name);
      if (!template) {
        res.status(404).json({ error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'duplicate_email_template',
        'email_template',
        template.id,
        { sourceId: req.params.id, newSlug: template.slug },
        req
      );

      res.status(201).json({ template });
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(409).json({ error: 'A template with this slug already exists', code: 'DUPLICATE_SLUG' });
        return;
      }
      console.error('Admin duplicate template error:', error);
      res.status(500).json({ error: 'Failed to duplicate template', code: 'DUPLICATE_ERROR' });
    }
  }
);

// =============================================
// Campaign Routes
// =============================================

const campaignSegmentSchema = z.object({
  tiers: z.array(z.enum(['free', 'starter', 'professional', 'agency', 'enterprise'])).optional(),
  leadStatuses: z.array(z.enum(['new', 'active', 'engaged', 'power_user', 'churning', 'dormant'])).optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  maxLeadScore: z.number().min(0).max(100).optional(),
  verifiedDomain: z.boolean().optional(),
  auditCountMin: z.number().min(0).optional(),
  auditCountMax: z.number().min(0).optional(),
  lastLoginAfter: z.string().optional(),
  lastLoginBefore: z.string().optional(),
  registeredAfter: z.string().optional(),
  registeredBefore: z.string().optional(),
  excludeUserIds: z.array(z.string().uuid()).optional(),
}).strict();

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  template_id: z.string().uuid(),
  segment: campaignSegmentSchema.optional(),
  send_rate_per_second: z.number().min(1).max(50).optional(),
  max_recipients: z.number().min(1).max(100000).optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  template_id: z.string().uuid().optional(),
  segment: campaignSegmentSchema.optional(),
  send_rate_per_second: z.number().min(1).max(50).optional(),
  max_recipients: z.number().min(1).max(100000).optional(),
});

/**
 * POST /api/admin/email/campaigns/audience-count
 * Preview segment audience count. Static route BEFORE :id.
 */
router.post(
  '/campaigns/audience-count',
  validateBody(z.object({ segment: campaignSegmentSchema })),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const count = await getAudienceCount(req.body.segment);
      res.json({ count });
    } catch (error) {
      console.error('Audience count error:', error);
      res.status(500).json({ error: 'Failed to get audience count', code: 'AUDIENCE_COUNT_ERROR' });
    }
  }
);

/**
 * GET /api/admin/email/campaigns
 * List campaigns with pagination and filters.
 */
router.get('/campaigns', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as CampaignStatus | undefined;
    const search = req.query.search as string | undefined;

    const result = await listCampaigns({ status, search, page, limit });

    res.json({
      campaigns: result.campaigns,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list campaigns error:', error);
    res.status(500).json({ error: 'Failed to list campaigns', code: 'LIST_CAMPAIGNS_ERROR' });
  }
});

/**
 * POST /api/admin/email/campaigns
 * Create a draft campaign.
 */
router.post(
  '/campaigns',
  validateBody(createCampaignSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const campaign = await createCampaign(req.body, req.admin!.id);

      await logAdminActivity(
        req.admin!.id,
        'create_campaign',
        'email_campaign',
        campaign.id,
        { name: campaign.name },
        req
      );

      res.status(201).json({ campaign });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('Template not found')) {
        res.status(400).json({ error: msg, code: 'INVALID_TEMPLATE' });
        return;
      }
      console.error('Admin create campaign error:', error);
      res.status(500).json({ error: 'Failed to create campaign', code: 'CREATE_CAMPAIGN_ERROR' });
    }
  }
);

/**
 * GET /api/admin/email/campaigns/:id
 * Get campaign detail with template name.
 */
router.get('/campaigns/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const campaign = await getCampaign(req.params.id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Admin get campaign error:', error);
    res.status(500).json({ error: 'Failed to get campaign', code: 'GET_CAMPAIGN_ERROR' });
  }
});

/**
 * PUT /api/admin/email/campaigns/:id
 * Update a draft campaign.
 */
router.put(
  '/campaigns/:id',
  validateBody(updateCampaignSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const campaign = await updateCampaign(req.params.id, req.body);
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
        return;
      }

      await logAdminActivity(
        req.admin!.id,
        'update_campaign',
        'email_campaign',
        campaign.id,
        { changes: Object.keys(req.body) },
        req
      );

      res.json({ campaign });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('only update draft')) {
        res.status(400).json({ error: msg, code: 'CAMPAIGN_NOT_DRAFT' });
        return;
      }
      console.error('Admin update campaign error:', error);
      res.status(500).json({ error: 'Failed to update campaign', code: 'UPDATE_CAMPAIGN_ERROR' });
    }
  }
);

/**
 * DELETE /api/admin/email/campaigns/:id
 * Delete a draft campaign.
 */
router.delete('/campaigns/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const deleted = await deleteCampaign(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'delete_campaign',
      'email_campaign',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('only delete draft')) {
      res.status(400).json({ error: msg, code: 'CAMPAIGN_NOT_DRAFT' });
      return;
    }
    console.error('Admin delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign', code: 'DELETE_CAMPAIGN_ERROR' });
  }
});

/**
 * POST /api/admin/email/campaigns/:id/launch
 * Launch a campaign (resolve segment, queue sends, start sending).
 */
router.post('/campaigns/:id/launch', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const campaign = await launchCampaign(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'launch_campaign',
      'email_campaign',
      campaign.id,
      { audienceCount: campaign.audience_count },
      req
    );

    res.json({ campaign });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('not found') || msg.includes('Cannot launch') || msg.includes('No recipients')) {
      res.status(400).json({ error: msg, code: 'LAUNCH_ERROR' });
      return;
    }
    console.error('Admin launch campaign error:', error);
    res.status(500).json({ error: 'Failed to launch campaign', code: 'LAUNCH_CAMPAIGN_ERROR' });
  }
});

/**
 * POST /api/admin/email/campaigns/:id/schedule
 * Schedule a campaign for later.
 */
router.post(
  '/campaigns/:id/schedule',
  validateBody(z.object({ scheduled_at: z.string() })),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const campaign = await scheduleCampaign(req.params.id, req.body.scheduled_at);

      await logAdminActivity(
        req.admin!.id,
        'schedule_campaign',
        'email_campaign',
        campaign.id,
        { scheduledAt: req.body.scheduled_at },
        req
      );

      res.json({ campaign });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: msg, code: 'SCHEDULE_ERROR' });
    }
  }
);

/**
 * POST /api/admin/email/campaigns/:id/pause
 * Pause a sending campaign.
 */
router.post('/campaigns/:id/pause', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const campaign = await pauseCampaign(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'pause_campaign',
      'email_campaign',
      campaign.id,
      {},
      req
    );

    res.json({ campaign });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: msg, code: 'PAUSE_ERROR' });
  }
});

/**
 * POST /api/admin/email/campaigns/:id/resume
 * Resume a paused campaign.
 */
router.post('/campaigns/:id/resume', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const campaign = await resumeCampaign(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'resume_campaign',
      'email_campaign',
      campaign.id,
      {},
      req
    );

    res.json({ campaign });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: msg, code: 'RESUME_ERROR' });
  }
});

/**
 * POST /api/admin/email/campaigns/:id/cancel
 * Cancel a campaign (delete queued sends).
 */
router.post('/campaigns/:id/cancel', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const campaign = await cancelCampaign(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'cancel_campaign',
      'email_campaign',
      campaign.id,
      {},
      req
    );

    res.json({ campaign });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: msg, code: 'CANCEL_ERROR' });
  }
});

/**
 * GET /api/admin/email/campaigns/:id/sends
 * Per-recipient send list for a campaign.
 */
router.get('/campaigns/:id/sends', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as string | undefined;

    const result = await getCampaignSends(req.params.id, { status, page, limit });

    res.json({
      sends: result.sends,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get campaign sends error:', error);
    res.status(500).json({ error: 'Failed to get sends', code: 'GET_SENDS_ERROR' });
  }
});

// =============================================
// Global Send History
// =============================================

/**
 * GET /api/admin/email/sends
 * Global email send history.
 */
router.get('/sends', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as string | undefined;
    const campaignId = req.query.campaignId as string | undefined;

    const result = await getEmailSends({ status, campaignId, page, limit });

    res.json({
      sends: result.sends,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get email sends error:', error);
    res.status(500).json({ error: 'Failed to get sends', code: 'GET_SENDS_ERROR' });
  }
});

// =============================================
// Email Analytics
// =============================================

/**
 * GET /api/admin/email/analytics
 * Aggregate email delivery analytics by day.
 */
router.get('/analytics', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const analytics = await getEmailAnalytics(days);

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        sent: acc.sent + Number(day.sent),
        delivered: acc.delivered + Number(day.delivered),
        opened: acc.opened + Number(day.opened),
        clicked: acc.clicked + Number(day.clicked),
        bounced: acc.bounced + Number(day.bounced),
        complained: acc.complained + Number(day.complained),
      }),
      { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 }
    );

    res.json({ totals, daily: analytics });
  } catch (error) {
    console.error('Admin email analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics', code: 'ANALYTICS_ERROR' });
  }
});

/**
 * GET /api/admin/email/analytics/templates
 * Per-template delivery performance.
 */
router.get('/analytics/templates', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const templates = await getTemplatePerformance();
    res.json({ templates });
  } catch (error) {
    console.error('Admin template performance error:', error);
    res.status(500).json({ error: 'Failed to get template performance', code: 'TEMPLATE_PERF_ERROR' });
  }
});

export { router as adminEmailRouter };
