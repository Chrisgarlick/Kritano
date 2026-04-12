"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRateLimiter = exports.oauthRateLimiter = exports.verifyEmailRateLimiter = exports.passwordResetRateLimiter = exports.registerRateLimiter = exports.loginRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
exports.resetRateLimit = resetRateLimit;
exports.isRateLimited = isRateLimited;
const redis_js_1 = require("../db/redis.js");
const ip_utils_js_1 = require("../utils/ip.utils.js");
const auth_config_js_1 = require("../config/auth.config.js");
const KEY_PREFIX = 'rl:';
const LOCK_PREFIX = 'rl:lock:';
// In-memory fallback for when Redis is unavailable
const memoryStore = new Map();
const memoryLocks = new Map(); // key -> expiry timestamp
// Periodic cleanup of in-memory fallback
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
        if (entry.resetAt <= now)
            memoryStore.delete(key);
    }
    for (const [key, expiry] of memoryLocks) {
        if (expiry <= now)
            memoryLocks.delete(key);
    }
}, 60 * 1000);
/**
 * Create a rate limiting middleware using Redis.
 * Falls back to in-memory rate limiting if Redis is unavailable.
 */
function createRateLimiter(config) {
    return async (req, res, next) => {
        const identifier = config.keyGenerator?.(req) || (0, ip_utils_js_1.getClientIp)(req);
        const action = `${req.method}:${req.baseUrl}${req.path}`;
        const key = `${KEY_PREFIX}${identifier}:${action}`;
        const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;
        try {
            // Check for lockout
            const lockTtl = await redis_js_1.redis.ttl(lockKey);
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
            const count = await redis_js_1.redis.incr(key);
            // Set expiry on first request in window
            if (count === 1) {
                await redis_js_1.redis.expire(key, windowSecs);
            }
            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', config.maxAttempts.toString());
            res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxAttempts - count).toString());
            // Check if limit exceeded
            if (count > config.maxAttempts) {
                const blockSecs = Math.ceil(config.blockDurationMs / 1000);
                await redis_js_1.redis.setex(lockKey, blockSecs, '1');
                res.setHeader('Retry-After', blockSecs.toString());
                res.status(429).json({
                    error: 'Too many attempts. Please try again later.',
                    code: 'RATE_LIMITED',
                    retryAfter: blockSecs,
                });
                return;
            }
            next();
        }
        catch (error) {
            // In-memory fallback when Redis is unavailable
            const now = Date.now();
            // Check in-memory lock
            const lockExpiry = memoryLocks.get(lockKey);
            if (lockExpiry && lockExpiry > now) {
                const retryAfter = Math.ceil((lockExpiry - now) / 1000);
                res.setHeader('Retry-After', retryAfter.toString());
                res.status(429).json({
                    error: 'Too many attempts. Please try again later.',
                    code: 'RATE_LIMITED',
                    retryAfter,
                });
                return;
            }
            // Check/increment in-memory counter
            const entry = memoryStore.get(key);
            if (entry && entry.resetAt > now) {
                entry.count++;
                if (entry.count > config.maxAttempts) {
                    memoryLocks.set(lockKey, now + config.blockDurationMs);
                    const blockSecs = Math.ceil(config.blockDurationMs / 1000);
                    res.setHeader('Retry-After', blockSecs.toString());
                    res.status(429).json({
                        error: 'Too many attempts. Please try again later.',
                        code: 'RATE_LIMITED',
                        retryAfter: blockSecs,
                    });
                    return;
                }
            }
            else {
                memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
            }
            next();
        }
    };
}
/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
async function resetRateLimit(identifier, action) {
    const key = `${KEY_PREFIX}${identifier}:${action}`;
    const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;
    await redis_js_1.redis.del(key, lockKey);
}
/**
 * Check if an identifier is currently rate limited
 */
async function isRateLimited(identifier, action) {
    const lockKey = `${LOCK_PREFIX}${identifier}:${action}`;
    const ttl = await redis_js_1.redis.ttl(lockKey);
    if (ttl > 0) {
        return { limited: true, retryAfter: ttl };
    }
    return { limited: false };
}
// Pre-configured rate limiters for auth endpoints
exports.loginRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.login);
exports.registerRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.register);
exports.passwordResetRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.passwordReset);
exports.verifyEmailRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.verifyEmail);
exports.oauthRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.oauth);
exports.globalRateLimiter = createRateLimiter(auth_config_js_1.RATE_LIMIT_CONFIG.global);
//# sourceMappingURL=rateLimit.middleware.js.map