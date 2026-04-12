/**
 * Redis Cache-Aside Utility
 *
 * Simple cache-aside pattern: check Redis first, compute on miss, store with TTL.
 * If Redis is unavailable, falls through to direct computation silently.
 */
/**
 * Wraps an async computation with Redis caching.
 *
 * @param key   - Redis key (e.g. "admin:trends:30")
 * @param ttl   - Time-to-live in seconds
 * @param fn    - Async function that computes the value on cache miss
 * @returns The cached or freshly-computed value
 */
export declare function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>;
/**
 * Invalidate a specific cache key.
 */
export declare function invalidateCache(key: string): Promise<void>;
/**
 * Invalidate all keys matching a pattern (e.g. "admin:*").
 * Uses SCAN to avoid blocking Redis.
 */
export declare function invalidateCachePattern(pattern: string): Promise<void>;
//# sourceMappingURL=cache.utils.d.ts.map