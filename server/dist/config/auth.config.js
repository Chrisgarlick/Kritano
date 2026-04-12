"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_CONFIG = exports.OAUTH_STATE_COOKIE_CONFIG = exports.COOKIE_CONFIG = exports.PASSWORD_CONFIG = exports.LOCKOUT_CONFIG = exports.RATE_LIMIT_CONFIG = exports.EMAIL_TOKEN_CONFIG = exports.REFRESH_TOKEN_CONFIG = exports.JWT_CONFIG = exports.ARGON2_CONFIG = void 0;
// Argon2id configuration (OWASP 2024 recommendations)
exports.ARGON2_CONFIG = {
    type: 2, // argon2id
    memoryCost: 65536, // 64 MiB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 parallel threads
    hashLength: 32, // 256-bit output
};
// JWT configuration
exports.JWT_CONFIG = {
    accessTokenExpiry: 14400, // 4 hours in seconds
    issuer: 'kritano.com',
    audience: 'kritano-api',
    algorithm: 'HS256',
};
// Refresh token configuration
exports.REFRESH_TOKEN_CONFIG = {
    expiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    absoluteExpiryMs: 30 * 24 * 60 * 60 * 1000, // 30 days hard limit
    tokenLength: 32, // 256 bits
};
// Email verification token configuration
exports.EMAIL_TOKEN_CONFIG = {
    verificationExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
    passwordResetExpiryMs: 60 * 60 * 1000, // 1 hour
    tokenLength: 32, // 256 bits
};
// Rate limiting configuration
exports.RATE_LIMIT_CONFIG = {
    login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    register: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxAttempts: 3,
        blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxAttempts: 3,
        blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    verifyEmail: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxAttempts: 15,
        blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    oauth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    global: {
        windowMs: 60 * 1000, // 1 minute
        maxAttempts: 100,
        blockDurationMs: 60 * 1000, // 1 minute
    },
};
// Account lockout configuration
exports.LOCKOUT_CONFIG = {
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
    resetFailedAttemptsAfterMs: 60 * 60 * 1000, // 1 hour
};
// Password requirements
exports.PASSWORD_CONFIG = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};
// Cookie configuration
exports.COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    // domain is set dynamically based on environment
};
// OAuth state cookie configuration (sameSite: lax for cross-origin redirects)
exports.OAUTH_STATE_COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
};
// CSRF configuration
exports.CSRF_CONFIG = {
    tokenLength: 32,
    cookieName: 'csrf_token',
    headerName: 'x-csrf-token',
};
//# sourceMappingURL=auth.config.js.map