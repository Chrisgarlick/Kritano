import crypto from 'crypto';
import { pool } from '../db/index.js';

/**
 * Rate limit configuration per tier
 */
export const RATE_LIMIT_TIERS = {
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
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

/**
 * Available API scopes
 */
export const API_SCOPES = [
  'audits:read',
  'audits:write',
  'findings:read',
  'findings:write',
  'exports:read',
] as const;

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
export class ApiKeyService {
  /**
   * Generate a secure random API key
   * Format: kt_live_<32 random hex chars>
   */
  private generateKey(): { key: string; prefix: string; hash: string } {
    const randomBytes = crypto.randomBytes(24);
    const keyBody = randomBytes.toString('base64url');
    const key = `kt_live_${keyBody}`;
    const prefix = key.substring(0, 12); // "kt_live_xxxx"
    const hash = this.hashKey(key);

    return { key, prefix, hash };
  }

  /**
   * Hash an API key using SHA-256
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create a new API key for a user
   * Returns the full key (only shown once!)
   */
  async createKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKey; secretKey: string }> {
    const { key, prefix, hash } = this.generateKey();

    const result = await pool.query<ApiKey>(
      `INSERT INTO api_keys (user_id, name, key_prefix, key_hash, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, key_prefix, scopes, rate_limit_tier,
                 last_used_at, last_used_ip, request_count, is_active,
                 expires_at, revoked_at, revoked_reason, created_at, updated_at`,
      [
        input.userId,
        input.name,
        prefix,
        hash,
        input.scopes || ['audits:read', 'audits:write'],
        input.expiresAt || null,
      ]
    );

    return {
      apiKey: result.rows[0],
      secretKey: key, // Only returned once!
    };
  }

  /**
   * Validate an API key and return the associated key data
   * Returns null if key is invalid, expired, or revoked
   */
  async validateKey(key: string): Promise<ValidatedApiKey | null> {
    if (!key || (!key.startsWith('kt_live_') && !key.startsWith('pp_live_'))) {
      return null;
    }

    const hash = this.hashKey(key);

    const result = await pool.query<ApiKey>(
      `SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE key_hash = $1`,
      [hash]
    );

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
    const rateLimits = RATE_LIMIT_TIERS[apiKey.rate_limit_tier] || RATE_LIMIT_TIERS.free;

    return {
      ...apiKey,
      rateLimits,
    };
  }

  /**
   * Record API key usage (called after successful request)
   */
  async recordUsage(keyId: string, ipAddress?: string): Promise<void> {
    await pool.query(
      `UPDATE api_keys
       SET last_used_at = NOW(),
           last_used_ip = $2,
           request_count = request_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [keyId, ipAddress || null]
    );
  }

  /**
   * Log an API request for analytics and rate limiting
   */
  async logRequest(
    keyId: string,
    method: string,
    path: string,
    statusCode: number,
    responseTimeMs: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO api_requests (api_key_id, method, path, status_code, response_time_ms, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [keyId, method, path, statusCode, responseTimeMs, ipAddress || null, userAgent || null]
    );
  }

  /**
   * Check rate limits for an API key
   * Returns { allowed: boolean, retryAfter?: number }
   */
  async checkRateLimit(keyId: string, tier: RateLimitTier): Promise<{ allowed: boolean; retryAfter?: number }> {
    const limits = RATE_LIMIT_TIERS[tier];

    // Check requests per minute
    const minuteResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM api_requests
       WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
      [keyId]
    );

    const minuteCount = parseInt(minuteResult.rows[0].count, 10);
    if (minuteCount >= limits.requestsPerMinute) {
      return { allowed: false, retryAfter: 60 };
    }

    // Check requests per day (skip for unlimited)
    if (limits.requestsPerDay > 0) {
      const dayResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 day'`,
        [keyId]
      );

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
  async getUserKeys(userId: string): Promise<ApiKey[]> {
    const result = await pool.query<ApiKey>(
      `SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get a specific API key by ID (for user)
   */
  async getKey(keyId: string, userId: string): Promise<ApiKey | null> {
    const result = await pool.query<ApiKey>(
      `SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
              last_used_at, last_used_ip, request_count, is_active,
              expires_at, revoked_at, revoked_reason, created_at, updated_at
       FROM api_keys
       WHERE id = $1 AND user_id = $2`,
      [keyId, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update an API key's name or scopes
   */
  async updateKey(
    keyId: string,
    userId: string,
    updates: { name?: string; scopes?: ApiScope[] }
  ): Promise<ApiKey | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [keyId, userId];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.scopes !== undefined) {
      setClauses.push(`scopes = $${paramIndex++}`);
      values.push(updates.scopes);
    }

    const result = await pool.query<ApiKey>(
      `UPDATE api_keys
       SET ${setClauses.join(', ')}
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id, user_id, name, key_prefix, scopes, rate_limit_tier,
                 last_used_at, last_used_ip, request_count, is_active,
                 expires_at, revoked_at, revoked_reason, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Revoke an API key
   */
  async revokeKey(keyId: string, userId: string, reason?: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE api_keys
       SET is_active = false,
           revoked_at = NOW(),
           revoked_reason = $3,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [keyId, userId, reason || 'Revoked by user']
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Delete an API key permanently
   */
  async deleteKey(keyId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id`,
      [keyId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get API key usage statistics
   */
  async getKeyStats(keyId: string, userId: string): Promise<{
    totalRequests: number;
    requestsToday: number;
    requestsThisWeek: number;
    avgResponseTime: number;
    topEndpoints: { path: string; count: number }[];
  } | null> {
    // Verify ownership
    const key = await this.getKey(keyId, userId);
    if (!key) return null;

    const [totalResult, todayResult, weekResult, avgResult, topResult] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM api_requests WHERE api_key_id = $1`,
        [keyId]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 day'`,
        [keyId]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [keyId]
      ),
      pool.query<{ avg: string }>(
        `SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM api_requests WHERE api_key_id = $1`,
        [keyId]
      ),
      pool.query<{ path: string; count: string }>(
        `SELECT path, COUNT(*) as count FROM api_requests
         WHERE api_key_id = $1
         GROUP BY path
         ORDER BY count DESC
         LIMIT 5`,
        [keyId]
      ),
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

// Export singleton instance
export const apiKeyService = new ApiKeyService();
