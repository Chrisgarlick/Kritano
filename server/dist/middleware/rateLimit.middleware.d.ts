import type { Request, Response, NextFunction } from 'express';
interface RateLimitConfig {
    windowMs: number;
    maxAttempts: number;
    blockDurationMs: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
}
/**
 * Create a rate limiting middleware using Redis.
 * Falls back to in-memory rate limiting if Redis is unavailable.
 */
export declare function createRateLimiter(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export declare function resetRateLimit(identifier: string, action: string): Promise<void>;
/**
 * Check if an identifier is currently rate limited
 */
export declare function isRateLimited(identifier: string, action: string): Promise<{
    limited: boolean;
    retryAfter?: number;
}>;
export declare const loginRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const registerRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const passwordResetRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyEmailRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const oauthRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const globalRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=rateLimit.middleware.d.ts.map