"use strict";
/**
 * Admin Cold Outreach Log Routes
 *
 * CRUD endpoints for manually tracking cold emails sent by hand.
 * All routes require super admin authentication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOutreachLogRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const index_js_1 = require("../../db/index.js");
const router = (0, express_1.Router)();
// =============================================
// VALIDATION SCHEMAS
// =============================================
const createSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    domain: zod_1.z.string().optional(),
    date_sent: zod_1.z.string().optional(), // ISO date string
    subject: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(['sent', 'replied', 'nurturing', 'converted', 'dead']).optional(),
    replied: zod_1.z.boolean().optional(),
    reply_date: zod_1.z.string().optional(),
    reply_notes: zod_1.z.string().optional(),
    free_audit_given: zod_1.z.boolean().optional(),
    free_audit_date: zod_1.z.string().optional(),
    became_user: zod_1.z.boolean().optional(),
    user_signup_date: zod_1.z.string().optional(),
    became_paid: zod_1.z.boolean().optional(),
    paid_date: zod_1.z.string().optional(),
    plan_tier: zod_1.z.string().optional(),
});
const updateSchema = createSchema.partial();
// =============================================
// ROUTES
// =============================================
/**
 * GET /api/admin/outreach-log
 * List outreach log entries with filters and pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        const sort = req.query.sort || 'date_sent';
        const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const replied = req.query.replied;
        const became_user = req.query.became_user;
        const became_paid = req.query.became_paid;
        const free_audit = req.query.free_audit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(status);
        }
        if (search) {
            conditions.push(`(email ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR domain ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (replied === 'true') {
            conditions.push(`replied = true`);
        }
        else if (replied === 'false') {
            conditions.push(`replied = false`);
        }
        if (became_user === 'true') {
            conditions.push(`became_user = true`);
        }
        if (became_paid === 'true') {
            conditions.push(`became_paid = true`);
        }
        if (free_audit === 'true') {
            conditions.push(`free_audit_given = true`);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const allowedSorts = ['date_sent', 'email', 'domain', 'status', 'created_at', 'name'];
        const sortColumn = allowedSorts.includes(sort) ? sort : 'date_sent';
        const [countResult, dataResult] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(*) FROM cold_outreach_log ${where}`, params),
            index_js_1.pool.query(`SELECT * FROM cold_outreach_log ${where} ORDER BY ${sortColumn} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit.toString(), offset.toString()]),
        ]);
        res.json({
            items: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit,
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        });
    }
    catch (error) {
        console.error('Error listing outreach log:', error);
        res.status(500).json({ error: 'Failed to list outreach log' });
    }
});
/**
 * GET /api/admin/outreach-log/stats
 * Funnel stats for the outreach log
 */
router.get('/stats', async (_req, res) => {
    try {
        const result = await index_js_1.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE replied = true) as replied,
        COUNT(*) FILTER (WHERE free_audit_given = true) as free_audits,
        COUNT(*) FILTER (WHERE became_user = true) as users,
        COUNT(*) FILTER (WHERE became_paid = true) as paid,
        COUNT(*) FILTER (WHERE status = 'sent') as status_sent,
        COUNT(*) FILTER (WHERE status = 'replied') as status_replied,
        COUNT(*) FILTER (WHERE status = 'nurturing') as status_nurturing,
        COUNT(*) FILTER (WHERE status = 'converted') as status_converted,
        COUNT(*) FILTER (WHERE status = 'dead') as status_dead,
        COUNT(*) FILTER (WHERE date_sent >= CURRENT_DATE - INTERVAL '7 days') as sent_last_7d,
        COUNT(*) FILTER (WHERE date_sent >= CURRENT_DATE - INTERVAL '30 days') as sent_last_30d
      FROM cold_outreach_log
    `);
        const row = result.rows[0];
        const total = parseInt(row.total);
        res.json({
            total,
            replied: parseInt(row.replied),
            replyRate: total > 0 ? ((parseInt(row.replied) / total) * 100).toFixed(1) : '0',
            freeAudits: parseInt(row.free_audits),
            users: parseInt(row.users),
            userRate: total > 0 ? ((parseInt(row.users) / total) * 100).toFixed(1) : '0',
            paid: parseInt(row.paid),
            paidRate: total > 0 ? ((parseInt(row.paid) / total) * 100).toFixed(1) : '0',
            byStatus: {
                sent: parseInt(row.status_sent),
                replied: parseInt(row.status_replied),
                nurturing: parseInt(row.status_nurturing),
                converted: parseInt(row.status_converted),
                dead: parseInt(row.status_dead),
            },
            sentLast7d: parseInt(row.sent_last_7d),
            sentLast30d: parseInt(row.sent_last_30d),
        });
    }
    catch (error) {
        console.error('Error getting outreach log stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});
/**
 * GET /api/admin/outreach-log/:id
 * Get single entry
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await index_js_1.pool.query('SELECT * FROM cold_outreach_log WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error getting outreach log entry:', error);
        res.status(500).json({ error: 'Failed to get entry' });
    }
});
/**
 * POST /api/admin/outreach-log
 * Create new entry
 */
router.post('/', (0, validate_middleware_js_1.validateBody)(createSchema), async (req, res) => {
    try {
        const data = req.body;
        const result = await index_js_1.pool.query(`INSERT INTO cold_outreach_log (
        email, name, domain, date_sent, subject, notes, status,
        replied, reply_date, reply_notes,
        free_audit_given, free_audit_date,
        became_user, user_signup_date,
        became_paid, paid_date, plan_tier
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`, [
            data.email,
            data.name || null,
            data.domain || null,
            data.date_sent || new Date().toISOString().split('T')[0],
            data.subject || null,
            data.notes || null,
            data.status || 'sent',
            data.replied || false,
            data.reply_date || null,
            data.reply_notes || null,
            data.free_audit_given || false,
            data.free_audit_date || null,
            data.became_user || false,
            data.user_signup_date || null,
            data.became_paid || false,
            data.paid_date || null,
            data.plan_tier || null,
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating outreach log entry:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});
/**
 * PATCH /api/admin/outreach-log/:id
 * Update entry (partial update)
 */
router.patch('/:id', (0, validate_middleware_js_1.validateBody)(updateSchema), async (req, res) => {
    try {
        const data = req.body;
        const fields = [];
        const values = [];
        let paramIndex = 1;
        const allowedFields = [
            'email', 'name', 'domain', 'date_sent', 'subject', 'notes', 'status',
            'replied', 'reply_date', 'reply_notes',
            'free_audit_given', 'free_audit_date',
            'became_user', 'user_signup_date',
            'became_paid', 'paid_date', 'plan_tier',
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramIndex++}`);
                values.push(data[field]);
            }
        }
        if (fields.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        fields.push(`updated_at = NOW()`);
        values.push(req.params.id);
        const result = await index_js_1.pool.query(`UPDATE cold_outreach_log SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating outreach log entry:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});
/**
 * DELETE /api/admin/outreach-log/:id
 * Delete entry
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await index_js_1.pool.query('DELETE FROM cold_outreach_log WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('Error deleting outreach log entry:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});
exports.adminOutreachLogRouter = router;
//# sourceMappingURL=outreach-log.js.map