"use strict";
/**
 * Cookie Consent Routes
 *
 * Public endpoint to log cookie consent for GDPR compliance.
 * No auth required — fires before users authenticate in many cases.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieConsentRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const index_js_1 = require("../../db/index.js");
const router = (0, express_1.Router)();
exports.cookieConsentRouter = router;
// Simple rate limiter: 10 per minute per IP
const rateLimitMap = new Map();
const ConsentBodySchema = zod_1.z.object({
    consent_version: zod_1.z.string().max(20),
    categories: zod_1.z.object({
        necessary: zod_1.z.literal(true),
        analytics: zod_1.z.boolean(),
        marketing: zod_1.z.boolean(),
    }),
    action: zod_1.z.enum(['accept_all', 'reject_all', 'custom', 'withdraw']),
    page_url: zod_1.z.string().max(2000).optional(),
});
// POST /api/consent/cookies
router.post('/', async (req, res) => {
    try {
        const ip = (req.ip || req.socket.remoteAddress || 'unknown');
        const now = Date.now();
        // Rate limit check
        const entry = rateLimitMap.get(ip);
        if (entry && entry.resetAt > now) {
            if (entry.count >= 10) {
                res.status(429).json({ error: 'Too many requests' });
                return;
            }
            entry.count++;
        }
        else {
            rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
        }
        // Periodic cleanup
        if (rateLimitMap.size > 10000) {
            for (const [key, val] of rateLimitMap) {
                if (val.resetAt < now)
                    rateLimitMap.delete(key);
            }
        }
        const body = ConsentBodySchema.parse(req.body);
        // Extract user_id if authenticated (cookie-based auth may have set req.user)
        const userId = req.user?.id || null;
        await index_js_1.pool.query(`INSERT INTO cookie_consent_logs (user_id, consent_version, categories, action, ip_address, user_agent, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            userId,
            body.consent_version,
            JSON.stringify(body.categories),
            body.action,
            ip !== 'unknown' ? ip : null,
            req.headers['user-agent'] || null,
            body.page_url || null,
        ]);
        res.json({ success: true, logged_at: new Date().toISOString() });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid consent data' });
            return;
        }
        console.error('Cookie consent log error:', error);
        res.status(500).json({ error: 'Failed to log consent' });
    }
});
//# sourceMappingURL=cookie-consent.js.map