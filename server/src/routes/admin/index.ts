import { Router } from 'express';
import type { Response } from 'express';
import http from 'http';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin, logAdminActivity, type AdminRequest } from '../../middleware/admin.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  getDashboardStats,
  getAnalyticsHistory,
  listUsers,
  getUserDetails,
  updateUserSuperAdmin,
  deleteUser,
  listOrganizations,
  getOrganizationDetails,
  updateOrganizationTier,
  updateSubscriptionStatus,
  getAdminActivityLog,
  getSystemHealth,
} from '../../services/admin.service.js';
import { bugReportService } from '../../services/bug-report.service.js';
import { featureRequestService } from '../../services/feature-request.service.js';
import { adminCrmRouter } from './crm.js';
import { adminEmailRouter } from './email.js';
import { adminCmsRouter } from './cms.js';
import { adminAnalyticsRouter } from './analytics.js';
import { adminMarketingRouter } from './marketing.js';
import { adminColdProspectsRouter } from './cold-prospects.js';
import { adminReferralsRouter } from './referrals.js';
import { adminSettingsRouter } from './settings.js';
import { adminComingSoonRouter } from './coming-soon.js';
import { adminSeoRouter } from './seo.js';
import { adminEarlyAccessRouter } from './early-access.js';
import { pool } from '../../db/index.js';

const router = Router();

// All admin routes require authentication + super admin
router.use(authenticate, requireSuperAdmin);

// Mount sub-routers
router.use('/crm', adminCrmRouter);
router.use('/email', adminEmailRouter);
router.use('/cms', adminCmsRouter);
router.use('/analytics', adminAnalyticsRouter);
router.use('/marketing', adminMarketingRouter);
router.use('/cold-prospects', adminColdProspectsRouter);
router.use('/referrals', adminReferralsRouter);
router.use('/settings', adminSettingsRouter);
router.use('/coming-soon', adminComingSoonRouter);
router.use('/seo', adminSeoRouter);
router.use('/early-access', adminEarlyAccessRouter);

// =============================================
// Dashboard & Analytics
// =============================================

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getDashboardStats();
    const health = await getSystemHealth();

    res.json({ stats, health });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard', code: 'DASHBOARD_ERROR' });
  }
});

/**
 * GET /api/admin/analytics
 * Get analytics history
 */
router.get('/analytics', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await getAnalyticsHistory(Math.min(days, 365));

    res.json({ analytics });
  } catch (error) {
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
router.get('/users', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const result = await listUsers(page, limit, search, sortBy, sortOrder);

    res.json({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users', code: 'LIST_USERS_ERROR' });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details
 */
router.get('/users/:userId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await getUserDetails(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Failed to get user', code: 'GET_USER_ERROR' });
  }
});

const updateUserSchema = z.object({
  is_super_admin: z.boolean().optional(),
});

/**
 * PATCH /api/admin/users/:userId
 * Update user (e.g., super admin status)
 */
router.patch(
  '/users/:userId',
  validateBody(updateUserSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { is_super_admin } = req.body;

      const user = await getUserDetails(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        return;
      }

      if (is_super_admin !== undefined) {
        await updateUserSuperAdmin(userId, is_super_admin);
        await logAdminActivity(
          req.admin!.id,
          is_super_admin ? 'grant_super_admin' : 'revoke_super_admin',
          'user',
          userId,
          { email: user.email },
          req
        );
      }

      const updatedUser = await getUserDetails(userId);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ error: 'Failed to update user', code: 'UPDATE_USER_ERROR' });
    }
  }
);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.admin!.id) {
      res.status(400).json({ error: 'Cannot delete yourself', code: 'CANNOT_DELETE_SELF' });
      return;
    }

    const user = await getUserDetails(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    await deleteUser(userId);

    await logAdminActivity(
      req.admin!.id,
      'delete_user',
      'user',
      userId,
      { email: user.email },
      req
    );

    res.json({ success: true });
  } catch (error) {
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
router.get('/organizations', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const search = req.query.search as string | undefined;
    const tier = req.query.tier as string | undefined;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const result = await listOrganizations(page, limit, search, tier, sortBy, sortOrder);

    res.json({
      organizations: result.organizations,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list organizations error:', error);
    res.status(500).json({ error: 'Failed to list organizations', code: 'LIST_ORGS_ERROR' });
  }
});

/**
 * GET /api/admin/organizations/:orgId
 * Get organization details
 */
router.get('/organizations/:orgId', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const organization = await getOrganizationDetails(orgId);

    if (!organization) {
      res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
      return;
    }

    res.json({ organization });
  } catch (error) {
    console.error('Admin get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization', code: 'GET_ORG_ERROR' });
  }
});

