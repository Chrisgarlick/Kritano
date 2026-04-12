"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const rateLimit_middleware_js_1 = require("../../middleware/rateLimit.middleware.js");
const gdpr_service_js_1 = require("../../services/gdpr.service.js");
const router = (0, express_1.Router)();
// Rate limiters
const exportRateLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 3,
    blockDurationMs: 15 * 60 * 1000,
    keyGenerator: (req) => `export:${req.user?.id}`,
});
const deleteRateLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 3,
    blockDurationMs: 15 * 60 * 1000,
    keyGenerator: (req) => `delete:${req.user?.id}`,
});
// Schemas
const exportSchema = zod_1.z.object({
    password: zod_1.z.string().min(1, 'Password is required'),
});
const deleteSchema = zod_1.z.object({
    password: zod_1.z.string().min(1, 'Password is required'),
    confirmText: zod_1.z.literal('DELETE MY ACCOUNT', {
        errorMap: () => ({ message: 'You must type "DELETE MY ACCOUNT" to confirm.' }),
    }),
});
/**
 * POST /api/account/export - Request a data export
 */
router.post('/export', auth_middleware_js_1.authenticate, exportRateLimiter, (0, validate_middleware_js_1.validateBody)(exportSchema), async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;
        const valid = await gdpr_service_js_1.gdprService.verifyPassword(userId, password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
            return;
        }
        const exportId = await gdpr_service_js_1.gdprService.requestExport(userId);
        // Process export immediately instead of waiting for worker poll
        try {
            await gdpr_service_js_1.gdprService.processExport(exportId);
            res.json({ message: 'Your data export is ready to download.', exportId, ready: true });
        }
        catch (exportError) {
            console.error('Export processing error:', exportError);
            res.status(202).json({ message: 'Export started. You will be notified when it is ready.', exportId, ready: false });
        }
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to start export', code: 'EXPORT_FAILED' });
    }
});
/**
 * GET /api/account/export/status - Get latest export status
 */
router.get('/export/status', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const exportInfo = await gdpr_service_js_1.gdprService.getLatestExport(userId);
        res.json({ export: exportInfo });
    }
    catch (error) {
        console.error('Export status error:', error);
        res.status(500).json({ error: 'Failed to get export status', code: 'EXPORT_STATUS_FAILED' });
    }
});
/**
 * GET /api/account/export/:id/download - Download an export file
 */
router.get('/export/:id/download', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { filePath, fileName } = await gdpr_service_js_1.gdprService.getExportDownload(userId, req.params.id);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        const stream = await import('fs');
        stream.createReadStream(filePath).pipe(res);
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to download export', code: 'DOWNLOAD_FAILED' });
    }
});
/**
 * POST /api/account/delete - Request account deletion
 */
router.post('/delete', auth_middleware_js_1.authenticate, deleteRateLimiter, (0, validate_middleware_js_1.validateBody)(deleteSchema), async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;
        const valid = await gdpr_service_js_1.gdprService.verifyPassword(userId, password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
            return;
        }
        const { scheduledFor } = await gdpr_service_js_1.gdprService.requestAccountDeletion(userId);
        res.json({
            message: 'Account deletion scheduled. You can cancel at any time before the deletion date.',
            scheduledFor,
        });
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to schedule deletion', code: 'DELETION_FAILED' });
    }
});
/**
 * POST /api/account/cancel-deletion - Cancel a pending deletion
 */
router.post('/cancel-deletion', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        await gdpr_service_js_1.gdprService.cancelAccountDeletion(userId);
        res.json({ message: 'Account deletion cancelled. Your account is active again.' });
    }
    catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ error: error.message || 'Failed to cancel deletion', code: 'CANCEL_FAILED' });
    }
});
exports.accountRouter = router;
//# sourceMappingURL=index.js.map