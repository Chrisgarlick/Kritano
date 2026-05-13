"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminResourcesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const gated_resource_service_js_1 = require("../../services/gated-resource.service.js");
const router = (0, express_1.Router)();
const FORMATS_ENUM = ['md', 'pdf', 'html', 'docx'];
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
];
const seoFields = {
    focus_keyword: zod_1.z.string().max(100).nullable().optional(),
    secondary_keywords: zod_1.z.array(zod_1.z.string().max(100)).max(20).optional(),
    seo_title: zod_1.z.string().max(200).nullable().optional(),
    seo_description: zod_1.z.string().max(400).nullable().optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
};
const createSchema = zod_1.z.object({
    slug: zod_1.z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and dashes only'),
    title: zod_1.z.string().min(1).max(200),
    subtitle: zod_1.z.string().max(300).nullable().optional(),
    hook: zod_1.z.string().min(1).max(400),
    category: zod_1.z.enum(CATEGORY_ENUM),
    audience: zod_1.z.string().max(200).nullable().optional(),
    description: zod_1.z.string().min(1),
    preview_md: zod_1.z.string().min(1),
    source_md_path: zod_1.z.string().min(1).max(400),
    formats: zod_1.z.array(zod_1.z.enum(FORMATS_ENUM)).min(1).optional(),
    page_count: zod_1.z.number().int().positive().nullable().optional(),
    ...seoFields,
});
const updateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    subtitle: zod_1.z.string().max(300).nullable().optional(),
    hook: zod_1.z.string().min(1).max(400).optional(),
    category: zod_1.z.enum(CATEGORY_ENUM).optional(),
    audience: zod_1.z.string().max(200).nullable().optional(),
    description: zod_1.z.string().min(1).optional(),
    preview_md: zod_1.z.string().min(1).optional(),
    source_md_path: zod_1.z.string().min(1).max(400).optional(),
    formats: zod_1.z.array(zod_1.z.enum(FORMATS_ENUM)).min(1).optional(),
    page_count: zod_1.z.number().int().positive().nullable().optional(),
    published: zod_1.z.boolean().optional(),
    ...seoFields,
});
// ── List + create ───────────────────────────────────────────────────
router.get('/', async (_req, res) => {
    try {
        const resources = await (0, gated_resource_service_js_1.adminListResources)();
        res.json({ resources });
    }
    catch (err) {
        console.error('Admin list resources error:', err);
        res.status(500).json({ error: 'Failed to list resources', code: 'INTERNAL_ERROR' });
    }
});
router.post('/', async (req, res) => {
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
        const created = await (0, gated_resource_service_js_1.adminCreateResource)(parsed.data);
        await (0, admin_middleware_js_1.logAdminActivity)(req.user.id, 'resource.create', 'gated_resource', created.id, { slug: created.slug }, req);
        res.status(201).json({ resource: created });
    }
    catch (err) {
        console.error('Admin create resource error:', err);
        res.status(500).json({ error: 'Failed to create resource', code: 'INTERNAL_ERROR' });
    }
});
// ── Single resource ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const resource = await (0, gated_resource_service_js_1.getResourceById)(req.params.id);
        if (!resource) {
            res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
            return;
        }
        res.json({ resource });
    }
    catch (err) {
        console.error('Admin get resource error:', err);
        res.status(500).json({ error: 'Failed to get resource', code: 'INTERNAL_ERROR' });
    }
});
router.patch('/:id', async (req, res) => {
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
        const updated = await (0, gated_resource_service_js_1.adminUpdateResource)(req.params.id, parsed.data);
        if (!updated) {
            res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.user.id, 'resource.update', 'gated_resource', updated.id, { fields: Object.keys(parsed.data) }, req);
        res.json({ resource: updated });
    }
    catch (err) {
        console.error('Admin update resource error:', err);
        res.status(500).json({ error: 'Failed to update resource', code: 'INTERNAL_ERROR' });
    }
});
router.post('/:id/regenerate', async (req, res) => {
    try {
        const result = await (0, gated_resource_service_js_1.adminRegenerateContentHash)(req.params.id);
        if (!result) {
            res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.user.id, 'resource.regenerate', 'gated_resource', req.params.id, { content_hash: result.content_hash }, req);
        res.json(result);
    }
    catch (err) {
        console.error('Admin regenerate hash error:', err);
        const message = err instanceof Error ? err.message : 'Failed to regenerate hash';
        res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
    }
});
// ── Lead listing + CSV export ───────────────────────────────────────
router.get('/:id/leads', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const result = await (0, gated_resource_service_js_1.adminListLeads)(req.params.id, { page, limit });
        res.json({
            leads: result.leads,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (err) {
        console.error('Admin list leads error:', err);
        res.status(500).json({ error: 'Failed to list leads', code: 'INTERNAL_ERROR' });
    }
});
router.get('/:id/leads.csv', async (req, res) => {
    try {
        const resource = await (0, gated_resource_service_js_1.getResourceById)(req.params.id);
        if (!resource) {
            res.status(404).send('Resource not found');
            return;
        }
        const leads = await (0, gated_resource_service_js_1.adminExportLeads)(req.params.id);
        const csv = toCsv(leads);
        await (0, admin_middleware_js_1.logAdminActivity)(req.user.id, 'resource.export_leads', 'gated_resource', resource.id, { count: leads.length }, req);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', `attachment; filename="${resource.slug}-leads.csv"`);
        res.set('Cache-Control', 'private, no-store');
        res.send(csv);
    }
    catch (err) {
        console.error('Admin export leads error:', err);
        res.status(500).send('Failed to export leads');
    }
});
function toCsv(rows) {
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
    const escape = (v) => {
        if (v === null || v === undefined)
            return '';
        const s = String(v);
        if (/[",\n\r]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const lines = [header.join(',')];
    for (const row of rows) {
        lines.push([
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
            .join(','));
    }
    return lines.join('\n') + '\n';
}
exports.adminResourcesRouter = router;
//# sourceMappingURL=resources.js.map