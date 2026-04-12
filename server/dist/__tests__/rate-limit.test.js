"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const rateLimit_middleware_js_1 = require("../middleware/rateLimit.middleware.js");
// Mock Redis — force the middleware into its in-memory fallback path
// by making every Redis call throw.
vitest_1.vi.mock('../db/redis.js', () => ({
    redis: {
        ttl: vitest_1.vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        incr: vitest_1.vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        expire: vitest_1.vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        setex: vitest_1.vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        del: vitest_1.vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    },
}));
// Mock IP utility so every request has a stable identifier
vitest_1.vi.mock('../utils/ip.utils.js', () => ({
    getClientIp: () => '127.0.0.1',
    getDeviceInfo: () => ({ userAgent: 'test', ipAddress: '127.0.0.1' }),
}));
// Use a counter to give each test a unique path so the in-memory store
// doesn't leak state between tests (the store is module-level and not resettable).
let pathCounter = 0;
function uniquePath() {
    return `/test-${++pathCounter}`;
}
(0, vitest_1.describe)('Rate Limiting Middleware', () => {
    (0, vitest_1.describe)('createRateLimiter — in-memory fallback', () => {
        (0, vitest_1.it)('should allow requests within the limit', async () => {
            const path = uniquePath();
            const app = (0, express_1.default)();
            const limiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
                windowMs: 60_000,
                maxAttempts: 3,
                blockDurationMs: 60_000,
            });
            app.post(path, limiter, (_req, res) => res.json({ ok: true }));
            const request = (0, supertest_1.default)(app);
            const res = await request.post(path);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.ok).toBe(true);
        });
        (0, vitest_1.it)('should return 429 after exceeding the limit', async () => {
            const path = uniquePath();
            const app = (0, express_1.default)();
            const limiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
                windowMs: 60_000,
                maxAttempts: 3,
                blockDurationMs: 60_000,
            });
            app.post(path, limiter, (_req, res) => res.json({ ok: true }));
            const request = (0, supertest_1.default)(app);
            // 3 allowed, 4th triggers block
            for (let i = 0; i < 3; i++) {
                const res = await request.post(path);
                (0, vitest_1.expect)(res.status).toBe(200);
            }
            const blocked = await request.post(path);
            (0, vitest_1.expect)(blocked.status).toBe(429);
            (0, vitest_1.expect)(blocked.body.code).toBe('RATE_LIMITED');
            (0, vitest_1.expect)(blocked.body.retryAfter).toBeDefined();
        });
        (0, vitest_1.it)('should include Retry-After header when rate limited', async () => {
            const path = uniquePath();
            const app = (0, express_1.default)();
            const limiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
                windowMs: 60_000,
                maxAttempts: 2,
                blockDurationMs: 60_000,
            });
            app.post(path, limiter, (_req, res) => res.json({ ok: true }));
            const request = (0, supertest_1.default)(app);
            // Exhaust limit
            for (let i = 0; i < 2; i++) {
                await request.post(path);
            }
            const blocked = await request.post(path);
            (0, vitest_1.expect)(blocked.status).toBe(429);
            (0, vitest_1.expect)(blocked.headers['retry-after']).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Different endpoints get independent limits', () => {
        (0, vitest_1.it)('should apply different limits per endpoint', async () => {
            const strictPath = uniquePath();
            const relaxedPath = uniquePath();
            const app = (0, express_1.default)();
            const strictLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
                windowMs: 60_000,
                maxAttempts: 1,
                blockDurationMs: 60_000,
            });
            const relaxedLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
                windowMs: 60_000,
                maxAttempts: 10,
                blockDurationMs: 60_000,
            });
            app.post(strictPath, strictLimiter, (_req, res) => res.json({ ok: true }));
            app.post(relaxedPath, relaxedLimiter, (_req, res) => res.json({ ok: true }));
            const request = (0, supertest_1.default)(app);
            // First request to strict passes
            const s1 = await request.post(strictPath);
            (0, vitest_1.expect)(s1.status).toBe(200);
            // Second request to strict should be blocked
            const s2 = await request.post(strictPath);
            (0, vitest_1.expect)(s2.status).toBe(429);
            // Relaxed endpoint should still be accessible
            const r1 = await request.post(relaxedPath);
            (0, vitest_1.expect)(r1.status).toBe(200);
        });
    });
});
//# sourceMappingURL=rate-limit.test.js.map