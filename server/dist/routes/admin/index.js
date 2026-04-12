"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const http_1 = __importDefault(require("http"));
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const admin_service_js_1 = require("../../services/admin.service.js");
const bug_report_service_js_1 = require("../../services/bug-report.service.js");
const feature_request_service_js_1 = require("../../services/feature-request.service.js");
const crm_js_1 = require("./crm.js");
const email_js_1 = require("./email.js");
const cms_js_1 = require("./cms.js");
const analytics_js_1 = require("./analytics.js");
const marketing_js_1 = require("./marketing.js");
const cold_prospects_js_1 = require("./cold-prospects.js");
const referrals_js_1 = require("./referrals.js");
const settings_js_1 = require("./settings.js");
const coming_soon_js_1 = require("./coming-soon.js");
const seo_js_1 = require("./seo.js");
const early_access_js_1 = require("./early-access.js");
const outreach_log_js_1 = require("./outreach-log.js");
const index_js_1 = require("../../db/index.js");
const router = (0, express_1.Router)();
exports.adminRouter = router;
// All admin routes require authentication + super admin
router.use(auth_middleware_js_1.authenticate, admin_middleware_js_1.requireSuperAdmin);
// Mount sub-routers
router.use('/crm', crm_js_1.adminCrmRouter);
router.use('/email', email_js_1.adminEmailRouter);
router.use('/cms', cms_js_1.adminCmsRouter);
router.use('/analytics', analytics_js_1.adminAnalyticsRouter);
router.use('/marketing', marketing_js_1.adminMarketingRouter);
router.use('/cold-prospects', cold_prospects_js_1.adminColdProspectsRouter);
router.use('/referrals', referrals_js_1.adminReferralsRouter);
router.use('/settings', settings_js_1.adminSettingsRouter);
router.use('/coming-soon', coming_soon_js_1.adminComingSoonRouter);
router.use('/seo', seo_js_1.adminSeoRouter);
router.use('/early-access', early_access_js_1.adminEarlyAccessRouter);
router.use('/outreach-log', outreach_log_js_1.adminOutreachLogRouter);
// =============================================
// Dashboard & Analytics
// =============================================
/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
    try {
        const stats = await (0, admin_service_js_1.getDashboardStats)();
        const health = await (0, admin_service_js_1.getSystemHealth)();
        res.json({ stats, health });
    }
    catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard', code: 'DASHBOARD_ERROR' });
    }
});
/**
 * GET /api/admin/analytics
 * Get analytics history
 */
router.get('/analytics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await (0, admin_service_js_1.getAnalyticsHistory)(Math.min(days, 365));
        res.json({ analytics });
    }
    catch (error) {
        console.error('Admin analytics error:', error);
        res.status(500).json({ error: 'Failed to load analytics', code: 'ANALYTICS_ERROR' });
    }
});
// =============================================
// User Management
// =============================================
/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'desc';
        const result = await (0, admin_service_js_1.listUsers)(page, limit, search, sortBy, sortOrder);
        res.json({
            users: result.users,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin list users error:', error);
        res.status(500).json({ error: 'Failed to list users', code: 'LIST_USERS_ERROR' });
    }
});
/**
 * GET /api/admin/users/:userId
 * Get user details
 */
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await (0, admin_service_js_1.getUserDetails)(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Admin get user error:', error);
        res.status(500).json({ error: 'Failed to get user', code: 'GET_USER_ERROR' });
    }
});
const updateUserSchema = zod_1.z.object({
    is_super_admin: zod_1.z.boolean().optional(),
    tier: zod_1.z.enum(['free', 'starter', 'pro', 'agency', 'enterprise']).optional(),
});
/**
 * PATCH /api/admin/users/:userId
 * Update user (e.g., super admin status)
 */
