/**
 * Admin routes for the gated resource library.
 *
 *   GET    /api/admin/resources             — list with stats
 *   POST   /api/admin/resources             — create a resource
 *   GET    /api/admin/resources/:id         — read one
 *   PATCH  /api/admin/resources/:id         — update metadata / publish toggle
 *   POST   /api/admin/resources/:id/regenerate — recompute content_hash from disk
 *   GET    /api/admin/resources/:id/leads   — paginated lead list
 *   GET    /api/admin/resources/:id/leads.csv — full export (CSV)
 *
 * Mounted at /api/admin/resources. Auth + super-admin enforced upstream by
 * routes/admin/index.ts (`router.use(authenticate, requireSuperAdmin)`).
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { logAdminActivity, type AdminRequest } from '../../middleware/admin.middleware.js';
import {
  adminCreateResource,
  adminExportLeads,
  adminListLeads,
  adminListResources,
  adminRegenerateContentHash,
  adminUpdateResource,
  getResourceById,
} from '../../services/gated-resource.service.js';

const router = Router();

const FORMATS_ENUM = ['md', 'pdf', 'html', 'docx'] as const;
const CATEGORY_ENUM = [
  'seo',
  'accessibility',
  'security',
  'performance',
  'content-quality',
  'structured-data',
  'eeat',
  'aeo',
  'guides',
  'case-studies',
  'product-updates',
] as const;

const createSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and dashes only'),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).nullable().optional(),
  hook: z.string().min(1).max(400),
  category: z.enum(CATEGORY_ENUM),
  audience: z.string().max(200).nullable().optional(),
  description: z.string().min(1),
  preview_md: z.string().min(1),
  source_md_path: z.string().min(1).max(400),
  formats: z.array(z.enum(FORMATS_ENUM)).min(1).optional(),
  page_count: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).nullable().optional(),
  hook: z.string().min(1).max(400).optional(),
  category: z.enum(CATEGORY_ENUM).optional(),
  audience: z.string().max(200).nullable().optional(),
  description: z.string().min(1).optional(),
  preview_md: z.string().min(1).optional(),
  source_md_path: z.string().min(1).max(400).optional(),
  formats: z.array(z.enum(FORMATS_ENUM)).min(1).optional(),
  page_count: z.number().int().positive().nullable().optional(),
  published: z.boolean().optional(),
});

// ── List + create ───────────────────────────────────────────────────

router.get('/', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const resources = await adminListResources();
    res.json({ resources });
  } catch (err) {
    console.error('Admin list resources error:', err);
    res.status(500).json({ error: 'Failed to list resources', code: 'INTERNAL_ERROR' });
  }
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid resource',
      code: 'INVALID_REQUEST',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const created = await adminCreateResource(parsed.data);
    await logAdminActivity(
      req.user!.id,
      'resource.create',
      'gated_resource',
      created.id,
      { slug: created.slug },
      req
    );
    res.status(201).json({ resource: created });
  } catch (err) {
    console.error('Admin create resource error:', err);
    res.status(500).json({ error: 'Failed to create resource', code: 'INTERNAL_ERROR' });
  }
});

// ── Single resource ─────────────────────────────────────────────────

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const resource = await getResourceById(req.params.id);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ resource });
  } catch (err) {
    console.error('Admin get resource error:', err);
    res.status(500).json({ error: 'Failed to get resource', code: 'INTERNAL_ERROR' });
  }
});

router.patch('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid update',
      code: 'INVALID_REQUEST',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const updated = await adminUpdateResource(req.params.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }
    await logAdminActivity(
      req.user!.id,
      'resource.update',
      'gated_resource',
      updated.id,
      { fields: Object.keys(parsed.data) },
      req
    );
    res.json({ resource: updated });
  } catch (err) {
    console.error('Admin update resource error:', err);
    res.status(500).json({ error: 'Failed to update resource', code: 'INTERNAL_ERROR' });
  }
});

router.post('/:id/regenerate', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await adminRegenerateContentHash(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }
    await logAdminActivity(
      req.user!.id,
      'resource.regenerate',
      'gated_resource',
      req.params.id,
      { content_hash: result.content_hash },
      req
    );
    res.json(result);
  } catch (err) {
    console.error('Admin regenerate hash error:', err);
    const message = err instanceof Error ? err.message : 'Failed to regenerate hash';
    res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
  }
});

// ── Lead listing + CSV export ───────────────────────────────────────

router.get('/:id/leads', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await adminListLeads(req.params.id, { page, limit });
    res.json({
      leads: result.leads,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list leads error:', err);
    res.status(500).json({ error: 'Failed to list leads', code: 'INTERNAL_ERROR' });
  }
});

router.get('/:id/leads.csv', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const resource = await getResourceById(req.params.id);
    if (!resource) {
      res.status(404).send('Resource not found');
      return;
    }
    const leads = await adminExportLeads(req.params.id);
    const csv = toCsv(leads);
    await logAdminActivity(
      req.user!.id,
      'resource.export_leads',
      'gated_resource',
      resource.id,
      { count: leads.length },
      req
    );
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set(
      'Content-Disposition',
      `attachment; filename="${resource.slug}-leads.csv"`
    );
    res.set('Cache-Control', 'private, no-store');
    res.send(csv);
  } catch (err) {
    console.error('Admin export leads error:', err);
    res.status(500).send('Failed to export leads');
  }
});

function toCsv(rows: Awaited<ReturnType<typeof adminExportLeads>>): string {
  const header = [
    'email',
    'consent_newsletter',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'referer',
    'user_id',
    'created_at',
  ];
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.email,
        row.consent_newsletter,
        row.utm_source,
        row.utm_medium,
        row.utm_campaign,
        row.referer,
        row.user_id,
        row.created_at,
      ]
        .map(escape)
        .join(',')
    );
  }
  return lines.join('\n') + '\n';
}

export const adminResourcesRouter = router;
