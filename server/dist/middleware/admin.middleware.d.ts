import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
export declare function initializeAdminMiddleware(dbPool: Pool): void;
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
export declare function requireSuperAdmin(req: AdminRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Log admin activity
 */
export declare function logAdminActivity(adminId: string, action: string, targetType: string, targetId: string | null, details: Record<string, unknown>, req: Request): Promise<void>;
//# sourceMappingURL=admin.middleware.d.ts.map