router.patch('/users/:userId', (0, validate_middleware_js_1.validateBody)(updateUserSchema), async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_super_admin, tier } = req.body;
        const user = await (0, admin_service_js_1.getUserDetails)(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            return;
        }
        if (is_super_admin !== undefined) {
            await (0, admin_service_js_1.updateUserSuperAdmin)(userId, is_super_admin);
            await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, is_super_admin ? 'grant_super_admin' : 'revoke_super_admin', 'user', userId, { email: user.email }, req);
        }
        if (tier !== undefined) {
            await (0, admin_service_js_1.updateUserTier)(userId, tier);
            await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_user_tier', 'user', userId, { email: user.email, tier }, req);
        }
        const updatedUser = await (0, admin_service_js_1.getUserDetails)(userId);
        res.json({ user: updatedUser });
    }
    catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ error: 'Failed to update user', code: 'UPDATE_USER_ERROR' });
    }
});
/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Prevent self-deletion
        if (userId === req.admin.id) {
            res.status(400).json({ error: 'Cannot delete yourself', code: 'CANNOT_DELETE_SELF' });
            return;
        }
        const user = await (0, admin_service_js_1.getUserDetails)(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            return;
        }
        await (0, admin_service_js_1.deleteUser)(userId);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_user', 'user', userId, { email: user.email }, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user', code: 'DELETE_USER_ERROR' });
    }
});
// =============================================
// Organization Management
// =============================================
/**
 * GET /api/admin/organizations
 * List all organizations
 */
router.get('/organizations', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const search = req.query.search;
        const tier = req.query.tier;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'desc';
        const result = await (0, admin_service_js_1.listOrganizations)(page, limit, search, tier, sortBy, sortOrder);
        res.json({
            organizations: result.organizations,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin list organizations error:', error);
        res.status(500).json({ error: 'Failed to list organizations', code: 'LIST_ORGS_ERROR' });
    }
});
/**
 * GET /api/admin/organizations/:orgId
 * Get organization details
 */
router.get('/organizations/:orgId', async (req, res) => {
    try {
        const { orgId } = req.params;
        const organization = await (0, admin_service_js_1.getOrganizationDetails)(orgId);
        if (!organization) {
            res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
            return;
        }
        res.json({ organization });
    }
    catch (error) {
        console.error('Admin get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization', code: 'GET_ORG_ERROR' });
    }
});
const updateOrgSubscriptionSchema = zod_1.z.object({
    tier: zod_1.z.enum(['free', 'starter', 'pro', 'agency', 'enterprise']).optional(),
    status: zod_1.z.enum(['active', 'past_due', 'canceled', 'trialing', 'paused']).optional(),
});
/**
 * PATCH /api/admin/organizations/:orgId/subscription
 * Update organization subscription (tier, status)
 */
router.patch('/organizations/:orgId/subscription', (0, validate_middleware_js_1.validateBody)(updateOrgSubscriptionSchema), async (req, res) => {
    try {
        const { orgId } = req.params;
        const { tier, status } = req.body;
        const org = await (0, admin_service_js_1.getOrganizationDetails)(orgId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
            return;
        }
        const changes = { previous: {} };
        if (tier && tier !== org.tier) {
            changes.previous = { ...changes.previous, tier: org.tier };
            changes.tier = tier;
            await (0, admin_service_js_1.updateOrganizationTier)(orgId, tier);
        }
        if (status && status !== org.status) {
            changes.previous = { ...changes.previous, status: org.status };
            changes.status = status;
            await (0, admin_service_js_1.updateSubscriptionStatus)(orgId, status);
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_subscription', 'organization', orgId, { ...changes, organization: org.name }, req);
        const updatedOrg = await (0, admin_service_js_1.getOrganizationDetails)(orgId);
        res.json({ organization: updatedOrg });
    }
    catch (error) {
        console.error('Admin update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription', code: 'UPDATE_SUB_ERROR' });
    }
});
// =============================================
// Activity Log
// =============================================
/**
 * GET /api/admin/activity
 * Get admin activity log
 */
router.get('/activity', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const adminId = req.query.adminId;
        const result = await (0, admin_service_js_1.getAdminActivityLog)(page, limit, adminId);
        res.json({
            activities: result.activities,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin activity log error:', error);
        res.status(500).json({ error: 'Failed to load activity log', code: 'ACTIVITY_LOG_ERROR' });
    }
});
// =============================================
// Check admin status (for frontend)
// =============================================
/**
 * GET /api/admin/check
 * Check if current user is a super admin
 */
router.get('/check', async (req, res) => {
    // If we get here, user is already verified as super admin by middleware
    res.json({
        isAdmin: true,
        admin: req.admin,
    });
});
// =============================================
// Worker Health & Management
// =============================================
const WORKER_HEALTH_URL = `http://localhost:${process.env.WORKER_HEALTH_PORT || '3002'}`;
/**
 * Proxy a request to the worker health server.
 */
