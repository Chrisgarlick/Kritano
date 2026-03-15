import type { Options as Argon2Options } from 'argon2';

// Argon2id configuration (OWASP 2024 recommendations)
export const ARGON2_CONFIG: Argon2Options = {
  type: 2, // argon2id
  memoryCost: 65536, // 64 MiB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel threads
  hashLength: 32, // 256-bit output
};

// JWT configuration
export const JWT_CONFIG = {
  accessTokenExpiry: 14400 as const, // 4 hours in seconds
  issuer: 'pagepulser.com',
  audience: 'pagepulser-api',
  algorithm: 'HS256' as const,
};

// Refresh token configuration
export const REFRESH_TOKEN_CONFIG = {
  expiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  absoluteExpiryMs: 30 * 24 * 60 * 60 * 1000, // 30 days hard limit
  tokenLength: 32, // 256 bits
};

// Email verification token configuration
export const EMAIL_TOKEN_CONFIG = {
  verificationExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  passwordResetExpiryMs: 60 * 60 * 1000, // 1 hour
  tokenLength: 32, // 256 bits
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
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
export const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  resetFailedAttemptsAfterMs: 60 * 60 * 1000, // 1 hour
};

// Password requirements
export const PASSWORD_CONFIG = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

// Cookie configuration
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  // domain is set dynamically based on environment
};

// OAuth state cookie configuration (sameSite: lax for cross-origin redirects)
export const OAUTH_STATE_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// CSRF configuration
export const CSRF_CONFIG = {
  tokenLength: 32,
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
};
