import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

let pool: Pool;

export function initializeAdminMiddleware(dbPool: Pool): void {
  pool = dbPool;
}

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Middleware to require super admin access
 * Must be used after authenticate middleware
 */
export async function requireSuperAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, is_super_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    const user = result.rows[0];

    if (!user.is_super_admin) {
      res.status(403).json({
        error: 'Access denied',
        code: 'ADMIN_REQUIRED',
      });
      return;
    }

    // Attach admin info to request
    req.admin = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'ADMIN_CHECK_FAILED',
    });
  }
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>,
  req: Request
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    await pool.query(
      `INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, action, targetType, targetId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    // Don't throw - logging should not break the request
  }
}