function proxyWorkerRequest(path, method = 'GET') {
    return new Promise((resolve) => {
        const req = http_1.default.request(`${WORKER_HEALTH_URL}${path}`, { method, timeout: 5000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode || 200, data: JSON.parse(body) });
                }
                catch {
                    resolve({ status: res.statusCode || 500, data: { raw: body } });
                }
            });
        });
        req.on('error', () => {
            resolve({ status: 503, data: { status: 'unreachable', error: 'Worker is not responding' } });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 504, data: { status: 'timeout', error: 'Worker health check timed out' } });
        });
        req.end();
    });
}
/**
 * GET /api/admin/worker/status
 * Get detailed worker status.
 */
router.get('/worker/status', async (_req, res) => {
    try {
        const result = await proxyWorkerRequest('/status');
        res.status(result.status).json(result.data);
    }
    catch (error) {
        console.error('Admin worker status error:', error);
        res.status(500).json({ error: 'Failed to get worker status', code: 'WORKER_STATUS_ERROR' });
    }
});
/**
 * GET /api/admin/worker/health
 * Quick worker health check.
 */
router.get('/worker/health', async (_req, res) => {
    try {
        const result = await proxyWorkerRequest('/health');
        res.status(result.status).json(result.data);
    }
    catch (error) {
        console.error('Admin worker health error:', error);
        res.status(500).json({ error: 'Failed to check worker health', code: 'WORKER_HEALTH_ERROR' });
    }
});
/**
 * POST /api/admin/worker/restart
 * Trigger a graceful worker restart.
 * The worker process exits and the process manager (PM2/Docker/systemd) restarts it.
 */
router.post('/worker/restart', async (req, res) => {
    try {
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'restart_worker', 'system', null, { target: 'worker' }, req);
        const result = await proxyWorkerRequest('/restart', 'POST');
        if (result.status === 503) {
            res.status(503).json({ error: 'Worker is not running', code: 'WORKER_UNREACHABLE' });
            return;
        }
        res.json({ success: true, message: 'Worker restart initiated' });
    }
    catch (error) {
        console.error('Admin worker restart error:', error);
        res.status(500).json({ error: 'Failed to restart worker', code: 'WORKER_RESTART_ERROR' });
    }
});
/**
 * GET /api/admin/worker/queue
 * Get detailed queue backlog — all pending and processing jobs with user info.
 */
