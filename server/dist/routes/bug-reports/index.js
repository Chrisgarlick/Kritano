"use strict";
/**
 * Bug Reports Routes (User-facing)
 *
 * Endpoints for users to create and view their bug reports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const bug_report_service_js_1 = require("../../services/bug-report.service.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_js_1.authenticate);
// =============================================
// Validation Schemas
// =============================================
const createReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: zod_1.z.string().min(20, 'Please provide more detail (20+ characters)').max(5000),
    severity: zod_1.z.enum(['critical', 'major', 'minor', 'trivial']),
    category: zod_1.z.enum(['ui', 'functionality', 'performance', 'data', 'security', 'other']),
    pageUrl: zod_1.z.string().url().optional().nullable(),
    screenshotUrl: zod_1.z.string().url().optional().nullable(),
    screenshotKey: zod_1.z.string().optional().nullable(),
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
 * POST /api/bug-reports
 * Create a new bug report
 */
router.post('/', async (req, res) => {
    try {
        const data = createReportSchema.parse(req.body);
        const report = await bug_report_service_js_1.bugReportService.create({
            userId: req.user.id,
            title: data.title,
            description: data.description,
            severity: data.severity,
            category: data.category,
            pageUrl: data.pageUrl || undefined,
            userAgent: req.headers['user-agent'],
            screenSize: data.screenSize || undefined,
            browserInfo: data.browserInfo || undefined,
            screenshotUrl: data.screenshotUrl || undefined,
            screenshotKey: data.screenshotKey || undefined,
        });
        res.status(201).json({ report });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Failed to create bug report:', error);
        res.status(500).json({ error: 'Failed to create bug report' });
    }
});
/**
 * GET /api/bug-reports/mine
 * List the current user's bug reports
 */
router.get('/mine', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const status = req.query.status;
        const result = await bug_report_service_js_1.bugReportService.listByUser(req.user.id, {
            page,
            limit,
            status,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Failed to list bug reports:', error);
        res.status(500).json({ error: 'Failed to list bug reports' });
    }
});
/**
 * GET /api/bug-reports/:id
 * Get a single bug report (user can only view their own)
 */
router.get('/:id', async (req, res) => {
    try {
        const report = await bug_report_service_js_1.bugReportService.getById(req.params.id, req.user.id);
        if (!report) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }
        res.json({ report });
    }
    catch (error) {
        console.error('Failed to get bug report:', error);
        res.status(500).json({ error: 'Failed to get bug report' });
    }
});
/**
 * GET /api/bug-reports/:id/comments
 * Get comments for a bug report (user can only view their own report's comments)
 */
router.get('/:id/comments', async (req, res) => {
    try {
        // First verify user owns this report
        const report = await bug_report_service_js_1.bugReportService.getById(req.params.id, req.user.id);
        if (!report) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }
        const reportWithComments = await bug_report_service_js_1.bugReportService.getWithComments(req.params.id);
        res.json({ comments: reportWithComments?.comments || [] });
    }
    catch (error) {
        console.error('Failed to get comments:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});
/**
 * POST /api/bug-reports/:id/comments
 * Add a comment to a bug report (user can only comment on their own)
 */
router.post('/:id/comments', async (req, res) => {
    try {
        const { content } = addCommentSchema.parse(req.body);
        const comment = await bug_report_service_js_1.bugReportService.addComment({
            reportId: req.params.id,
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
            res.status(404).json({ error: 'Report not found' });
            return;
        }
        console.error('Failed to add comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map