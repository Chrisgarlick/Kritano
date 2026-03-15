import type { Request, Response, NextFunction } from 'express';
import { generateSecureToken, timingSafeEqual } from '../utils/crypto.utils.js';
import { CSRF_CONFIG, COOKIE_CONFIG } from '../config/auth.config.js';

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return generateSecureToken(CSRF_CONFIG.tokenLength);
}

/**
 * Set CSRF token cookie on response.
 * The cookie is NOT HttpOnly so JavaScript can read it.
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_CONFIG.cookieName, token, {
    httpOnly: false, // JavaScript needs to read this
    secure: COOKIE_CONFIG.secure,
    sameSite: COOKIE_CONFIG.sameSite,
    path: COOKIE_CONFIG.path,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Middleware to ensure CSRF token exists.
 * Creates a new token if one doesn't exist.
 */
export function ensureCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const existingToken = req.cookies?.[CSRF_CONFIG.cookieName];

  if (!existingToken) {
    const newToken = generateCsrfToken();
    setCsrfCookie(res, newToken);
  }

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests.
 * Uses double-submit cookie pattern.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF for webhook endpoints (authenticated via signature, not cookies)
  if (req.originalUrl.startsWith('/api/webhooks/')) {
    next();
    return;
  }

  // Skip CSRF for API v1 endpoints (authenticated via API key, not cookies)
  if (req.originalUrl.startsWith('/api/v1/')) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_CONFIG.cookieName];
  const headerToken = req.headers[CSRF_CONFIG.headerName] as string | undefined;

  // Both tokens must be present
  if (!cookieToken || !headerToken) {
    res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_MISSING',
    });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    res.status(403).json({
      error: 'CSRF token invalid',
      code: 'CSRF_INVALID',
    });
    return;
  }

  next();
}

/**
 * Get CSRF token from request (for including in responses)
 */
export function getCsrfToken(req: Request): string | undefined {
  return req.cookies?.[CSRF_CONFIG.cookieName];
}