router.get('/worker/queue', async (_req, res) => {
    try {
        const result = await index_js_1.pool.query(`
      SELECT
        j.id,
        j.target_url,
        j.target_domain,
        j.status,
        j.max_pages,
        j.pages_found,
        j.pages_crawled,
        j.pages_audited,
        j.current_url,
        j.total_issues,
        j.critical_issues,
        j.worker_id,
        j.error_message,
        j.created_at,
        j.started_at,
        j.locked_at,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM audit_jobs j
      JOIN users u ON j.user_id = u.id
      WHERE j.status IN ('pending', 'discovering', 'ready', 'processing')
      ORDER BY
        CASE j.status WHEN 'processing' THEN 0 WHEN 'discovering' THEN 1 WHEN 'ready' THEN 2 WHEN 'pending' THEN 3 END,
        j.created_at ASC
    `);
        // Also get recent failed jobs (last 24h)
        const failedResult = await index_js_1.pool.query(`
      SELECT
        j.id,
        j.target_url,
        j.target_domain,
        j.status,
        j.error_message,
        j.created_at,
        j.started_at,
        j.completed_at,
        u.email as user_email,
        u.first_name as user_first_name
      FROM audit_jobs j
      JOIN users u ON j.user_id = u.id
      WHERE j.status = 'failed'
        AND j.completed_at > NOW() - INTERVAL '24 hours'
      ORDER BY j.completed_at DESC
      LIMIT 20
    `);
        // Get summary counts
        const countsResult = await index_js_1.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'discovering') as discovering,
        COUNT(*) FILTER (WHERE status = 'ready') as ready,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as completed_24h,
        COUNT(*) FILTER (WHERE status = 'failed' AND completed_at > NOW() - INTERVAL '24 hours') as failed_24h,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (
          WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days' AND started_at IS NOT NULL
        ) as avg_duration_seconds
      FROM audit_jobs
    `);
        res.json({
            jobs: result.rows,
            recentFailed: failedResult.rows,
            counts: {
                pending: parseInt(countsResult.rows[0].pending, 10),
                discovering: parseInt(countsResult.rows[0].discovering, 10),
                ready: parseInt(countsResult.rows[0].ready, 10),
                processing: parseInt(countsResult.rows[0].processing, 10),
                completed24h: parseInt(countsResult.rows[0].completed_24h, 10),
                failed24h: parseInt(countsResult.rows[0].failed_24h, 10),
                avgDurationSeconds: countsResult.rows[0].avg_duration_seconds
                    ? Math.round(parseFloat(countsResult.rows[0].avg_duration_seconds))
                    : null,
            },
        });
    }
    catch (error) {
        console.error('Admin queue backlog error:', error);
        res.status(500).json({ error: 'Failed to get queue backlog', code: 'QUEUE_BACKLOG_ERROR' });
    }
});
/**
 * POST /api/admin/worker/queue/:id/cancel
 * Admin-cancel any audit job (pending or processing).
 */
router.post('/worker/queue/:id/cancel', async (req, res) => {
    try {
        const jobId = req.params.id;
        const result = await index_js_1.pool.query(`UPDATE audit_jobs
       SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')
       RETURNING id, target_domain, status`, [jobId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job not found or already finished', code: 'JOB_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'cancel_audit', 'audit_job', jobId, { target_domain: result.rows[0].target_domain }, req);
        res.json({ success: true, message: 'Job cancelled' });
    }
    catch (error) {
        console.error('Admin cancel job error:', error);
        res.status(500).json({ error: 'Failed to cancel job', code: 'CANCEL_JOB_ERROR' });
    }
});
/**
 * POST /api/admin/worker/queue/cancel-all
 * Cancel all pending jobs.
 */
router.post('/worker/queue/cancel-all', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`UPDATE audit_jobs
       SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
       WHERE status IN ('pending', 'discovering', 'ready')
       RETURNING id`);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'cancel_all_pending', 'audit_job', 'bulk', { count: result.rowCount }, req);
        res.json({ success: true, cancelled: result.rowCount });
    }
    catch (error) {
        console.error('Admin cancel all error:', error);
        res.status(500).json({ error: 'Failed to cancel jobs', code: 'CANCEL_ALL_ERROR' });
    }
});
// =============================================
// Bug Reports Management
// =============================================
/**
 * GET /api/admin/bug-reports
 * List all bug reports (paginated, filterable)
 */
router.get('/bug-reports', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const status = req.query.status;
        const severity = req.query.severity;
        const category = req.query.category;
        const search = req.query.search;
        const result = await bug_report_service_js_1.bugReportService.listAll({
            page,
            limit,
            status,
            severity,
            category,
            search,
        });
        res.json({
            items: result.items,
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit),
        });
    }
    catch (error) {
        console.error('Admin list bug reports error:', error);
        res.status(500).json({ error: 'Failed to list bug reports', code: 'LIST_BUG_REPORTS_ERROR' });
    }
});
/**
 * GET /api/admin/bug-reports/stats
 * Get bug report statistics for dashboard
 */
router.get('/bug-reports/stats', async (req, res) => {
    try {
        const stats = await bug_report_service_js_1.bugReportService.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Admin bug report stats error:', error);
        res.status(500).json({ error: 'Failed to get stats', code: 'BUG_REPORT_STATS_ERROR' });
    }
});
/**
 * GET /api/admin/bug-reports/:id
 * Get a single bug report with comments
 */
router.get('/bug-reports/:id', async (req, res) => {
    try {
        const report = await bug_report_service_js_1.bugReportService.getWithComments(req.params.id);
        if (!report) {
            res.status(404).json({ error: 'Report not found', code: 'REPORT_NOT_FOUND' });
            return;
        }
        res.json({ report });
    }
    catch (error) {
        console.error('Admin get bug report error:', error);
        res.status(500).json({ error: 'Failed to get bug report', code: 'GET_BUG_REPORT_ERROR' });
    }
});
const updateBugReportSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: zod_1.z.enum(['urgent', 'high', 'medium', 'low']).nullable().optional(),
    adminNotes: zod_1.z.string().max(5000).optional(),
    resolutionNotes: zod_1.z.string().max(5000).optional(),
    assignedTo: zod_1.z.string().uuid().nullable().optional(),
});
/**
 * PATCH /api/admin/bug-reports/:id
 * Update a bug report (status, priority, notes)
 */
router.patch('/bug-reports/:id', async (req, res) => {
    try {
        const data = updateBugReportSchema.parse(req.body);
        const report = await bug_report_service_js_1.bugReportService.update(req.params.id, data);
        if (!report) {
            res.status(404).json({ error: 'Report not found', code: 'REPORT_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_bug_report', 'bug_report', req.params.id, data, req);
        res.json({ report });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Admin update bug report error:', error);
        res.status(500).json({ error: 'Failed to update bug report', code: 'UPDATE_BUG_REPORT_ERROR' });
    }
});
/**
 * POST /api/admin/bug-reports/:id/comments
 * Add an admin comment to a bug report
 */
router.post('/bug-reports/:id/comments', async (req, res) => {
    try {
        const { content } = zod_1.z.object({ content: zod_1.z.string().min(1).max(2000) }).parse(req.body);
        const comment = await bug_report_service_js_1.bugReportService.addComment({
            reportId: req.params.id,
            userId: req.admin.id,
            content,
            isAdmin: true,
        });
        res.status(201).json({ comment });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: 'Report not found', code: 'REPORT_NOT_FOUND' });
            return;
        }
        console.error('Admin add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment', code: 'ADD_COMMENT_ERROR' });
    }
});
/**
 * DELETE /api/admin/bug-reports/:id
 * Soft delete a bug report
 */
router.delete('/bug-reports/:id', async (req, res) => {
    try {
        await bug_report_service_js_1.bugReportService.softDelete(req.params.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_bug_report', 'bug_report', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete bug report error:', error);
        res.status(500).json({ error: 'Failed to delete bug report', code: 'DELETE_BUG_REPORT_ERROR' });
    }
});
// =============================================
// Feature Requests Management
// =============================================
/**
 * GET /api/admin/feature-requests
 * List all feature requests (paginated, filterable)
 */
router.get('/feature-requests', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const status = req.query.status;
        const impact = req.query.impact;
        const category = req.query.category;
        const search = req.query.search;
        const result = await feature_request_service_js_1.featureRequestService.listAll({
            page,
            limit,
            status,
            impact,
            category,
            search,
        });
        res.json({
            items: result.items,
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit),
        });
    }
    catch (error) {
        console.error('Admin list feature requests error:', error);
        res.status(500).json({ error: 'Failed to list feature requests', code: 'LIST_FEATURE_REQUESTS_ERROR' });
    }
});
/**
 * GET /api/admin/feature-requests/stats
 * Get feature request statistics for dashboard
 */
router.get('/feature-requests/stats', async (req, res) => {
    try {
        const stats = await feature_request_service_js_1.featureRequestService.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Admin feature request stats error:', error);
        res.status(500).json({ error: 'Failed to get stats', code: 'FEATURE_REQUEST_STATS_ERROR' });
    }
});
/**
 * GET /api/admin/feature-requests/:id
 * Get a single feature request with comments
 */
router.get('/feature-requests/:id', async (req, res) => {
    try {
        const request = await feature_request_service_js_1.featureRequestService.getWithComments(req.params.id);
        if (!request) {
            res.status(404).json({ error: 'Request not found', code: 'REQUEST_NOT_FOUND' });
            return;
        }
        res.json({ request });
    }
    catch (error) {
        console.error('Admin get feature request error:', error);
        res.status(500).json({ error: 'Failed to get feature request', code: 'GET_FEATURE_REQUEST_ERROR' });
    }
});
const updateFeatureRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(['submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined']).optional(),
    priority: zod_1.z.enum(['urgent', 'high', 'medium', 'low']).nullable().optional(),
    adminNotes: zod_1.z.string().max(5000).optional(),
    resolutionNotes: zod_1.z.string().max(5000).optional(),
    assignedTo: zod_1.z.string().uuid().nullable().optional(),
});
/**
 * PATCH /api/admin/feature-requests/:id
 * Update a feature request (status, priority, notes)
 */
router.patch('/feature-requests/:id', async (req, res) => {
    try {
        const data = updateFeatureRequestSchema.parse(req.body);
        const request = await feature_request_service_js_1.featureRequestService.update(req.params.id, data);
        if (!request) {
            res.status(404).json({ error: 'Request not found', code: 'REQUEST_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_feature_request', 'feature_request', req.params.id, data, req);
        res.json({ request });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Admin update feature request error:', error);
        res.status(500).json({ error: 'Failed to update feature request', code: 'UPDATE_FEATURE_REQUEST_ERROR' });
    }
});
/**
 * POST /api/admin/feature-requests/:id/comments
 * Add an admin comment to a feature request
 */
router.post('/feature-requests/:id/comments', async (req, res) => {
    try {
        const { content } = zod_1.z.object({ content: zod_1.z.string().min(1).max(2000) }).parse(req.body);
        const comment = await feature_request_service_js_1.featureRequestService.addComment({
            requestId: req.params.id,
            userId: req.admin.id,
            content,
            isAdmin: true,
        });
        res.status(201).json({ comment });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: 'Request not found', code: 'REQUEST_NOT_FOUND' });
            return;
        }
        console.error('Admin add feature request comment error:', error);
        res.status(500).json({ error: 'Failed to add comment', code: 'ADD_COMMENT_ERROR' });
    }
});
/**
 * DELETE /api/admin/feature-requests/:id
 * Soft delete a feature request
 */
router.delete('/feature-requests/:id', async (req, res) => {
    try {
        await feature_request_service_js_1.featureRequestService.softDelete(req.params.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_feature_request', 'feature_request', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete feature request error:', error);
        res.status(500).json({ error: 'Failed to delete feature request', code: 'DELETE_FEATURE_REQUEST_ERROR' });
    }
});
// ============================================================
// SCHEDULED AUDITS ADMIN ENDPOINTS
// ============================================================
const schedule_service_js_1 = require("../../services/schedule.service.js");
/**
 * GET /admin/schedules/stats
 * Aggregate schedule statistics
 */
router.get('/schedules/stats', async (req, res) => {
    try {
        const stats = await (0, schedule_service_js_1.getAdminScheduleStats)();
        res.json({ stats });
    }
    catch (error) {
        console.error('Admin schedule stats error:', error);
        res.status(500).json({ error: 'Failed to get schedule stats', code: 'ADMIN_SCHEDULE_STATS_ERROR' });
    }
});
/**
 * GET /admin/schedules
 * List all schedules with user/site info
 */
router.get('/schedules', async (req, res) => {
    try {
        const status = req.query.status;
        const search = req.query.search;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const result = await (0, schedule_service_js_1.getAdminSchedulesList)({ status, search, page, limit });
        res.json(result);
    }
    catch (error) {
        console.error('Admin list schedules error:', error);
        res.status(500).json({ error: 'Failed to list schedules', code: 'ADMIN_LIST_SCHEDULES_ERROR' });
    }
});
/**
 * GET /admin/schedules/:id
 * Get schedule detail
 */
router.get('/schedules/:id', async (req, res) => {
    try {
        const schedule = await (0, schedule_service_js_1.adminGetScheduleById)(req.params.id);
        if (!schedule) {
            res.status(404).json({ error: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
            return;
        }
        res.json({ schedule });
    }
    catch (error) {
        console.error('Admin get schedule error:', error);
        res.status(500).json({ error: 'Failed to get schedule', code: 'ADMIN_GET_SCHEDULE_ERROR' });
    }
});
/**
 * PATCH /admin/schedules/:id
 * Admin override (force enable/disable, set max failures)
 */
router.patch('/schedules/:id', async (req, res) => {
    try {
        const { enabled, paused_reason, max_consecutive_failures } = req.body;
        const schedule = await (0, schedule_service_js_1.adminUpdateSchedule)(req.params.id, {
            enabled,
            paused_reason,
            max_consecutive_failures,
        });
        if (!schedule) {
            res.status(404).json({ error: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_schedule', 'audit_schedule', req.params.id, { enabled, paused_reason, max_consecutive_failures }, req);
        res.json({ schedule });
    }
    catch (error) {
        console.error('Admin update schedule error:', error);
        res.status(500).json({ error: 'Failed to update schedule', code: 'ADMIN_UPDATE_SCHEDULE_ERROR' });
    }
});
/**
 * DELETE /admin/schedules/:id
 * Admin delete a schedule
 */
router.delete('/schedules/:id', async (req, res) => {
    try {
        await (0, schedule_service_js_1.adminDeleteSchedule)(req.params.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_schedule', 'audit_schedule', req.params.id, {}, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete schedule error:', error);
        res.status(500).json({ error: 'Failed to delete schedule', code: 'ADMIN_DELETE_SCHEDULE_ERROR' });
    }
});
//# sourceMappingURL=index.js.map