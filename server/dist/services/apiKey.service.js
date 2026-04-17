"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = exports.ApiKeyService = exports.API_SCOPES = exports.RATE_LIMIT_TIERS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../db/index.js");
/**
 * Rate limit configuration per tier
 */
exports.RATE_LIMIT_TIERS = {
    free: {
        requestsPerMinute: 10,
        requestsPerDay: 100,
        concurrentAudits: 1,
    },
    starter: {
        requestsPerMinute: 60,
        requestsPerDay: 1000,
        concurrentAudits: 3,
    },
    pro: {
        requestsPerMinute: 300,
        requestsPerDay: 10000,
        concurrentAudits: 10,
    },
    enterprise: {
        requestsPerMinute: 1000,
        requestsPerDay: -1, // unlimited
        concurrentAudits: 50,
    },
};
/**
 * Available API scopes
 */
exports.API_SCOPES = [
    'audits:read',
    'audits:write',
    'findings:read',
    'findings:write',
    'exports:read',
];
/**
 * API Key Service
 * Handles creation, validation, and management of API keys
 */
class ApiKeyService {
    /**
     * Generate a secure random API key
     * Format: kt_live_<32 random hex chars>
     */
    generateKey() {
        const randomBytes = crypto_1.default.randomBytes(24);
        const keyBody = randomBytes.toString('base64url');
        const key = `kt_live_${keyBody}`;
        const prefix = key.substring(0, 12); // "kt_live_xxxx"
        const hash = this.hashKey(key);
        return { key, prefix, hash };
    }
    /**
     * Hash an API key using SHA-256
     */
    hashKey(key) {
        return crypto_1.default.createHash('sha256').update(key).digest('hex');
    }
    /**
     * Create a new API key for a user
     * Returns the full key (only shown once!)
     */
    async createKey(input) {
        const { key, prefix, hash } = this.generateKey();
        const result = await index_js_1.pool.query(`INSERT INTO api_keys (user_id, name, key_prefix, key_hash, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, key_prefix, scopes, rate_limit_tier,
                 last_used_at, last_used_ip, request_count, is_active,
                 expires_at, revoked_at, revoked_reason, created_at, updated_at`, [
            input.userId,
            input.name,
            prefix,
            hash,
            input.scopes || ['audits:read', 'audits:write'],
            input.expiresAt || null,
        ]);
        return {
            apiKey: result.rows[0],
            secretKey: key, // Only returned once!
        };
    }
    /**
     * Validate an API key and return the associated key data
     * Returns null if key is invalid, expired, or revoked
     */
    async validateKey(key) {
        if (!key || (!key.startsWith('kt_live_') && !key.startsWith('pp_live_'))) {
            return null;
        }
        const hash = this.hashKey(key);
        const result = await index_js_1.pool.query(`SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE key_hash = $1`, [hash]);
        if (result.rows.length === 0) {
            return null;
        }
        const apiKey = result.rows[0];
        // Check if active
        if (!apiKey.is_active) {
            return null;
        }
        // Check if revoked
        if (apiKey.revoked_at) {
            return null;
        }
        // Check if expired
        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
            return null;
        }
        // Get rate limits for the tier
        const rateLimits = exports.RATE_LIMIT_TIERS[apiKey.rate_limit_tier] || exports.RATE_LIMIT_TIERS.free;
        return {
            ...apiKey,
            rateLimits,
        };
    }
    /**
     * Record API key usage (called after successful request)
     */
    async recordUsage(keyId, ipAddress) {
        await index_js_1.pool.query(`UPDATE api_keys
       SET last_used_at = NOW(),
           last_used_ip = $2,
           request_count = request_count + 1,
           updated_at = NOW()
       WHERE id = $1`, [keyId, ipAddress || null]);
    }
    /**
     * Log an API request for analytics and rate limiting
     */
    async logRequest(keyId, method, path, statusCode, responseTimeMs, ipAddress, userAgent) {
        await index_js_1.pool.query(`INSERT INTO api_requests (api_key_id, method, path, status_code, response_time_ms, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [keyId, method, path, statusCode, responseTimeMs, ipAddress || null, userAgent || null]);
    }
    /**
     * Check rate limits for an API key
     * Returns { allowed: boolean, retryAfter?: number }
     */
    async checkRateLimit(keyId, tier) {
        const limits = exports.RATE_LIMIT_TIERS[tier];
        // Check requests per minute
        const minuteResult = await index_js_1.pool.query(`SELECT COUNT(*) as count FROM api_requests
       WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`, [keyId]);
        const minuteCount = parseInt(minuteResult.rows[0].count, 10);
        if (minuteCount >= limits.requestsPerMinute) {
            return { allowed: false, retryAfter: 60 };
        }
        // Check requests per day (skip for unlimited)
        if (limits.requestsPerDay > 0) {
            const dayResult = await index_js_1.pool.query(`SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 day'`, [keyId]);
            const dayCount = parseInt(dayResult.rows[0].count, 10);
            if (dayCount >= limits.requestsPerDay) {
                return { allowed: false, retryAfter: 86400 };
            }
        }
        return { allowed: true };
    }
    /**
     * Get all API keys for a user
     */
    async getUserKeys(userId) {
        const result = await index_js_1.pool.query(`SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`, [userId]);
        return result.rows;
    }
    /**
     * Get a specific API key by ID (for user)
     */
    async getKey(keyId, userId) {
        const result = await index_js_1.pool.query(`SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE id = $1 AND user_id = $2`, [keyId, userId]);
        return result.rows[0] || null;
    }
    /**
     * Update an API key's name or scopes
     */
    async updateKey(keyId, userId, updates) {
        const setClauses = ['updated_at = NOW()'];
        const values = [keyId, userId];
        let paramIndex = 3;
        if (updates.name !== undefined) {
            setClauses.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }
        if (updates.scopes !== undefined) {
            setClauses.push(`scopes = $${paramIndex++}`);
            values.push(updates.scopes);
        }
        const result = await index_js_1.pool.query(`UPDATE api_keys
       SET ${setClauses.join(', ')}
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id, user_id, name, key_prefix, scopes, rate_limit_tier,
                 last_used_at, last_used_ip, request_count, is_active,
                 expires_at, revoked_at, revoked_reason, created_at, updated_at`, values);
        return result.rows[0] || null;
    }
    /**
     * Revoke an API key
     */
    async revokeKey(keyId, userId, reason) {
        const result = await index_js_1.pool.query(`UPDATE api_keys
       SET is_active = false,
           revoked_at = NOW(),
           revoked_reason = $3,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id`, [keyId, userId, reason || 'Revoked by user']);
        return (result.rowCount || 0) > 0;
    }
    /**
     * Delete an API key permanently
     */
    async deleteKey(keyId, userId) {
        const result = await index_js_1.pool.query(`DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id`, [keyId, userId]);
        return (result.rowCount || 0) > 0;
    }
    /**
     * Get API key usage statistics
     */
    async getKeyStats(keyId, userId) {
        // Verify ownership
        const key = await this.getKey(keyId, userId);
        if (!key)
            return null;
        const [totalResult, todayResult, weekResult, avgResult, topResult] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(*) as count FROM api_requests WHERE api_key_id = $1`, [keyId]),
            index_js_1.pool.query(`SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 day'`, [keyId]),
            index_js_1.pool.query(`SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '7 days'`, [keyId]),
            index_js_1.pool.query(`SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM api_requests WHERE api_key_id = $1`, [keyId]),
            index_js_1.pool.query(`SELECT path, COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1
         GROUP BY path
         ORDER BY count DESC
         LIMIT 5`, [keyId]),
        ]);
        return {
            totalRequests: parseInt(totalResult.rows[0].count, 10),
            requestsToday: parseInt(todayResult.rows[0].count, 10),
            requestsThisWeek: parseInt(weekResult.rows[0].count, 10),
            avgResponseTime: Math.round(parseFloat(avgResult.rows[0].avg)),
            topEndpoints: topResult.rows.map((r) => ({ path: r.path, count: parseInt(r.count, 10) })),
        };
    }
}
exports.ApiKeyService = ApiKeyService;
// Export singleton instance
exports.apiKeyService = new ApiKeyService();
//# sourceMappingURL=apiKey.service.js.map