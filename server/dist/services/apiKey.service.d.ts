/**
 * Rate limit configuration per tier
 */
export declare const RATE_LIMIT_TIERS: {
    readonly free: {
        readonly requestsPerMinute: 10;
        readonly requestsPerDay: 100;
        readonly concurrentAudits: 1;
    };
    readonly starter: {
        readonly requestsPerMinute: 60;
        readonly requestsPerDay: 1000;
        readonly concurrentAudits: 3;
    };
    readonly pro: {
        readonly requestsPerMinute: 300;
        readonly requestsPerDay: 10000;
        readonly concurrentAudits: 10;
    };
    readonly enterprise: {
        readonly requestsPerMinute: 1000;
        readonly requestsPerDay: -1;
        readonly concurrentAudits: 50;
    };
};
export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;
/**
 * Available API scopes
 */
export declare const API_SCOPES: readonly ["audits:read", "audits:write", "findings:read", "findings:write", "exports:read"];
export type ApiScope = (typeof API_SCOPES)[number];
export interface ApiKey {
    id: string;
    user_id: string;
    name: string;
    key_prefix: string;
    scopes: ApiScope[];
    rate_limit_tier: RateLimitTier;
    last_used_at: Date | null;
    last_used_ip: string | null;
    request_count: number;
    is_active: boolean;
    expires_at: Date | null;
    revoked_at: Date | null;
    revoked_reason: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface CreateApiKeyInput {
    userId: string;
    name: string;
    scopes?: ApiScope[];
    expiresAt?: Date | null;
}
export interface ValidatedApiKey extends ApiKey {
    rateLimits: (typeof RATE_LIMIT_TIERS)[RateLimitTier];
}
/**
 * API Key Service
 * Handles creation, validation, and management of API keys
 */
export declare class ApiKeyService {
    /**
     * Generate a secure random API key
     * Format: kt_live_<32 random hex chars>
     */
    private generateKey;
    /**
     * Hash an API key using SHA-256
     */
    private hashKey;
    /**
     * Create a new API key for a user
     * Returns the full key (only shown once!)
     */
    createKey(input: CreateApiKeyInput): Promise<{
        apiKey: ApiKey;
        secretKey: string;
    }>;
    /**
     * Validate an API key and return the associated key data
     * Returns null if key is invalid, expired, or revoked
     */
    validateKey(key: string): Promise<ValidatedApiKey | null>;
    /**
     * Record API key usage (called after successful request)
     */
    recordUsage(keyId: string, ipAddress?: string): Promise<void>;
    /**
     * Log an API request for analytics and rate limiting
     */
    logRequest(keyId: string, method: string, path: string, statusCode: number, responseTimeMs: number, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Check rate limits for an API key
     * Returns { allowed: boolean, retryAfter?: number }
     */
    checkRateLimit(keyId: string, tier: RateLimitTier): Promise<{
        allowed: boolean;
        retryAfter?: number;
    }>;
    /**
     * Get all API keys for a user
     */
    getUserKeys(userId: string): Promise<ApiKey[]>;
    /**
     * Get a specific API key by ID (for user)
     */
    getKey(keyId: string, userId: string): Promise<ApiKey | null>;
    /**
     * Update an API key's name or scopes
     */
    updateKey(keyId: string, userId: string, updates: {
        name?: string;
        scopes?: ApiScope[];
    }): Promise<ApiKey | null>;
    /**
     * Revoke an API key
     */
    revokeKey(keyId: string, userId: string, reason?: string): Promise<boolean>;
    /**
     * Delete an API key permanently
     */
    deleteKey(keyId: string, userId: string): Promise<boolean>;
    /**
     * Get API key usage statistics
     */
    getKeyStats(keyId: string, userId: string): Promise<{
        totalRequests: number;
        requestsToday: number;
        requestsThisWeek: number;
        avgResponseTime: number;
        topEndpoints: {
            path: string;
            count: number;
        }[];
    } | null>;
}
export declare const apiKeyService: ApiKeyService;
//# sourceMappingURL=apiKey.service.d.ts.map