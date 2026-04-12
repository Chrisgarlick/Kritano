import type { Request, Response, NextFunction } from 'express';
import { type ValidatedApiKey, type ApiScope } from '../services/apiKey.service.js';
/**
 * Extended request with API key data
 */
export interface ApiAuthenticatedRequest extends Request {
    apiKey: ValidatedApiKey;
    apiKeyId: string;
    apiUserId: string;
}
/**
 * Middleware to authenticate API requests using API keys.
 * Checks for key in Authorization header (Bearer) or X-API-Key header.
 */
export declare function authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware factory for scope-based authorization.
 * Requires authenticateApiKey middleware to run first.
 */
export declare function requireScope(...requiredScopes: ApiScope[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware that accepts either session auth OR API key auth
 * Useful for endpoints that should work with both web UI and API
 */
export declare function authenticateAny(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Add rate limit headers to response
 */
export declare function addRateLimitHeaders(res: Response, apiKey: ValidatedApiKey, requestsRemaining: number): void;
//# sourceMappingURL=apiAuth.middleware.d.ts.map