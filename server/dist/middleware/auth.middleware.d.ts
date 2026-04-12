import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser, UserRole } from '../types/auth.types.js';
/**
 * Request type with authenticated user attached
 */
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
/**
 * Middleware to authenticate requests using JWT.
 * Extracts token from cookie (preferred) or Authorization header.
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to optionally authenticate requests.
 * Does not fail if no token is present.
 */
export declare function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware factory for role-based authorization.
 * Requires authentication middleware to run first.
 */
export declare function requireRole(...allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to require admin role
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to require super admin role
 */
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get authenticated user from request
 * Throws if user is not authenticated
 */
export declare function getAuthenticatedUser(req: Request): AuthenticatedUser;
//# sourceMappingURL=auth.middleware.d.ts.map