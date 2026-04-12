/**
 * Pre-rendering middleware for bot/crawler detection.
 *
 * Detects bot user agents and serves pre-rendered HTML instead of the
 * SPA shell. This ensures crawlers see fully rendered content with
 * structured data, meta tags, and semantic HTML.
 *
 * Skips pre-rendering for:
 * - API requests (/api/*)
 * - Static assets (.js, .css, .png, etc.)
 * - Authenticated app routes (/dashboard, /admin, etc.)
 * - Non-GET requests
 */
import type { Request, Response, NextFunction } from 'express';
export declare function prerenderMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=prerender.middleware.d.ts.map