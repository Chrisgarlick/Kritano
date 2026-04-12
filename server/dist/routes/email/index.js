"use strict";
/**
 * Public Email Routes
 *
 * Unsubscribe (one-click + preference page) and email preference management.
 * These endpoints are NOT behind admin middleware — they use signed tokens or auth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const email_preference_service_js_1 = require("../../services/email-preference.service.js");
const router = (0, express_1.Router)();
/**
 * GET /api/email/unsubscribe?token=...
 * One-click unsubscribe. Sets unsubscribed_all = true.
 */
router.get('/unsubscribe', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }
        const result = (0, email_preference_service_js_1.verifyUnsubscribeToken)(token);
        if (!result.valid || !result.userId) {
            res.status(400).json({ error: 'Invalid or expired unsubscribe token' });
            return;
        }
        await (0, email_preference_service_js_1.unsubscribeAll)(result.userId);
        res.json({
            success: true,
            message: 'You have been unsubscribed from all marketing emails. You will still receive essential account emails.',
        });
    }
    catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to process unsubscribe' });
    }
});
/**
 * POST /api/email/unsubscribe?token=...
 * RFC 8058 List-Unsubscribe-Post handler (email client one-click).
 */
router.post('/unsubscribe', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }
        const result = (0, email_preference_service_js_1.verifyUnsubscribeToken)(token);
        if (!result.valid || !result.userId) {
            res.status(400).json({ error: 'Invalid unsubscribe token' });
            return;
        }
        await (0, email_preference_service_js_1.unsubscribeAll)(result.userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Unsubscribe POST error:', error);
        res.status(500).json({ error: 'Failed to process unsubscribe' });
    }
});
/**
 * GET /api/email/preferences?token=...
 * Get email preferences using a signed token (from email footer link).
 */
router.get('/preferences', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }
        const result = (0, email_preference_service_js_1.verifyUnsubscribeToken)(token);
        if (!result.valid || !result.userId) {
            res.status(400).json({ error: 'Invalid token' });
            return;
        }
        const prefs = await (0, email_preference_service_js_1.getPreferences)(result.userId);
        res.json({ preferences: prefs });
    }
    catch (error) {
        console.error('Get preferences (token) error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});
const updatePreferencesSchema = zod_1.z.object({
    audit_notifications: zod_1.z.boolean().optional(),
    product_updates: zod_1.z.boolean().optional(),
    educational: zod_1.z.boolean().optional(),
    marketing: zod_1.z.boolean().optional(),
    unsubscribed_all: zod_1.z.boolean().optional(),
});
/**
 * POST /api/email/preferences?token=...
 * Update email preferences using a signed token.
 */
router.post('/preferences', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }
        const result = (0, email_preference_service_js_1.verifyUnsubscribeToken)(token);
        if (!result.valid || !result.userId) {
            res.status(400).json({ error: 'Invalid token' });
            return;
        }
        const body = updatePreferencesSchema.parse(req.body);
        const prefs = await (0, email_preference_service_js_1.updatePreferences)(result.userId, body);
        res.json({ preferences: prefs });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update preferences (token) error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
// =============================================
// Authenticated preference routes
// =============================================
/**
 * GET /api/email/my-preferences
 * Get email preferences for the authenticated user.
 */
router.get('/my-preferences', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const prefs = await (0, email_preference_service_js_1.getPreferences)(req.user.id);
        res.json({ preferences: prefs });
    }
    catch (error) {
        console.error('Get my preferences error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});
/**
 * PUT /api/email/my-preferences
 * Update email preferences for the authenticated user.
 */
router.put('/my-preferences', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const body = updatePreferencesSchema.parse(req.body);
        const prefs = await (0, email_preference_service_js_1.updatePreferences)(req.user.id, body);
        res.json({ preferences: prefs });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update my preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map