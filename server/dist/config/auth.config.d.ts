import type { Options as Argon2Options } from 'argon2';
export declare const ARGON2_CONFIG: Argon2Options;
export declare const JWT_CONFIG: {
    accessTokenExpiry: 14400;
    issuer: string;
    audience: string;
    algorithm: "HS256";
};
export declare const REFRESH_TOKEN_CONFIG: {
    expiryMs: number;
    absoluteExpiryMs: number;
    tokenLength: number;
};
export declare const EMAIL_TOKEN_CONFIG: {
    verificationExpiryMs: number;
    passwordResetExpiryMs: number;
    tokenLength: number;
};
export declare const RATE_LIMIT_CONFIG: {
    login: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
    register: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
    passwordReset: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
    verifyEmail: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
    oauth: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
    global: {
        windowMs: number;
        maxAttempts: number;
        blockDurationMs: number;
    };
};
export declare const LOCKOUT_CONFIG: {
    maxFailedAttempts: number;
    lockoutDurationMs: number;
    resetFailedAttemptsAfterMs: number;
};
export declare const PASSWORD_CONFIG: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
};
export declare const COOKIE_CONFIG: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict";
    path: string;
};
export declare const OAUTH_STATE_COOKIE_CONFIG: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
};
export declare const CSRF_CONFIG: {
    tokenLength: number;
    cookieName: string;
    headerName: string;
};
//# sourceMappingURL=auth.config.d.ts.map