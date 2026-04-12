"use strict";
/**
 * Feature Request Service
 *
 * Handles all feature request related operations including
 * creation, listing, updates, and comments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureRequestService = void 0;
const index_js_1 = require("../db/index.js");
exports.featureRequestService = {
    /**
     * Create a new feature request
     */
    async create(data) {
        const result = await index_js_1.pool.query(`INSERT INTO feature_requests (
        user_id, title, description, impact, category,
        page_url, user_agent, screen_size, browser_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`, [
            data.userId,
            data.title,
            data.description,
            data.impact,
            data.category,
            data.pageUrl || null,
            data.userAgent || null,
            data.screenSize || null,
            data.browserInfo ? JSON.stringify(data.browserInfo) : null,
        ]);
        return result.rows[0];
    },
    /**
     * List feature requests by user
     */
    async listByUser(userId, options) {
        const { page, limit, status } = options;
        const offset = (page - 1) * limit;
        let query = `
      SELECT * FROM feature_requests
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
     * Get a single feature request by ID
     * If userId is provided, only return if user owns the request
     */
    async getById(id, userId) {
        let query = `
      SELECT fr.*,
        u.email as reporter_email,
        u.first_name as reporter_first_name,
        u.last_name as reporter_last_name
      FROM feature_requests fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.id = $1 AND fr.deleted_at IS NULL
    `;
        const params = [id];
        if (userId) {
            params.push(userId);
            query += ` AND fr.user_id = $${params.length}`;
        }
        const result = await index_js_1.pool.query(query, params);
        return result.rows[0] || null;
    },
    /**
     * Get feature request with all comments (for detail view)
     */
    async getWithComments(id) {
        const request = await this.getById(id);
        if (!request)
            return null;
        const comments = await index_js_1.pool.query(`SELECT c.*, u.email, u.first_name, u.last_name
       FROM feature_request_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.feature_request_id = $1
       ORDER BY c.created_at ASC`, [id]);
        return { ...request, comments: comments.rows };
    },
    /**
     * Add a comment to a feature request
     */
    async addComment(data) {
        // Verify request exists and user has access
        const request = data.isAdmin
            ? await this.getById(data.requestId)
            : await this.getById(data.requestId, data.userId);
        if (!request) {
            throw new Error('Request not found or access denied');
        }
        const result = await index_js_1.pool.query(`INSERT INTO feature_request_comments (feature_request_id, user_id, is_admin_comment, content)
       VALUES ($1, $2, $3, $4) RETURNING *`, [data.requestId, data.userId, data.isAdmin, data.content]);
        return result.rows[0];
    },
    // =========================================
    // Admin methods
    // =========================================
    /**
     * List all feature requests (admin only)
     */
    async listAll(options) {
        const { page, limit, status, impact, category, search } = options;
        const offset = (page - 1) * limit;
        let query = `
      SELECT fr.*,
        u.email as reporter_email
      FROM feature_requests fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.deleted_at IS NULL
    `;
        const params = [];
        if (status) {
            params.push(status);
            query += ` AND fr.status = $${params.length}`;
        }
        if (impact) {
            params.push(impact);
            query += ` AND fr.impact = $${params.length}`;
        }
        if (category) {
            params.push(category);
            query += ` AND fr.category = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (fr.title ILIKE $${params.length} OR fr.description ILIKE $${params.length})`;
        }
        // Get count
        const countQuery = query.replace('SELECT fr.*, u.email as reporter_email', 'SELECT COUNT(*)');
        const countResult = await index_js_1.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);
        // Add ordering and pagination
        query += ` ORDER BY
      CASE fr.impact
        WHEN 'critical_for_workflow' THEN 1
        WHEN 'important' THEN 2
        WHEN 'would_be_helpful' THEN 3
        ELSE 4
      END,
      CASE fr.status
        WHEN 'submitted' THEN 1
        WHEN 'under_review' THEN 2
        WHEN 'planned' THEN 3
        WHEN 'in_progress' THEN 4
        ELSE 5
      END,
      fr.created_at DESC
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
     * Update a feature request (admin only)
     */
    async update(id, data) {
        const setClauses = [];
        const params = [];
        if (data.status !== undefined) {
            params.push(data.status);
            setClauses.push(`status = $${params.length}`);
            if (data.status === 'completed') {
                setClauses.push(`completed_at = NOW()`);
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
        const result = await index_js_1.pool.query(`UPDATE feature_requests SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`, params);
        return result.rows[0] || null;
    },
    /**
     * Get feature request statistics (admin dashboard)
     */
    async getStats() {
        const result = await index_js_1.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL)::int as total,
        COUNT(*) FILTER (WHERE status = 'submitted' AND deleted_at IS NULL)::int as submitted,
        COUNT(*) FILTER (WHERE status = 'under_review' AND deleted_at IS NULL)::int as under_review,
        COUNT(*) FILTER (WHERE status = 'planned' AND deleted_at IS NULL)::int as planned,
        COUNT(*) FILTER (WHERE status = 'in_progress' AND deleted_at IS NULL)::int as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed' AND deleted_at IS NULL)::int as completed,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL)::int as last_7_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL)::int as last_24_hours
      FROM feature_requests
    `);
        return result.rows[0];
    },
    /**
     * Soft delete a feature request
     */
    async softDelete(id) {
        await index_js_1.pool.query(`UPDATE feature_requests SET deleted_at = NOW() WHERE id = $1`, [id]);
    },
};
//# sourceMappingURL=feature-request.service.js.map