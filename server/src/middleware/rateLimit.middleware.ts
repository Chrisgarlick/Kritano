import type { Request, Response, NextFunction } from 'express';
import { redis } from '../db/redis.js';
import { getClientIp } from '../utils/ip.utils.js';
import { RATE_LIMIT_CONFIG } from '../config/auth.config.js';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

const KEY_PREFIX = 'rl:';
const LOCK_PREFIX = 'rl:lock:';

/**
 * Create a rate limiting middleware using Redis.
 * Falls back to pass-through if Redis is unavailable.
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = config.keyGenerator?.(req) || getClientIp(req);
    const action = `${req.method}:${req.baseUrl}${req.path}`;
    const key = `${KEY_PREFIX}${identifier}:${action}`;
    const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;

    try {
      // Check for lockout
      const lockTtl = await redis.ttl(lockKey);
      if (lockTtl > 0) {
        res.setHeader('Retry-After', lockTtl.toString());
        res.status(429).json({
          error: 'Too many attempts. Please try again later.',
          code: 'RATE_LIMITED',
          retryAfter: lockTtl,
        });
        return;
      }

      // Increment counter with auto-expiry
      const windowSecs = Math.ceil(config.windowMs / 1000);
      const count = await redis.incr(key);

      // Set expiry on first request in window
      if (count === 1) {
        await redis.expire(key, windowSecs);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxAttempts.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxAttempts - count).toString());

      // Check if limit exceeded
      if (count > config.maxAttempts) {
        const blockSecs = Math.ceil(config.blockDurationMs / 1000);
        await redis.setex(lockKey, blockSecs, '1');

        res.setHeader('Retry-After', blockSecs.toString());
        res.status(429).json({
          error: 'Too many attempts. Please try again later.',
          code: 'RATE_LIMITED',
          retryAfter: blockSecs,
        });
        return;
      }

      next();
    } catch (error) {
      // Fail open — don't block users if Redis is down
      next();
    }
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  const key = `${KEY_PREFIX}${identifier}:${action}`;
  const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;
  await redis.del(key, lockKey);
}

/**
 * Check if an identifier is currently rate limited
 */
export async function isRateLimited(
  identifier: string,
  action: string
): Promise<{ limited: boolean; retryAfter?: number }> {
  const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;
  const ttl = await redis.ttl(lockKey);

  if (ttl > 0) {
    return { limited: true, retryAfter: ttl };
  }

  return { limited: false };
}

// Pre-configured rate limiters for auth endpoints
export const loginRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.login);
export const registerRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.register);
export const passwordResetRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.passwordReset);
export const verifyEmailRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.verifyEmail);
export const oauthRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.oauth);
export const globalRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG.global);
