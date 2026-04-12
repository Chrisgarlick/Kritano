"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWebhooksRouter = void 0;
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const zod_1 = require("zod");
const webhook_service_js_1 = require("../../services/webhook.service.js");
const router = (0, express_1.Router)();
exports.userWebhooksRouter = router;
// All routes require authentication
router.use(auth_middleware_js_1.authenticate);
// POST /api/webhooks — create a webhook
router.post('/', async (req, res) => {
    try {
        const schema = zod_1.z.object({
            url: zod_1.z.string().url().max(2048),
            siteId: zod_1.z.string().uuid().nullable().optional(),
            events: zod_1.z.array(zod_1.z.string()).min(1),
        });
        const { url, siteId, events } = schema.parse(req.body);
        const userId = req.user.id;
        const result = await (0, webhook_service_js_1.createWebhook)(userId, siteId ?? null, url, events);
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request. Provide a valid URL and at least one event.' });
            return;
        }
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to create webhook' });
    }
});
// GET /api/webhooks — list webhooks
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const webhooks = await (0, webhook_service_js_1.listWebhooks)(userId);
        res.json({ webhooks });
    }
    catch (error) {
        console.error('List webhooks error:', error);
        res.status(500).json({ error: 'Failed to list webhooks' });
    }
});
// DELETE /api/webhooks/:id — delete a webhook
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const webhookId = req.params.id;
        if (!zod_1.z.string().uuid().safeParse(webhookId).success) {
            res.status(400).json({ error: 'Invalid webhook ID' });
            return;
        }
        await (0, webhook_service_js_1.deleteWebhook)(userId, webhookId);
        res.json({ success: true });
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to delete webhook' });
    }
});
// GET /api/webhooks/:id/deliveries — list recent deliveries
router.get('/:id/deliveries', async (req, res) => {
    try {
        const userId = req.user.id;
        const webhookId = req.params.id;
        if (!zod_1.z.string().uuid().safeParse(webhookId).success) {
            res.status(400).json({ error: 'Invalid webhook ID' });
            return;
        }
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const deliveries = await (0, webhook_service_js_1.listDeliveries)(userId, webhookId, limit);
        res.json({ deliveries });
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to list deliveries' });
    }
});
//# sourceMappingURL=user-webhooks.js.map