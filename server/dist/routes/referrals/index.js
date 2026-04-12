"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const referral_service_js_1 = require("../../services/referral.service.js");
const router = (0, express_1.Router)();
// All referral routes require authentication
router.use(auth_middleware_js_1.authenticate);
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
/**
 * GET /api/referrals/code
 * Get or generate referral code and link
 */
router.get('/code', async (req, res) => {
    try {
        const code = await (0, referral_service_js_1.getOrCreateReferralCode)(req.user.id);
        res.json({
            code,
            link: `${APP_URL}/register?ref=${code}`,
        });
    }
    catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({ error: 'Failed to get referral code', code: 'REFERRAL_CODE_ERROR' });
    }
});
/**
 * GET /api/referrals/stats
 * Get user's referral stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await (0, referral_service_js_1.getReferralStats)(req.user.id);
        res.json({ stats });
    }
    catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({ error: 'Failed to get referral stats', code: 'REFERRAL_STATS_ERROR' });
    }
});
/**
 * GET /api/referrals/list
 * Get paginated referral list
 */
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await (0, referral_service_js_1.getUserReferrals)(req.user.id, page, limit);
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
        console.error('List referrals error:', error);
        res.status(500).json({ error: 'Failed to list referrals', code: 'REFERRAL_LIST_ERROR' });
    }
});
const inviteSchema = zod_1.z.object({
    emails: zod_1.z.array(zod_1.z.string().email()).min(1).max(5),
});
/**
 * POST /api/referrals/invite
 * Send invite emails (max 5 per request)
 */
router.post('/invite', (0, validate_middleware_js_1.validateBody)(inviteSchema), async (req, res) => {
    try {
        const { emails } = req.body;
        const result = await (0, referral_service_js_1.sendInviteEmails)(req.user.id, emails);
        res.json(result);
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        console.error('Send invite error:', error);
        res.status(statusCode).json({ error: error.message || 'Failed to send invites', code: 'INVITE_ERROR' });
    }
});
exports.referralsRouter = router;
//# sourceMappingURL=index.js.map