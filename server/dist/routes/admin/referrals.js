"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReferralsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const referral_service_js_1 = require("../../services/referral.service.js");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/referrals/stats
 * Program-wide referral statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await (0, referral_service_js_1.adminGetStats)();
        res.json({ stats });
    }
    catch (error) {
        console.error('Admin referral stats error:', error);
        res.status(500).json({ error: 'Failed to get referral stats', code: 'ADMIN_REFERRAL_STATS_ERROR' });
    }
});
/**
 * GET /api/admin/referrals
 * List all referrals with filters
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const status = req.query.status;
        const search = req.query.search;
        const result = await (0, referral_service_js_1.adminListReferrals)(page, limit, status, search);
        res.json({
            referrals: result.referrals,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin list referrals error:', error);
        res.status(500).json({ error: 'Failed to list referrals', code: 'ADMIN_REFERRAL_LIST_ERROR' });
    }
});
const voidSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(500),
});
/**
 * POST /api/admin/referrals/:id/void
 * Void a referral and reverse rewards
 */
router.post('/:id/void', (0, validate_middleware_js_1.validateBody)(voidSchema), async (req, res) => {
    try {
        const { reason } = req.body;
        const referral = await (0, referral_service_js_1.adminVoidReferral)(req.params.id, reason, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'void_referral', 'referral', req.params.id, { reason }, req);
        res.json({ referral });
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        console.error('Admin void referral error:', error);
        res.status(statusCode).json({ error: error.message || 'Failed to void referral', code: 'ADMIN_VOID_REFERRAL_ERROR' });
    }
});
/**
 * GET /api/admin/referrals/config
 * Get referral config
 */
router.get('/config', async (req, res) => {
    try {
        const config = await (0, referral_service_js_1.getConfig)();
        res.json({ config });
    }
    catch (error) {
        console.error('Admin referral config error:', error);
        res.status(500).json({ error: 'Failed to get config', code: 'ADMIN_REFERRAL_CONFIG_ERROR' });
    }
});
const configSchema = zod_1.z.object({
    key: zod_1.z.enum(['enabled', 'max_referrals_per_month', 'rewards']),
    value: zod_1.z.unknown(),
});
/**
 * PATCH /api/admin/referrals/config
 * Update referral config
 */
router.patch('/config', (0, validate_middleware_js_1.validateBody)(configSchema), async (req, res) => {
    try {
        const { key, value } = req.body;
        await (0, referral_service_js_1.updateConfig)(key, value);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_referral_config', 'referral_config', key, { value }, req);
        const config = await (0, referral_service_js_1.getConfig)();
        res.json({ config });
    }
    catch (error) {
        console.error('Admin update referral config error:', error);
        res.status(500).json({ error: 'Failed to update config', code: 'ADMIN_REFERRAL_CONFIG_UPDATE_ERROR' });
    }
});
exports.adminReferralsRouter = router;
//# sourceMappingURL=referrals.js.map