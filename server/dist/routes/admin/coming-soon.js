"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminComingSoonRouter = void 0;
const express_1 = require("express");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const index_js_1 = require("../../db/index.js");
const router = (0, express_1.Router)();
exports.adminComingSoonRouter = router;
/**
 * GET /api/admin/coming-soon/signups
 * List signups (paginated, with search)
 */
router.get('/signups', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const search = req.query.search;
        const offset = (page - 1) * limit;
        let whereClause = '';
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            whereClause = `WHERE email ILIKE $${params.length} OR name ILIKE $${params.length}`;
        }
        const countResult = await index_js_1.pool.query(`SELECT COUNT(*) FROM coming_soon_signups ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);
        const result = await index_js_1.pool.query(`SELECT id, email, name, ip_address, created_at
       FROM coming_soon_signups ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
        res.json({
            signups: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Admin list signups error:', error);
        res.status(500).json({ error: 'Failed to list signups', code: 'LIST_SIGNUPS_ERROR' });
    }
});
/**
 * GET /api/admin/coming-soon/signups/export
 * Export all emails as CSV
 */
router.get('/signups/export', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT email, name, ip_address, created_at
       FROM coming_soon_signups
       ORDER BY created_at DESC`);
        const escapeCsv = (val) => {
            // Escape double quotes and prevent formula injection
            let safe = val.replace(/"/g, '""');
            if (/^[=+\-@\t\r]/.test(safe))
                safe = "'" + safe;
            return `"${safe}"`;
        };
        const header = 'Email,Name,IP Address,Signed Up\n';
        const rows = result.rows.map((r) => `${escapeCsv(r.email)},${escapeCsv(r.name || '')},${escapeCsv(r.ip_address || '')},${escapeCsv(String(r.created_at))}`).join('\n');
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'export_coming_soon_signups', 'coming_soon', 'all', { count: result.rows.length }, req);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="coming-soon-signups.csv"');
        res.send(header + rows);
    }
    catch (error) {
        console.error('Admin export signups error:', error);
        res.status(500).json({ error: 'Failed to export signups', code: 'EXPORT_SIGNUPS_ERROR' });
    }
});
/**
 * DELETE /api/admin/coming-soon/signups/:id
 * Delete a signup
 */
router.delete('/signups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await index_js_1.pool.query('DELETE FROM coming_soon_signups WHERE id = $1 RETURNING email', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Signup not found', code: 'SIGNUP_NOT_FOUND' });
            return;
        }
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'delete_coming_soon_signup', 'coming_soon', id, { email: result.rows[0].email }, req);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Admin delete signup error:', error);
        res.status(500).json({ error: 'Failed to delete signup', code: 'DELETE_SIGNUP_ERROR' });
    }
});
//# sourceMappingURL=coming-soon.js.map