const updateOrgSubscriptionSchema = z.object({
  tier: z.enum(['free', 'starter', 'pro', 'agency', 'enterprise']).optional(),
  status: z.enum(['active', 'past_due', 'canceled', 'trialing', 'paused']).optional(),
});

/**
 * PATCH /api/admin/organizations/:orgId/subscription
 * Update organization subscription (tier, status)
 */
router.patch(
  '/organizations/:orgId/subscription',
  validateBody(updateOrgSubscriptionSchema),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { orgId } = req.params;
      const { tier, status } = req.body;

      const org = await getOrganizationDetails(orgId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
        return;
      }

      const changes: Record<string, unknown> = { previous: {} };

      if (tier && tier !== org.tier) {
        changes.previous = { ...changes.previous as object, tier: org.tier };
        changes.tier = tier;
        await updateOrganizationTier(orgId, tier);
      }

      if (status && status !== org.status) {
        changes.previous = { ...changes.previous as object, status: org.status };
        changes.status = status;
        await updateSubscriptionStatus(orgId, status);
      }

      await logAdminActivity(
        req.admin!.id,
        'update_subscription',
        'organization',
        orgId,
        { ...changes, organization: org.name },
        req
      );

      const updatedOrg = await getOrganizationDetails(orgId);
      res.json({ organization: updatedOrg });
    } catch (error) {
      console.error('Admin update subscription error:', error);
      res.status(500).json({ error: 'Failed to update subscription', code: 'UPDATE_SUB_ERROR' });
    }
  }
);

// =============================================
// Activity Log
// =============================================

/**
 * GET /api/admin/activity
 * Get admin activity log
 */
router.get('/activity', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const adminId = req.query.adminId as string | undefined;

    const result = await getAdminActivityLog(page, limit, adminId);

    res.json({
      activities: result.activities,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
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
router.get('/check', async (req: AdminRequest, res: Response): Promise<void> => {
  // If we get here, user is already verified as super admin by middleware
  res.json({
    isAdmin: true,
    admin: req.admin,
  });
});

// =============================================
// Worker Health & Management
// =============================================

const WORKER_HEALTH_URL = `http://localhost:${process.env.WORKER_HEALTH_PORT || '3001'}`;

/**
 * Proxy a request to the worker health server.
 */
function proxyWorkerRequest(path: string, method: 'GET' | 'POST' = 'GET'): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const req = http.request(`${WORKER_HEALTH_URL}${path}`, { method, timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 200, data: JSON.parse(body) });
        } catch {
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
router.get('/worker/status', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await proxyWorkerRequest('/status');
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Admin worker status error:', error);
    res.status(500).json({ error: 'Failed to get worker status', code: 'WORKER_STATUS_ERROR' });
  }
});

/**
 * GET /api/admin/worker/health
 * Quick worker health check.
 */
router.get('/worker/health', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await proxyWorkerRequest('/health');
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Admin worker health error:', error);
    res.status(500).json({ error: 'Failed to check worker health', code: 'WORKER_HEALTH_ERROR' });
  }
});

/**
 * POST /api/admin/worker/restart
 * Trigger a graceful worker restart.
 * The worker process exits and the process manager (PM2/Docker/systemd) restarts it.
 */
router.post('/worker/restart', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await logAdminActivity(
      req.admin!.id,
      'restart_worker',
      'system',
      'worker',
      {},
      req
    );

    const result = await proxyWorkerRequest('/restart', 'POST');

    if (result.status === 503) {
      res.status(503).json({ error: 'Worker is not running', code: 'WORKER_UNREACHABLE' });
      return;
    }

    res.json({ success: true, message: 'Worker restart initiated' });
  } catch (error) {
    console.error('Admin worker restart error:', error);
    res.status(500).json({ error: 'Failed to restart worker', code: 'WORKER_RESTART_ERROR' });
  }
});

