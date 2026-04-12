"use strict";
/**
 * Bug Report Service
 *
 * Handles all bug report related operations including
 * creation, listing, updates, and comments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bugReportService = void 0;
const index_js_1 = require("../db/index.js");
exports.bugReportService = {
    /**
     * Create a new bug report
     */
    async create(data) {
        const result = await index_js_1.pool.query(`INSERT INTO bug_reports (
        user_id, title, description, severity, category,
        page_url, user_agent, screen_size, browser_info,
        screenshot_url, screenshot_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`, [
            data.userId,
            data.title,
            data.description,
            data.severity,
            data.category,
            data.pageUrl || null,
            data.userAgent || null,
            data.screenSize || null,
            data.browserInfo ? JSON.stringify(data.browserInfo) : null,
            data.screenshotUrl || null,
            data.screenshotKey || null,
        ]);
        return result.rows[0];
    },
    /**
     * List bug reports by user (for "My Bug Reports" page)
     */
    async listByUser(userId, options) {
        const { page, limit, status } = options;
        const offset = (page - 1) * limit;
        let query = `
      SELECT * FROM bug_reports
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
        const params = [userId];
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        // Get count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await index_js_1.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);
        // Get paginated results
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await index_js_1.pool.query(query, params);
        return {
            items: result.rows,
            total,
            page,
            limit,
        };
    },
    /**
     * Get a single bug report by ID
     * If userId is provided, only return if user owns the report
     */
    async getById(id, userId) {
        let query = `
      SELECT br.*,
        u.email as reporter_email,
        u.first_name as reporter_first_name,
        u.last_name as reporter_last_name
      FROM bug_reports br
      JOIN users u ON br.user_id = u.id
      WHERE br.id = $1 AND br.deleted_at IS NULL
    `;
        const params = [id];
        if (userId) {
            params.push(userId);
            query += ` AND br.user_id = $${params.length}`;
        }
        const result = await index_js_1.pool.query(query, params);
        return result.rows[0] || null;
    },
    /**
     * Get bug report with all comments (for detail view)
     */
    async getWithComments(id) {
        const report = await this.getById(id);
        if (!report)
            return null;
        const comments = await index_js_1.pool.query(`SELECT c.*, u.email, u.first_name, u.last_name
       FROM bug_report_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.bug_report_id = $1
       ORDER BY c.created_at ASC`, [id]);
        return { ...report, comments: comments.rows };
    },
    /**
     * Add a comment to a bug report
     */
    async addComment(data) {
        // Verify report exists and user has access
        const report = data.isAdmin
            ? await this.getById(data.reportId)
            : await this.getById(data.reportId, data.userId);
        if (!report) {
            throw new Error('Report not found or access denied');
        }
        const result = await index_js_1.pool.query(`INSERT INTO bug_report_comments (bug_report_id, user_id, is_admin_comment, content)
       VALUES ($1, $2, $3, $4) RETURNING *`, [data.reportId, data.userId, data.isAdmin, data.content]);
        return result.rows[0];
    },
    // =========================================
    // Admin methods
    // =========================================
    /**
     * List all bug reports (admin only)
     */
    async listAll(options) {
        const { page, limit, status, severity, category, search } = options;
        const offset = (page - 1) * limit;
        let query = `
      SELECT br.*,
        u.email as reporter_email
      FROM bug_reports br
      JOIN users u ON br.user_id = u.id
      WHERE br.deleted_at IS NULL
    `;
        const params = [];
        if (status) {
            params.push(status);
            query += ` AND br.status = $${params.length}`;
        }
        if (severity) {
            params.push(severity);
            query += ` AND br.severity = $${params.length}`;
        }
        if (category) {
            params.push(category);
            query += ` AND br.category = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (br.title ILIKE $${params.length} OR br.description ILIKE $${params.length})`;
        }
        // Get count
        const countQuery = query.replace('SELECT br.*, u.email as reporter_email', 'SELECT COUNT(*)');
        const countResult = await index_js_1.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);
        // Add ordering and pagination
        query += ` ORDER BY
      CASE br.severity
        WHEN 'critical' THEN 1
        WHEN 'major' THEN 2
        WHEN 'minor' THEN 3
        ELSE 4
      END,
      CASE br.status
        WHEN 'open' THEN 1
        WHEN 'in_progress' THEN 2
        ELSE 3
      END,
      br.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await index_js_1.pool.query(query, params);
        return {
            items: result.rows,
            total,
            page,
            limit,
        };
    },
    /**
     * Update a bug report (admin only)
     */
    async update(id, data) {
        const setClauses = [];
        const params = [];
        if (data.status !== undefined) {
            params.push(data.status);
            setClauses.push(`status = $${params.length}`);
            if (data.status === 'resolved') {
                setClauses.push(`resolved_at = NOW()`);
            }
        }
        if (data.priority !== undefined) {
            params.push(data.priority);
            setClauses.push(`priority = $${params.length}`);
        }
        if (data.adminNotes !== undefined) {
            params.push(data.adminNotes);
            setClauses.push(`admin_notes = $${params.length}`);
        }
        if (data.resolutionNotes !== undefined) {
            params.push(data.resolutionNotes);
            setClauses.push(`resolution_notes = $${params.length}`);
        }
        if (data.assignedTo !== undefined) {
            params.push(data.assignedTo);
            setClauses.push(`assigned_to = $${params.length}`);
        }
        if (setClauses.length === 0) {
            return this.getById(id);
        }
        params.push(id);
        const result = await index_js_1.pool.query(`UPDATE bug_reports SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`, params);
        return result.rows[0] || null;
    },
    /**
     * Get bug report statistics (admin dashboard)
     */
    async getStats() {
        const result = await index_js_1.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL)::int as total,
        COUNT(*) FILTER (WHERE status = 'open' AND deleted_at IS NULL)::int as open,
        COUNT(*) FILTER (WHERE status = 'in_progress' AND deleted_at IS NULL)::int as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved' AND deleted_at IS NULL)::int as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status IN ('open', 'in_progress') AND deleted_at IS NULL)::int as critical_open,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL)::int as last_7_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL)::int as last_24_hours
      FROM bug_reports
    `);
        return result.rows[0];
    },
    /**
     * Soft delete a bug report
     */
    async softDelete(id) {
        await index_js_1.pool.query(`UPDATE bug_reports SET deleted_at = NOW() WHERE id = $1`, [id]);
    },
};
//# sourceMappingURL=bug-report.service.js.map