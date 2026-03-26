/**
 * Redis Cache-Aside Utility
 *
 * Simple cache-aside pattern: check Redis first, compute on miss, store with TTL.
 * If Redis is unavailable, falls through to direct computation silently.
 */

import { redis } from '../db/redis';

/**
 * Wraps an async computation with Redis caching.
 *
 * @param key   - Redis key (e.g. "admin:trends:30")
 * @param ttl   - Time-to-live in seconds
 * @param fn    - Async function that computes the value on cache miss
 * @returns The cached or freshly-computed value
 */
export async function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis unavailable — fall through to computation
  }

  const result = await fn();

  try {
    await redis.set(key, JSON.stringify(result), 'EX', ttl);
  } catch {
    // Redis unavailable — result is still returned, just not cached
  }

  return result;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Redis unavailable — ignore
  }
}

/**
 * Invalidate all keys matching a pattern (e.g. "admin:*").
 * Uses SCAN to avoid blocking Redis.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Redis unavailable — ignore
  }
}
