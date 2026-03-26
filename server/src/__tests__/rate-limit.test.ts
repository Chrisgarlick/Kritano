import { describe, it, expect, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';

// Mock Redis — force the middleware into its in-memory fallback path
// by making every Redis call throw.
vi.mock('../db/redis.js', () => ({
  redis: {
    ttl: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    incr: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    expire: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    setex: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    del: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
  },
}));

// Mock IP utility so every request has a stable identifier
vi.mock('../utils/ip.utils.js', () => ({
  getClientIp: () => '127.0.0.1',
  getDeviceInfo: () => ({ userAgent: 'test', ipAddress: '127.0.0.1' }),
}));

// Use a counter to give each test a unique path so the in-memory store
// doesn't leak state between tests (the store is module-level and not resettable).
let pathCounter = 0;
function uniquePath() {
  return `/test-${++pathCounter}`;
}

describe('Rate Limiting Middleware', () => {
  describe('createRateLimiter — in-memory fallback', () => {
    it('should allow requests within the limit', async () => {
      const path = uniquePath();
      const app = express();
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxAttempts: 3,
        blockDurationMs: 60_000,
      });
      app.post(path, limiter, (_req, res) => res.json({ ok: true }));
      const request = supertest(app);

      const res = await request.post(path);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should return 429 after exceeding the limit', async () => {
      const path = uniquePath();
      const app = express();
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxAttempts: 3,
        blockDurationMs: 60_000,
      });
      app.post(path, limiter, (_req, res) => res.json({ ok: true }));
      const request = supertest(app);

      // 3 allowed, 4th triggers block
      for (let i = 0; i < 3; i++) {
        const res = await request.post(path);
        expect(res.status).toBe(200);
      }

      const blocked = await request.post(path);
      expect(blocked.status).toBe(429);
      expect(blocked.body.code).toBe('RATE_LIMITED');
      expect(blocked.body.retryAfter).toBeDefined();
    });

    it('should include Retry-After header when rate limited', async () => {
      const path = uniquePath();
      const app = express();
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxAttempts: 2,
        blockDurationMs: 60_000,
      });
      app.post(path, limiter, (_req, res) => res.json({ ok: true }));
      const request = supertest(app);

      // Exhaust limit
      for (let i = 0; i < 2; i++) {
        await request.post(path);
      }

      const blocked = await request.post(path);
      expect(blocked.status).toBe(429);
      expect(blocked.headers['retry-after']).toBeDefined();
    });
  });

  describe('Different endpoints get independent limits', () => {
    it('should apply different limits per endpoint', async () => {
      const strictPath = uniquePath();
      const relaxedPath = uniquePath();
      const app = express();

      const strictLimiter = createRateLimiter({
        windowMs: 60_000,
        maxAttempts: 1,
        blockDurationMs: 60_000,
      });
      const relaxedLimiter = createRateLimiter({
        windowMs: 60_000,
        maxAttempts: 10,
        blockDurationMs: 60_000,
      });

      app.post(strictPath, strictLimiter, (_req, res) => res.json({ ok: true }));
      app.post(relaxedPath, relaxedLimiter, (_req, res) => res.json({ ok: true }));
      const request = supertest(app);

      // First request to strict passes
      const s1 = await request.post(strictPath);
      expect(s1.status).toBe(200);

      // Second request to strict should be blocked
      const s2 = await request.post(strictPath);
      expect(s2.status).toBe(429);

      // Relaxed endpoint should still be accessible
      const r1 = await request.post(relaxedPath);
      expect(r1.status).toBe(200);
    });
  });
});
