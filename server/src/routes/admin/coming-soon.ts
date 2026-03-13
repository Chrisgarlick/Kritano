import { Router } from 'express';
import type { Response } from 'express';
import { type AdminRequest, logAdminActivity } from '../../middleware/admin.middleware.js';
import { pool } from '../../db/index.js';

const router = Router();

/**
 * GET /api/admin/coming-soon/signups
 * List signups (paginated, with search)
 */
router.get('/signups', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE email ILIKE $${params.length} OR name ILIKE $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM coming_soon_signups ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, email, name, ip_address, created_at
       FROM coming_soon_signups ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      signups: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list signups error:', error);
    res.status(500).json({ error: 'Failed to list signups', code: 'LIST_SIGNUPS_ERROR' });
  }
});

/**
 * GET /api/admin/coming-soon/signups/export
 * Export all emails as CSV
 */
router.get('/signups/export', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT email, name, ip_address, created_at
       FROM coming_soon_signups
       ORDER BY created_at DESC`
    );

    const header = 'Email,Name,IP Address,Signed Up\n';
    const rows = result.rows.map((r) =>
      `"${r.email}","${r.name || ''}","${r.ip_address || ''}","${r.created_at}"`
    ).join('\n');

    await logAdminActivity(
      req.admin!.id,
      'export_coming_soon_signups',
      'coming_soon',
      'all',
      { count: result.rows.length },
      req
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="coming-soon-signups.csv"');
    res.send(header + rows);
  } catch (error) {
    console.error('Admin export signups error:', error);
    res.status(500).json({ error: 'Failed to export signups', code: 'EXPORT_SIGNUPS_ERROR' });
  }
});

/**
 * DELETE /api/admin/coming-soon/signups/:id
 * Delete a signup
 */
router.delete('/signups/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM coming_soon_signups WHERE id = $1 RETURNING email',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Signup not found', code: 'SIGNUP_NOT_FOUND' });
      return;
    }

    await logAdminActivity(
      req.admin!.id,
      'delete_coming_soon_signup',
      'coming_soon',
      id,
      { email: result.rows[0].email },
      req
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete signup error:', error);
    res.status(500).json({ error: 'Failed to delete signup', code: 'DELETE_SIGNUP_ERROR' });
  }
});

export { router as adminComingSoonRouter };
