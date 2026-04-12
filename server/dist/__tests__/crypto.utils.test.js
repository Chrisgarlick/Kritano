"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const crypto_utils_js_1 = require("../utils/crypto.utils.js");
(0, vitest_1.describe)('Crypto Utils', () => {
    (0, vitest_1.describe)('generateSecureToken', () => {
        (0, vitest_1.it)('should return a base64url string', () => {
            const token = (0, crypto_utils_js_1.generateSecureToken)();
            // base64url uses only [A-Za-z0-9_-] characters
            (0, vitest_1.expect)(token).toMatch(/^[A-Za-z0-9_-]+$/);
        });
        (0, vitest_1.it)('should return correct length for default (32 bytes)', () => {
            const token = (0, crypto_utils_js_1.generateSecureToken)();
            // 32 bytes = 43 base64url characters (no padding)
            (0, vitest_1.expect)(token.length).toBe(43);
        });
        (0, vitest_1.it)('should return correct length for custom byte count', () => {
            const token16 = (0, crypto_utils_js_1.generateSecureToken)(16);
            // 16 bytes = 22 base64url characters
            (0, vitest_1.expect)(token16.length).toBe(22);
            const token64 = (0, crypto_utils_js_1.generateSecureToken)(64);
            // 64 bytes = 86 base64url characters
            (0, vitest_1.expect)(token64.length).toBe(86);
        });
        (0, vitest_1.it)('should generate unique tokens', () => {
            const tokens = new Set(Array.from({ length: 100 }, () => (0, crypto_utils_js_1.generateSecureToken)()));
            (0, vitest_1.expect)(tokens.size).toBe(100);
        });
    });
    (0, vitest_1.describe)('hashToken', () => {
        (0, vitest_1.it)('should return a hex-encoded SHA-256 hash (64 chars)', () => {
            const hash = (0, crypto_utils_js_1.hashToken)('test-token');
            (0, vitest_1.expect)(hash).toMatch(/^[a-f0-9]{64}$/);
        });
        (0, vitest_1.it)('should be deterministic — same input produces same hash', () => {
            const hash1 = (0, crypto_utils_js_1.hashToken)('my-secret-token');
            const hash2 = (0, crypto_utils_js_1.hashToken)('my-secret-token');
            (0, vitest_1.expect)(hash1).toBe(hash2);
        });
        (0, vitest_1.it)('should produce different hashes for different inputs', () => {
            const hash1 = (0, crypto_utils_js_1.hashToken)('token-a');
            const hash2 = (0, crypto_utils_js_1.hashToken)('token-b');
            (0, vitest_1.expect)(hash1).not.toBe(hash2);
        });
    });
    (0, vitest_1.describe)('timingSafeEqual', () => {
        (0, vitest_1.it)('should return true for identical strings', () => {
            (0, vitest_1.expect)((0, crypto_utils_js_1.timingSafeEqual)('hello', 'hello')).toBe(true);
        });
        (0, vitest_1.it)('should return false for different strings of equal length', () => {
            (0, vitest_1.expect)((0, crypto_utils_js_1.timingSafeEqual)('hello', 'world')).toBe(false);
        });
        (0, vitest_1.it)('should return false for strings of different length', () => {
            (0, vitest_1.expect)((0, crypto_utils_js_1.timingSafeEqual)('short', 'a-much-longer-string')).toBe(false);
        });
        (0, vitest_1.it)('should return true for empty strings', () => {
            (0, vitest_1.expect)((0, crypto_utils_js_1.timingSafeEqual)('', '')).toBe(true);
        });
        (0, vitest_1.it)('should return false when one string is empty', () => {
            (0, vitest_1.expect)((0, crypto_utils_js_1.timingSafeEqual)('', 'notempty')).toBe(false);
        });
    });
});
//# sourceMappingURL=crypto.utils.test.js.map