/**
 * Admin Cold Prospects Routes
 *
 * Endpoints for managing the cold prospect pipeline.
 * All routes require super admin authentication.
 */

import { Router, json } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import type { AdminRequest } from '../../middleware/admin.middleware.js';
import { logAdminActivity } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import type { ColdProspectStatus } from '../../types/cold-prospect.types.js';
import {
  getProspects,
  getProspect,
  getStats,
  excludeProspect,
  bulkExclude,
  retryProspect,
  getPipelineSettings,
  updatePipelineSettings,
  getDistinctTlds,
  getDailyStats,
} from '../../services/cold-prospect/cold-prospect-admin.service.js';
import { importFromCsv } from '../../services/cold-prospect/nrd-feed.service.js';
import {
  getOutreachStats,
  getSendHistory,
  queueOutreachBatch,
  processOutreachQueue,
} from '../../services/cold-prospect/outreach.service.js';
import { setSetting, getSetting } from '../../services/system-settings.service.js';
import { pool } from '../../db/index.js';

const router = Router();

/**
 * GET /api/admin/cold-prospects
 * List prospects with filters and pagination
 */
router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as ColdProspectStatus | undefined,
      tld: req.query.tld as string | undefined,
      minScore: req.query.minScore ? parseInt(req.query.minScore as string) : undefined,
      maxScore: req.query.maxScore ? parseInt(req.query.maxScore as string) : undefined,
      batchDate: req.query.batchDate as string | undefined,
      hasEmail: req.query.hasEmail === 'true',
      hasName: req.query.hasName === 'true',
      search: req.query.search as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 25, 100),
      sortBy: req.query.sortBy as string || 'created_at',
      sortOrder: req.query.sortOrder as string || 'desc',
    };

    const result = await getProspects(filters);

    res.json({
      prospects: result.prospects,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit),
      },
    });
  } catch (error) {
    console.error('Cold prospects list error:', error);
    res.status(500).json({ error: 'Failed to list prospects', code: 'LIST_PROSPECTS_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/stats
 * Pipeline funnel stats
 */
router.get('/stats', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Cold prospects stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'PROSPECT_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/daily-stats
 * Daily import/qualification/contact stats for chart
 */
router.get('/daily-stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const stats = await getDailyStats(days);
    res.json({ stats });
  } catch (error) {
    console.error('Cold prospects daily stats error:', error);
    res.status(500).json({ error: 'Failed to get daily stats', code: 'DAILY_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/tlds
 * Get distinct TLDs for filter dropdown
 */
router.get('/tlds', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const tlds = await getDistinctTlds();
    res.json({ tlds });
  } catch (error) {
    console.error('Cold prospects TLDs error:', error);
    res.status(500).json({ error: 'Failed to get TLDs', code: 'TLDS_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/settings
 * Get pipeline settings
 */
router.get('/settings', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const settings = await getPipelineSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Cold prospects settings error:', error);
    res.status(500).json({ error: 'Failed to get settings', code: 'SETTINGS_ERROR' });
  }
});

const updateSettingsSchema = z.object({
  targetTlds: z.array(z.string()).optional(),
  excludedKeywords: z.array(z.string()).optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  dailyCheckLimit: z.number().min(10).max(10000).optional(),
  dailyEmailLimit: z.number().min(1).max(1000).optional(),
  autoOutreachEnabled: z.boolean().optional(),
});

/**
 * PUT /api/admin/cold-prospects/settings
 * Update pipeline settings
 */
router.put(
  '/settings',
  validateBody(updateSettingsSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      await updatePipelineSettings(req.body);

      await logAdminActivity(
        req.admin!.id,
        'update_cold_prospect_settings',
        'system',
        'cold_prospects',
        req.body,
        req
      );

      const settings = await getPipelineSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Cold prospects update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings', code: 'UPDATE_SETTINGS_ERROR' });
    }
  }
);

// =============================================
// Outreach Endpoints (must be before /:id)
// =============================================

/**
 * GET /api/admin/cold-prospects/outreach-stats
 * Get outreach funnel stats
 */
router.get('/outreach-stats', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getOutreachStats();
    res.json({ stats });
  } catch (error) {
    console.error('Outreach stats error:', error);
    res.status(500).json({ error: 'Failed to get outreach stats', code: 'OUTREACH_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/sends
 * Get paginated send history
 */
router.get('/sends', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const result = await getSendHistory(page, limit);
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
    console.error('Outreach sends error:', error);
    res.status(500).json({ error: 'Failed to get sends', code: 'OUTREACH_SENDS_ERROR' });
  }
});

/**
 * POST /api/admin/cold-prospects/trigger-outreach
 * Manually trigger an outreach batch
 */
router.post('/trigger-outreach', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.body?.limit as string) || 25, 100);
    const queued = await queueOutreachBatch(limit);
    const sent = await processOutreachQueue(limit);

    await logAdminActivity(
      req.admin!.id,
      'trigger_cold_outreach',
      'system',
      'cold_prospects',
      { queued: queued.queued, sent: sent.sent, failed: sent.failed },
      req
    );

    res.json({ queued: queued.queued, sent: sent.sent, failed: sent.failed });
  } catch (error) {
    console.error('Trigger outreach error:', error);
    res.status(500).json({ error: 'Failed to trigger outreach', code: 'TRIGGER_OUTREACH_ERROR' });
  }
});

/**
 * POST /api/admin/cold-prospects/pause-outreach
 * Toggle auto outreach on/off
 */
router.post('/pause-outreach', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const current = await getSetting('trigger_auto_send_cold_outreach');
    const newValue = !(current === true || current === 'true');
    await setSetting('trigger_auto_send_cold_outreach', newValue, req.admin!.id);

    await logAdminActivity(
      req.admin!.id,
      newValue ? 'enable_cold_outreach' : 'disable_cold_outreach',
      'system',
      'cold_prospects',
      { enabled: newValue },
      req
    );

    res.json({ enabled: newValue });
  } catch (error) {
    console.error('Pause outreach error:', error);
    res.status(500).json({ error: 'Failed to toggle outreach', code: 'PAUSE_OUTREACH_ERROR' });
  }
});

/**
 * GET /api/admin/cold-prospects/:id
 * Get prospect detail
 */
router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const prospect = await getProspect(req.params.id);
    if (!prospect) {
      res.status(404).json({ error: 'Prospect not found', code: 'PROSPECT_NOT_FOUND' });
      return;
    }
    res.json({ prospect });
  } catch (error) {
    console.error('Cold prospect get error:', error);
    res.status(500).json({ error: 'Failed to get prospect', code: 'GET_PROSPECT_ERROR' });
  }
});

