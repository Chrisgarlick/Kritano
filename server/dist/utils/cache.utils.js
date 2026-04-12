"use strict";
/**
 * Redis Cache-Aside Utility
 *
 * Simple cache-aside pattern: check Redis first, compute on miss, store with TTL.
 * If Redis is unavailable, falls through to direct computation silently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCache = withCache;
exports.invalidateCache = invalidateCache;
exports.invalidateCachePattern = invalidateCachePattern;
const redis_1 = require("../db/redis");
/**
 * Wraps an async computation with Redis caching.
 *
 * @param key   - Redis key (e.g. "admin:trends:30")
 * @param ttl   - Time-to-live in seconds
 * @param fn    - Async function that computes the value on cache miss
 * @returns The cached or freshly-computed value
 */
async function withCache(key, ttl, fn) {
    try {
        const cached = await redis_1.redis.get(key);
        if (cached !== null) {
            return JSON.parse(cached);
        }
    }
    catch {
        // Redis unavailable — fall through to computation
    }
    const result = await fn();
    try {
        await redis_1.redis.set(key, JSON.stringify(result), 'EX', ttl);
    }
    catch {
        // Redis unavailable — result is still returned, just not cached
    }
    return result;
}
/**
 * Invalidate a specific cache key.
 */
async function invalidateCache(key) {
    try {
        await redis_1.redis.del(key);
    }
    catch {
        // Redis unavailable — ignore
    }
}
/**
 * Invalidate all keys matching a pattern (e.g. "admin:*").
 * Uses SCAN to avoid blocking Redis.
 */
async function invalidateCachePattern(pattern) {
    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis_1.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis_1.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
    catch {
        // Redis unavailable — ignore
    }
}
//# sourceMappingURL=cache.utils.js.map