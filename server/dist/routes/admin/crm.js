"use strict";
/**
 * Admin CRM Routes
 *
 * Lead management: scoring, board, profiles, triggers, outreach.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCrmRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const lead_scoring_service_js_1 = require("../../services/lead-scoring.service.js");
const crm_trigger_service_js_1 = require("../../services/crm-trigger.service.js");
const email_template_service_js_1 = require("../../services/email-template.service.js");
const index_js_1 = require("../../db/index.js");
const router = (0, express_1.Router)();
exports.adminCrmRouter = router;
// =============================================
// Lead Board
// =============================================
/**
 * GET /api/admin/crm/leads
 * Paginated lead board with filtering and sorting.
 */
router.get('/leads', async (req, res) => {
    try {
        const result = await (0, lead_scoring_service_js_1.getLeadBoard)({
            status: req.query.status,
            search: req.query.search,
            sort: req.query.sort || 'lead_score',
            order: req.query.order || 'desc',
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 50, 100),
        });
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        res.json({
            leads: result.leads,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin get leads error:', error);
        res.status(500).json({ error: 'Failed to get leads', code: 'GET_LEADS_ERROR' });
    }
});
/**
 * GET /api/admin/crm/leads/:userId
 * Full lead profile.
 */
router.get('/leads/:userId', async (req, res) => {
    try {
        const profile = await (0, lead_scoring_service_js_1.getLeadProfile)(req.params.userId);
        if (!profile) {
            res.status(404).json({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' });
            return;
        }
        const [timeline, memberships] = await Promise.all([
            (0, lead_scoring_service_js_1.getLeadTimeline)(req.params.userId),
            (0, lead_scoring_service_js_1.getLeadMemberships)(req.params.userId),
        ]);
        // Get outreach history
        const outreach = await index_js_1.pool.query(`SELECT es.id, es.template_id, es.subject, es.status, es.created_at,
              et.name as template_name, et.slug as template_slug,
              admin.email as sent_by_email
       FROM email_sends es
       LEFT JOIN email_templates et ON es.template_id = et.id
       LEFT JOIN users admin ON es.sent_by = admin.id
       WHERE es.user_id = $1
       ORDER BY es.created_at DESC
       LIMIT 50`, [req.params.userId]);
        res.json({
            lead: profile,
            timeline,
            memberships,
            outreach: outreach.rows,
        });
    }
    catch (error) {
        console.error('Admin get lead profile error:', error);
        res.status(500).json({ error: 'Failed to get lead profile', code: 'GET_LEAD_ERROR' });
    }
});
/**
 * POST /api/admin/crm/leads/:userId/recalc
 * Force recalculate lead score.
 */
router.post('/leads/:userId/recalc', async (req, res) => {
    try {
        const result = await (0, lead_scoring_service_js_1.recalculateScore)(req.params.userId);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'recalculate_lead_score', 'user', req.params.userId, { newScore: result.score, newStatus: result.status }, req);
        res.json({ score: result.score, status: result.status });
    }
    catch (error) {
        console.error('Admin recalc score error:', error);
        res.status(500).json({ error: 'Failed to recalculate score', code: 'RECALC_ERROR' });
    }
});
/**
 * GET /api/admin/crm/stats
 * Lead funnel stats by status.
 */
router.get('/stats', async (_req, res) => {
    try {
        const stats = await (0, lead_scoring_service_js_1.getLeadStats)();
        res.json({ stats });
    }
    catch (error) {
        console.error('Admin get CRM stats error:', error);
        res.status(500).json({ error: 'Failed to get stats', code: 'GET_STATS_ERROR' });
    }
});
/**
 * GET /api/admin/crm/leads/:userId/memberships
 * Get sites & roles for a lead.
 */
router.get('/leads/:userId/memberships', async (req, res) => {
    try {
        const memberships = await (0, lead_scoring_service_js_1.getLeadMemberships)(req.params.userId);
        res.json({ memberships });
    }
    catch (error) {
        console.error('Admin get memberships error:', error);
        res.status(500).json({ error: 'Failed to get memberships', code: 'GET_MEMBERSHIPS_ERROR' });
    }
});
// =============================================
// Triggers
// =============================================
/**
 * GET /api/admin/crm/triggers
 * Paginated trigger list.
 */
router.get('/triggers', async (req, res) => {
    try {
        const result = await (0, crm_trigger_service_js_1.getPendingTriggers)({
            status: req.query.status || undefined,
            type: req.query.type,
            userId: req.query.userId,
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 50, 100),
        });
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        res.json({
            triggers: result.triggers,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin get triggers error:', error);
        res.status(500).json({ error: 'Failed to get triggers', code: 'GET_TRIGGERS_ERROR' });
    }
});
const actionTriggerSchema = zod_1.z.object({
    status: zod_1.z.enum(['sent', 'dismissed', 'actioned']),
});
/**
 * PATCH /api/admin/crm/triggers/:id
 * Action a trigger (sent, dismissed, actioned).
 */
router.patch('/triggers/:id', (0, validate_middleware_js_1.validateBody)(actionTriggerSchema), async (req, res) => {
    try {
        const trigger = await (0, crm_trigger_service_js_1.actionTrigger)(req.params.id, req.admin.id, req.body.status);
        if (!trigger) {
            res.status(404).json({ error: 'Trigger not found', code: 'TRIGGER_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'action_crm_trigger', 'crm_trigger', req.params.id, { action: req.body.status, triggerType: trigger.trigger_type }, req);
        res.json({ trigger });
    }
    catch (error) {
        console.error('Admin action trigger error:', error);
        res.status(500).json({ error: 'Failed to action trigger', code: 'ACTION_TRIGGER_ERROR' });
    }
});
/**
 * GET /api/admin/crm/triggers/stats
 * Trigger counts by type and status.
 */
router.get('/triggers/stats', async (_req, res) => {
    try {
        const stats = await (0, crm_trigger_service_js_1.getTriggerStats)();
        res.json({ stats });
    }
    catch (error) {
        console.error('Admin get trigger stats error:', error);
        res.status(500).json({ error: 'Failed to get trigger stats', code: 'GET_TRIGGER_STATS_ERROR' });
    }
});
// =============================================
// Outreach
// =============================================
const outreachSchema = zod_1.z.object({
    templateSlug: zod_1.z.string().min(1),
    variables: zod_1.z.record(zod_1.z.string()).optional(),
});
/**
 * POST /api/admin/crm/outreach/:userId
 * Send an outreach email to a user using a template.
 */
router.post('/outreach/:userId', (0, validate_middleware_js_1.validateBody)(outreachSchema), async (req, res) => {
    try {
        // Check daily outreach limit (max 50 per admin per day)
        const dailySends = await index_js_1.pool.query(`SELECT COUNT(*) as count FROM email_sends
         WHERE sent_by = $1 AND created_at >= NOW() - INTERVAL '24 hours'`, [req.admin.id]);
        if (parseInt(dailySends.rows[0].count) >= 50) {
            res.status(429).json({ error: 'Daily outreach limit reached (50 per day)', code: 'OUTREACH_LIMIT' });
            return;
        }
        // Get user info
        const userResult = await index_js_1.pool.query(`SELECT id, email, first_name FROM users WHERE id = $1`, [req.params.userId]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            return;
        }
        const user = userResult.rows[0];
        await (0, email_template_service_js_1.sendTemplate)({
            templateSlug: req.body.templateSlug,
            to: {
                userId: user.id,
                email: user.email,
                firstName: user.first_name || 'there',
            },
            variables: req.body.variables || {},
            sentBy: req.admin.id,
        });
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'send_outreach', 'user', req.params.userId, { templateSlug: req.body.templateSlug }, req);
        res.json({ success: true, sentTo: user.email });
    }
    catch (error) {
        console.error('Admin outreach send error:', error);
        res.status(500).json({ error: 'Failed to send outreach email', code: 'OUTREACH_ERROR' });
    }
});
/**
 * GET /api/admin/crm/outreach
 * Outreach history (optionally filtered by userId).
 */
router.get('/outreach', async (req, res) => {
    try {
        const userId = req.query.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIdx = 1;
        if (userId) {
            conditions.push(`es.user_id = $${paramIdx++}`);
            params.push(userId);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const [dataResult, countResult] = await Promise.all([
            index_js_1.pool.query(`SELECT es.id, es.template_id, es.user_id, es.subject, es.status, es.created_at,
                et.name as template_name, et.slug as template_slug,
                u.email as user_email, u.first_name as user_first_name,
                admin.email as sent_by_email
         FROM email_sends es
         LEFT JOIN email_templates et ON es.template_id = et.id
         LEFT JOIN users u ON es.user_id = u.id
         LEFT JOIN users admin ON es.sent_by = admin.id
         ${where}
         ORDER BY es.created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`, [...params, limit, offset]),
            index_js_1.pool.query(`SELECT COUNT(*) FROM email_sends es ${where}`, params),
        ]);
        const total = parseInt(countResult.rows[0].count) || 0;
        res.json({
            sends: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin get outreach history error:', error);
        res.status(500).json({ error: 'Failed to get outreach history', code: 'GET_OUTREACH_ERROR' });
    }
});
//# sourceMappingURL=crm.js.map