/**
 * DELETE /api/admin/cold-prospects/:id
 * Exclude a prospect
 */
router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const reason = (req.query.reason as string) || 'Admin excluded';
    await excludeProspect(req.params.id, reason);

    await logAdminActivity(
      req.admin!.id,
      'exclude_cold_prospect',
      'cold_prospect',
      req.params.id,
      { reason },
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Cold prospect exclude error:', error);
    res.status(500).json({ error: 'Failed to exclude prospect', code: 'EXCLUDE_PROSPECT_ERROR' });
  }
});

/**
 * POST /api/admin/cold-prospects/:id/retry
 * Retry processing a prospect
 */
router.post('/:id/retry', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await retryProspect(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Cold prospect retry error:', error);
    res.status(500).json({ error: 'Failed to retry prospect', code: 'RETRY_PROSPECT_ERROR' });
  }
});

const bulkExcludeSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  reason: z.string().min(1).max(200),
});

/**
 * POST /api/admin/cold-prospects/bulk-exclude
 * Bulk exclude prospects
 */
router.post(
  '/bulk-exclude',
  validateBody(bulkExcludeSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { ids, reason } = req.body;
      const excluded = await bulkExclude(ids, reason);

      await logAdminActivity(
        req.admin!.id,
        'bulk_exclude_cold_prospects',
        'cold_prospect',
        'bulk',
        { count: excluded, reason },
        req
      );

      res.json({ excluded });
    } catch (error) {
      console.error('Cold prospect bulk exclude error:', error);
      res.status(500).json({ error: 'Failed to bulk exclude', code: 'BULK_EXCLUDE_ERROR' });
    }
  }
);

/**
 * POST /api/admin/cold-prospects/import
 * Manual CSV import
 */
router.post('/import', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') {
      res.status(400).json({ error: 'CSV content is required', code: 'MISSING_CSV' });
      return;
    }

    const result = await importFromCsv(csv);

    await logAdminActivity(
      req.admin!.id,
      'import_cold_prospects',
      'cold_prospect',
      'import',
      result,
      req
    );

    res.json(result);
  } catch (error) {
    console.error('Cold prospect import error:', error);
    res.status(500).json({ error: 'Failed to import prospects', code: 'IMPORT_ERROR' });
  }
});

/**
 * POST /api/admin/cold-prospects/import-json
 * Import qualified prospects from JSON (exported from CLI pipeline)
 */
router.post('/import-json', json({ limit: '10mb' }), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { prospects } = req.body;
    if (!Array.isArray(prospects) || prospects.length === 0) {
      res.status(400).json({ error: 'Prospects array is required', code: 'MISSING_PROSPECTS' });
      return;
    }

    if (prospects.length > 5000) {
      res.status(400).json({ error: 'Maximum 5000 prospects per import', code: 'TOO_MANY' });
      return;
    }

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const p of prospects) {
      if (!p.domain || !p.contact_email) {
        errors++;
        continue;
      }

      try {
        const result = await pool.query(
          `INSERT INTO cold_prospects (
            id, domain, tld, registered_at, batch_date, source,
            status, is_live, http_status, has_ssl, title, meta_description,
            technology_stack, page_count_estimate, language, quality_score,
            contact_email, contact_name, contact_role, emails,
            contact_page_url, has_contact_form, social_links
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            'qualified', TRUE, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20
          ) ON CONFLICT (domain) DO NOTHING`,
          [
            p.domain,
            p.tld || p.domain.split('.').pop(),
            p.batch_date || new Date().toISOString().split('T')[0],
            p.batch_date || new Date().toISOString().split('T')[0],
            p.source || 'json_import',
            p.http_status || null,
            p.has_ssl ?? true,
            p.title || null,
            p.meta_description || null,
            JSON.stringify(p.technology_stack || []),
            p.page_count_estimate || null,
            p.language || null,
            p.quality_score || 0,
            p.contact_email,
            p.contact_name || null,
            p.contact_role || null,
            JSON.stringify(p.emails || []),
            p.contact_page_url || null,
            p.has_contact_form ?? false,
            JSON.stringify(p.social_links || {}),
          ]
        );

        if (result.rowCount && result.rowCount > 0) {
          imported++;
        } else {
          duplicates++;
        }
      } catch {
        errors++;
      }
    }

    const result = { imported, duplicates, errors };

    await logAdminActivity(
      req.admin!.id,
      'import_cold_prospects_json',
      'cold_prospect',
      'import',
      result,
      req
    );

    res.json(result);
  } catch (error) {
    console.error('Cold prospect JSON import error:', error);
    res.status(500).json({ error: 'Failed to import prospects', code: 'IMPORT_ERROR' });
  }
});

export { router as adminColdProspectsRouter };
