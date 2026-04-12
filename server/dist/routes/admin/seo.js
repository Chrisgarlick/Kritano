"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSeoRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const seo_service_js_1 = require("../../services/seo.service.js");
const router = (0, express_1.Router)();
exports.adminSeoRouter = router;
/**
 * GET /api/admin/seo
 * List all saved SEO entries
 */
router.get('/', async (req, res) => {
    try {
        const entries = await (0, seo_service_js_1.getAllSeoEntries)();
        res.json({ entries });
    }
    catch (error) {
        console.error('Admin list SEO entries error:', error);
        res.status(500).json({ error: 'Failed to list SEO entries', code: 'LIST_SEO_ERROR' });
    }
});
const upsertSeoSchema = zod_1.z.object({
    route_path: zod_1.z.string().min(1).max(500),
    title: zod_1.z.string().max(200).nullable().optional(),
    description: zod_1.z.string().max(500).nullable().optional(),
    keywords: zod_1.z.string().max(500).nullable().optional(),
    og_title: zod_1.z.string().max(200).nullable().optional(),
    og_description: zod_1.z.string().max(500).nullable().optional(),
    og_image: zod_1.z.string().max(1000).nullable().optional(),
    og_type: zod_1.z.string().max(50).nullable().optional(),
    twitter_card: zod_1.z.string().max(50).nullable().optional(),
    canonical_url: zod_1.z.string().max(1000).nullable().optional(),
    featured_image: zod_1.z.string().max(1000).nullable().optional(),
    structured_data: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    noindex: zod_1.z.boolean().optional(),
});
/**
 * PUT /api/admin/seo
 * Upsert SEO for a route path
 */
router.put('/', async (req, res) => {
    try {
        const data = upsertSeoSchema.parse(req.body);
        const { route_path, ...seoData } = data;
        const entry = await (0, seo_service_js_1.upsertSeo)(route_path, seoData, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'upsert_seo', 'page_seo', entry.id, { route_path }, req);
        res.json({ entry });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/', async (req, res) => {
    try {
        const { route_path } = zod_1.z.object({ route_path: zod_1.z.string().min(1) }).parse(req.body);
        await (0, seo_service_js_1.deleteSeo)(route_path);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_seo', 'page_seo', route_path, { route_path }, req);
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Admin delete SEO error:', error);
        res.status(500).json({ error: 'Failed to delete SEO entry', code: 'DELETE_SEO_ERROR' });
    }
});
//# sourceMappingURL=seo.js.map