import type { Request, Response, NextFunction } from 'express';
/**
 * Generate a new CSRF token
 */
export declare function generateCsrfToken(): string;
/**
 * Set CSRF token cookie on response.
 * The cookie is NOT HttpOnly so JavaScript can read it.
 */
export declare function setCsrfCookie(res: Response, token: string): void;
/**
 * Middleware to ensure CSRF token exists.
 * Creates a new token if one doesn't exist.
 */
export declare function ensureCsrfToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to validate CSRF token on state-changing requests.
 * Uses double-submit cookie pattern.
 */
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void;
/**
 * Get CSRF token from request (for including in responses)
 */
export declare function getCsrfToken(req: Request): string | undefined;
//# sourceMappingURL=csrf.middleware.d.ts.map