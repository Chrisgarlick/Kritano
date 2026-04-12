"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = void 0;
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireRole = requireRole;
exports.getAuthenticatedUser = getAuthenticatedUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_service_js_1 = require("../services/token.service.js");
/**
 * Middleware to authenticate requests using JWT.
 * Extracts token from cookie (preferred) or Authorization header.
 */
function authenticate(req, res, next) {
    try {
        // Get token from cookie (preferred) or Authorization header
        const token = req.cookies?.access_token ||
            req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        // Verify token
        const payload = token_service_js_1.tokenService.verifyAccessToken(token);
        // Attach user to request
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
function optionalAuthenticate(req, res, next) {
    const token = req.cookies?.access_token ||
        req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        next();
        return;
    }
    try {
        const payload = token_service_js_1.tokenService.verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
    catch {
        // Token invalid, but continue without user
    }
    next();
}
/**
 * Middleware factory for role-based authorization.
 * Requires authentication middleware to run first.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
exports.requireAdmin = requireRole('admin', 'super_admin');
/**
 * Middleware to require super admin role
 */
exports.requireSuperAdmin = requireRole('super_admin');
/**
 * Get authenticated user from request
 * Throws if user is not authenticated
 */
function getAuthenticatedUser(req) {
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    return req.user;
}
//# sourceMappingURL=auth.middleware.js.map