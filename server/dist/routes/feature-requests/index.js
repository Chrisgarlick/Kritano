"use strict";
/**
 * Feature Requests Routes (User-facing)
 *
 * Endpoints for users to create and view their feature requests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const feature_request_service_js_1 = require("../../services/feature-request.service.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_js_1.authenticate);
// =============================================
// Validation Schemas
// =============================================
const createRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: zod_1.z.string().min(20, 'Please provide more detail (20+ characters)').max(5000),
    impact: zod_1.z.enum(['nice_to_have', 'would_be_helpful', 'important', 'critical_for_workflow']),
    category: zod_1.z.enum(['accessibility', 'reporting', 'ui_ux', 'integrations', 'performance', 'other']),
    pageUrl: zod_1.z.string().url().optional().nullable(),
    browserInfo: zod_1.z.object({
        name: zod_1.z.string(),
        version: zod_1.z.string(),
        os: zod_1.z.string(),
    }).optional().nullable(),
    screenSize: zod_1.z.string().optional().nullable(),
});
const addCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment cannot be empty').max(2000),
});
// =============================================
// Routes
// =============================================
/**
 * POST /api/feature-requests
 * Create a new feature request
 */
router.post('/', async (req, res) => {
    try {
        const data = createRequestSchema.parse(req.body);
        const request = await feature_request_service_js_1.featureRequestService.create({
            userId: req.user.id,
            title: data.title,
            description: data.description,
            impact: data.impact,
            category: data.category,
            pageUrl: data.pageUrl || undefined,
            userAgent: req.headers['user-agent'],
            screenSize: data.screenSize || undefined,
            browserInfo: data.browserInfo || undefined,
        });
        res.status(201).json({ request });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Failed to create feature request:', error);
        res.status(500).json({ error: 'Failed to create feature request' });
    }
});
/**
 * GET /api/feature-requests/mine
 * List the current user's feature requests
 */
router.get('/mine', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const status = req.query.status;
        const result = await feature_request_service_js_1.featureRequestService.listByUser(req.user.id, {
            page,
            limit,
            status,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Failed to list feature requests:', error);
        res.status(500).json({ error: 'Failed to list feature requests' });
    }
});
/**
 * GET /api/feature-requests/:id
 * Get a single feature request (user can only view their own)
 */
router.get('/:id', async (req, res) => {
    try {
        const request = await feature_request_service_js_1.featureRequestService.getById(req.params.id, req.user.id);
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        res.json({ request });
    }
    catch (error) {
        console.error('Failed to get feature request:', error);
        res.status(500).json({ error: 'Failed to get feature request' });
    }
});
/**
 * GET /api/feature-requests/:id/comments
 * Get comments for a feature request (user can only view their own request's comments)
 */
router.get('/:id/comments', async (req, res) => {
    try {
        // First verify user owns this request
        const request = await feature_request_service_js_1.featureRequestService.getById(req.params.id, req.user.id);
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        const requestWithComments = await feature_request_service_js_1.featureRequestService.getWithComments(req.params.id);
        res.json({ comments: requestWithComments?.comments || [] });
    }
    catch (error) {
        console.error('Failed to get comments:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});
/**
 * POST /api/feature-requests/:id/comments
 * Add a comment to a feature request (user can only comment on their own)
 */
router.post('/:id/comments', async (req, res) => {
    try {
        const { content } = addCommentSchema.parse(req.body);
        const comment = await feature_request_service_js_1.featureRequestService.addComment({
            requestId: req.params.id,
            userId: req.user.id,
            content,
            isAdmin: false,
        });
        res.status(201).json({ comment });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        console.error('Failed to add comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map