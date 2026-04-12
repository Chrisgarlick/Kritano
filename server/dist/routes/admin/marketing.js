"use strict";
/**
 * Admin Marketing Routes
 *
 * CRUD for marketing campaigns and social content.
 * Mounted at /api/admin/marketing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMarketingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const marketing_service_js_1 = require("../../services/marketing.service.js");
const router = (0, express_1.Router)();
exports.adminMarketingRouter = router;
// =============================================
// Campaign Endpoints
// =============================================
const campaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    description: zod_1.z.string().max(500).optional(),
});
/**
 * GET /api/admin/marketing/campaigns
 */
router.get('/campaigns', async (req, res) => {
    try {
        const result = await (0, marketing_service_js_1.listCampaigns)();
        res.json(result);
    }
    catch (error) {
        console.error('Admin list marketing campaigns error:', error);
        res.status(500).json({ error: 'Failed to list campaigns', code: 'LIST_CAMPAIGNS_ERROR' });
    }
});
/**
 * POST /api/admin/marketing/campaigns
 */
router.post('/campaigns', (0, validate_middleware_js_1.validateBody)(campaignSchema), async (req, res) => {
    try {
        const campaign = await (0, marketing_service_js_1.createCampaign)(req.body, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_marketing_campaign', 'marketing_campaign', campaign.id, { name: campaign.name }, req);
        res.status(201).json({ campaign });
    }
    catch (error) {
        console.error('Admin create marketing campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign', code: 'CREATE_CAMPAIGN_ERROR' });
    }
});
/**
 * PATCH /api/admin/marketing/campaigns/:id
 */
router.patch('/campaigns/:id', (0, validate_middleware_js_1.validateBody)(campaignSchema.partial()), async (req, res) => {
    try {
        const campaign = await (0, marketing_service_js_1.updateCampaign)(req.params.id, req.body);
        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_marketing_campaign', 'marketing_campaign', req.params.id, req.body, req);
        res.json({ campaign });
    }
    catch (error) {
        console.error('Admin update marketing campaign error:', error);
        res.status(500).json({ error: 'Failed to update campaign', code: 'UPDATE_CAMPAIGN_ERROR' });
    }
});
/**
 * DELETE /api/admin/marketing/campaigns/:id
 */
router.delete('/campaigns/:id', async (req, res) => {
    try {
        await (0, marketing_service_js_1.deleteCampaign)(req.params.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_marketing_campaign', 'marketing_campaign', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete marketing campaign error:', error);
        res.status(500).json({ error: 'Failed to delete campaign', code: 'DELETE_CAMPAIGN_ERROR' });
    }
});
// =============================================
// Content Endpoints
// =============================================
const VALID_PLATFORMS = ['twitter', 'linkedin', 'instagram', 'facebook', 'threads', 'other'];
const VALID_STATUSES = ['draft', 'ready', 'posted', 'archived'];
const contentSchema = zod_1.z.object({
    platform: zod_1.z.enum(VALID_PLATFORMS),
    title: zod_1.z.string().max(200).optional(),
    body: zod_1.z.string().min(1),
    media: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        alt: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
    })).optional(),
    campaign_id: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.enum(VALID_STATUSES).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    week_number: zod_1.z.number().int().min(1).max(52).nullable().optional(),
    day_of_week: zod_1.z.number().int().min(1).max(7).nullable().optional(),
});
/**
 * GET /api/admin/marketing/content
 */
router.get('/content', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const platform = req.query.platform;
        const campaign_id = req.query.campaign_id;
        const status = req.query.status;
        const search = req.query.search;
        const week_number = req.query.week_number ? parseInt(req.query.week_number) : undefined;
        const day_of_week = req.query.day_of_week ? parseInt(req.query.day_of_week) : undefined;
        const result = await (0, marketing_service_js_1.listContent)({ platform, campaign_id, status, search, week_number, day_of_week, page, limit });
        res.json({
            content: result.content,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin list marketing content error:', error);
        res.status(500).json({ error: 'Failed to list content', code: 'LIST_CONTENT_ERROR' });
    }
});
/**
 * GET /api/admin/marketing/content/stats
 */
router.get('/content/stats', async (req, res) => {
    try {
        const stats = await (0, marketing_service_js_1.getContentStats)();
        res.json({ stats });
    }
    catch (error) {
        console.error('Admin marketing content stats error:', error);
        res.status(500).json({ error: 'Failed to get stats', code: 'CONTENT_STATS_ERROR' });
    }
});
/**
 * GET /api/admin/marketing/content/:id
 */
router.get('/content/:id', async (req, res) => {
    try {
        const item = await (0, marketing_service_js_1.getContent)(req.params.id);
        if (!item) {
            res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
            return;
        }
        res.json({ content: item });
    }
    catch (error) {
        console.error('Admin get marketing content error:', error);
        res.status(500).json({ error: 'Failed to get content', code: 'GET_CONTENT_ERROR' });
    }
});
/**
 * POST /api/admin/marketing/content
 */
router.post('/content', (0, validate_middleware_js_1.validateBody)(contentSchema), async (req, res) => {
    try {
        const item = await (0, marketing_service_js_1.createContent)(req.body, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'create_marketing_content', 'marketing_content', item.id, { platform: item.platform, title: item.title }, req);
        res.status(201).json({ content: item });
    }
    catch (error) {
        console.error('Admin create marketing content error:', error);
        res.status(500).json({ error: 'Failed to create content', code: 'CREATE_CONTENT_ERROR' });
    }
});
/**
 * PATCH /api/admin/marketing/content/:id
 */
router.patch('/content/:id', (0, validate_middleware_js_1.validateBody)(contentSchema.partial()), async (req, res) => {
    try {
        const item = await (0, marketing_service_js_1.updateContent)(req.params.id, req.body);
        if (!item) {
            res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_marketing_content', 'marketing_content', req.params.id, { platform: item.platform }, req);
        res.json({ content: item });
    }
    catch (error) {
        console.error('Admin update marketing content error:', error);
        res.status(500).json({ error: 'Failed to update content', code: 'UPDATE_CONTENT_ERROR' });
    }
});
/**
 * DELETE /api/admin/marketing/content/:id
 */
router.delete('/content/:id', async (req, res) => {
    try {
        await (0, marketing_service_js_1.deleteContent)(req.params.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_marketing_content', 'marketing_content', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete marketing content error:', error);
        res.status(500).json({ error: 'Failed to delete content', code: 'DELETE_CONTENT_ERROR' });
    }
});
/**
 * PATCH /api/admin/marketing/content/:id/status
 */
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(VALID_STATUSES),
});
router.patch('/content/:id/status', (0, validate_middleware_js_1.validateBody)(statusSchema), async (req, res) => {
    try {
        const item = await (0, marketing_service_js_1.updateContentStatus)(req.params.id, req.body.status);
        if (!item) {
            res.status(404).json({ error: 'Content not found', code: 'CONTENT_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_marketing_content_status', 'marketing_content', req.params.id, { status: req.body.status }, req);
        res.json({ content: item });
    }
    catch (error) {
        console.error('Admin update marketing content status error:', error);
        res.status(500).json({ error: 'Failed to update status', code: 'UPDATE_STATUS_ERROR' });
    }
});
//# sourceMappingURL=marketing.js.map