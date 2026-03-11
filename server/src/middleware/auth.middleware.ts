import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { tokenService } from '../services/token.service.js';
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
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from cookie (preferred) or Authorization header
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Middleware to optionally authenticate requests.
 * Does not fail if no token is present.
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    next();
    return;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Token invalid, but continue without user
  }

  next();
}

/**
 * Middleware factory for role-based authorization.
 * Requires authentication middleware to run first.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Get authenticated user from request
 * Throws if user is not authenticated
 */
export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
}