/**
 * GET /api/admin/worker/queue
 * Get detailed queue backlog — all pending and processing jobs with user info.
 */
router.get('/worker/queue', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
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
    const failedResult = await pool.query(`
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
    const countsResult = await pool.query(`
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
  } catch (error) {
    console.error('Admin queue backlog error:', error);
    res.status(500).json({ error: 'Failed to get queue backlog', code: 'QUEUE_BACKLOG_ERROR' });
  }
});

/**
 * POST /api/admin/worker/queue/:id/cancel
 * Admin-cancel any audit job (pending or processing).
 */
router.post('/worker/queue/:id/cancel', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id;

    const result = await pool.query(
      `UPDATE audit_jobs
       SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'discovering', 'ready', 'processing')
       RETURNING id, target_domain, status`,
      [jobId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Job not found or already finished', code: 'JOB_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'cancel_audit',
      'audit_job',
      jobId,
      { target_domain: result.rows[0].target_domain },
      req
    );

    res.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    console.error('Admin cancel job error:', error);
    res.status(500).json({ error: 'Failed to cancel job', code: 'CANCEL_JOB_ERROR' });
  }
});

/**
 * POST /api/admin/worker/queue/cancel-all
 * Cancel all pending jobs.
 */
router.post('/worker/queue/cancel-all', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE audit_jobs
       SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
       WHERE status IN ('pending', 'discovering', 'ready')
       RETURNING id`
    );

    await logAdminActivity(
      req.admin!.id,
      'cancel_all_pending',
      'audit_job',
      'bulk',
      { count: result.rowCount },
      req
    );

    res.json({ success: true, cancelled: result.rowCount });
  } catch (error) {
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
router.get('/bug-reports', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await bugReportService.listAll({
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
  } catch (error) {
    console.error('Admin list bug reports error:', error);
    res.status(500).json({ error: 'Failed to list bug reports', code: 'LIST_BUG_REPORTS_ERROR' });
  }
});

/**
 * GET /api/admin/bug-reports/stats
 * Get bug report statistics for dashboard
 */
router.get('/bug-reports/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await bugReportService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin bug report stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'BUG_REPORT_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/bug-reports/:id
 * Get a single bug report with comments
 */
router.get('/bug-reports/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const report = await bugReportService.getWithComments(req.params.id);

    if (!report) {
      res.status(404).json({ error: 'Report not found', code: 'REPORT_NOT_FOUND' });
      return;
    }

    res.json({ report });
  } catch (error) {
    console.error('Admin get bug report error:', error);
    res.status(500).json({ error: 'Failed to get bug report', code: 'GET_BUG_REPORT_ERROR' });
  }
});

const updateBugReportSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).nullable().optional(),
  adminNotes: z.string().max(5000).optional(),
  resolutionNotes: z.string().max(5000).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

/**
 * PATCH /api/admin/bug-reports/:id
 * Update a bug report (status, priority, notes)
 */
router.patch('/bug-reports/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = updateBugReportSchema.parse(req.body);
    const report = await bugReportService.update(req.params.id, data);

    if (!report) {
      res.status(404).json({ error: 'Report not found', code: 'REPORT_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'update_bug_report',
      'bug_report',
      req.params.id,
      data,
      req
    );

    res.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.post('/bug-reports/:id/comments', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);

    const comment = await bugReportService.addComment({
      reportId: req.params.id,
      userId: req.admin!.id,
      content,
      isAdmin: true,
    });

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.delete('/bug-reports/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await bugReportService.softDelete(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'delete_bug_report',
      'bug_report',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
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
router.get('/feature-requests', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const status = req.query.status as string | undefined;
    const impact = req.query.impact as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await featureRequestService.listAll({
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
  } catch (error) {
    console.error('Admin list feature requests error:', error);
    res.status(500).json({ error: 'Failed to list feature requests', code: 'LIST_FEATURE_REQUESTS_ERROR' });
  }
});

/**
 * GET /api/admin/feature-requests/stats
 * Get feature request statistics for dashboard
 */
router.get('/feature-requests/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await featureRequestService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin feature request stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', code: 'FEATURE_REQUEST_STATS_ERROR' });
  }
});

/**
 * GET /api/admin/feature-requests/:id
 * Get a single feature request with comments
 */
router.get('/feature-requests/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const request = await featureRequestService.getWithComments(req.params.id);

    if (!request) {
      res.status(404).json({ error: 'Request not found', code: 'REQUEST_NOT_FOUND' });
      return;
    }

    res.json({ request });
  } catch (error) {
    console.error('Admin get feature request error:', error);
    res.status(500).json({ error: 'Failed to get feature request', code: 'GET_FEATURE_REQUEST_ERROR' });
  }
});

const updateFeatureRequestSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).nullable().optional(),
  adminNotes: z.string().max(5000).optional(),
  resolutionNotes: z.string().max(5000).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

/**
 * PATCH /api/admin/feature-requests/:id
 * Update a feature request (status, priority, notes)
 */
router.patch('/feature-requests/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = updateFeatureRequestSchema.parse(req.body);
    const request = await featureRequestService.update(req.params.id, data);

    if (!request) {
      res.status(404).json({ error: 'Request not found', code: 'REQUEST_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'update_feature_request',
      'feature_request',
      req.params.id,
      data,
      req
    );

    res.json({ request });
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.post('/feature-requests/:id/comments', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);

    const comment = await featureRequestService.addComment({
      requestId: req.params.id,
      userId: req.admin!.id,
      content,
      isAdmin: true,
    });

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.delete('/feature-requests/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await featureRequestService.softDelete(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'delete_feature_request',
      'feature_request',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete feature request error:', error);
    res.status(500).json({ error: 'Failed to delete feature request', code: 'DELETE_FEATURE_REQUEST_ERROR' });
  }
});

// ============================================================
// SCHEDULED AUDITS ADMIN ENDPOINTS
// ============================================================

import {
  getAdminSchedulesList,
  getAdminScheduleStats,
  adminGetScheduleById,
  adminUpdateSchedule,
  adminDeleteSchedule,
} from '../../services/schedule.service.js';

/**
 * GET /admin/schedules/stats
 * Aggregate schedule statistics
 */
router.get('/schedules/stats', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getAdminScheduleStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin schedule stats error:', error);
    res.status(500).json({ error: 'Failed to get schedule stats', code: 'ADMIN_SCHEDULE_STATS_ERROR' });
  }
});

/**
 * GET /admin/schedules
 * List all schedules with user/site info
 */
router.get('/schedules', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);

    const result = await getAdminSchedulesList({ status, search, page, limit });
    res.json(result);
  } catch (error) {
    console.error('Admin list schedules error:', error);
    res.status(500).json({ error: 'Failed to list schedules', code: 'ADMIN_LIST_SCHEDULES_ERROR' });
  }
});

/**
 * GET /admin/schedules/:id
 * Get schedule detail
 */
router.get('/schedules/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const schedule = await adminGetScheduleById(req.params.id);
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
      return;
    }
    res.json({ schedule });
  } catch (error) {
    console.error('Admin get schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule', code: 'ADMIN_GET_SCHEDULE_ERROR' });
  }
});

/**
 * PATCH /admin/schedules/:id
 * Admin override (force enable/disable, set max failures)
 */
router.patch('/schedules/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { enabled, paused_reason, max_consecutive_failures } = req.body as {
      enabled?: boolean;
      paused_reason?: string | null;
      max_consecutive_failures?: number;
    };

    const schedule = await adminUpdateSchedule(req.params.id, {
      enabled,
      paused_reason,
      max_consecutive_failures,
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found', code: 'SCHEDULE_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'update_schedule',
      'audit_schedule',
      req.params.id,
      { enabled, paused_reason, max_consecutive_failures },
      req
    );

    res.json({ schedule });
  } catch (error) {
    console.error('Admin update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule', code: 'ADMIN_UPDATE_SCHEDULE_ERROR' });
  }
});

/**
 * DELETE /admin/schedules/:id
 * Admin delete a schedule
 */
router.delete('/schedules/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    await adminDeleteSchedule(req.params.id);

    await logAdminActivity(
      req.admin!.id,
      'delete_schedule',
      'audit_schedule',
      req.params.id,
      {},
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule', code: 'ADMIN_DELETE_SCHEDULE_ERROR' });
  }
});

export { router as adminRouter };
