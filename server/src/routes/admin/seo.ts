import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { type AdminRequest, logAdminActivity } from '../../middleware/admin.middleware.js';
import { getAllSeoEntries, upsertSeo, deleteSeo } from '../../services/seo.service.js';

const router = Router();

/**
 * GET /api/admin/seo
 * List all saved SEO entries
 */
router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const entries = await getAllSeoEntries();
    res.json({ entries });
  } catch (error) {
    console.error('Admin list SEO entries error:', error);
    res.status(500).json({ error: 'Failed to list SEO entries', code: 'LIST_SEO_ERROR' });
  }
});

const upsertSeoSchema = z.object({
  route_path: z.string().min(1).max(500),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  keywords: z.string().max(500).nullable().optional(),
  og_title: z.string().max(200).nullable().optional(),
  og_description: z.string().max(500).nullable().optional(),
  og_image: z.string().max(1000).nullable().optional(),
  og_type: z.string().max(50).nullable().optional(),
  twitter_card: z.string().max(50).nullable().optional(),
  canonical_url: z.string().max(1000).nullable().optional(),
  featured_image: z.string().max(1000).nullable().optional(),
  structured_data: z.record(z.unknown()).nullable().optional(),
  noindex: z.boolean().optional(),
});

/**
 * PUT /api/admin/seo
 * Upsert SEO for a route path
 */
router.put('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = upsertSeoSchema.parse(req.body);
    const { route_path, ...seoData } = data;

    const entry = await upsertSeo(route_path, seoData, req.admin!.id);

    await logAdminActivity(
      req.admin!.id,
      'upsert_seo',
      'page_seo',
      entry.id,
      { route_path },
      req
    );

    res.json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Admin upsert SEO error:', error);
    res.status(500).json({ error: 'Failed to save SEO entry', code: 'UPSERT_SEO_ERROR' });
  }
});

/**
 * DELETE /api/admin/seo
 * Delete SEO override for a route path
 */
router.delete('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { route_path } = z.object({ route_path: z.string().min(1) }).parse(req.body);

    await deleteSeo(route_path);

    await logAdminActivity(
      req.admin!.id,
      'delete_seo',
      'page_seo',
      route_path,
      { route_path },
      req
    );

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Admin delete SEO error:', error);
    res.status(500).json({ error: 'Failed to delete SEO entry', code: 'DELETE_SEO_ERROR' });
  }
});

export { router as adminSeoRouter };
